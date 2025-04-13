import { TermImportData, TermAssignment, TermPersonnel, CourtTerm } from '../types/termTypes';
import { supabase } from '@/integrations/supabase/client';

/**
 * Safely parse a date string to ISO format
 * @param dateStr Date string to parse
 * @returns ISO date string or null if invalid
 */
function parseDate(dateStr: string): string | null {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return null;
    }
    return date.toISOString().split('T')[0];
  } catch (e) {
    console.warn('Invalid date format:', dateStr);
    return null;
  }
}

/**
 * Validate term data before returning
 * @param data Term data to validate
 * @returns Validated term data or throws error
 */
function validateTermData(data: TermImportData): TermImportData {
  if (!data.term.term_number || !data.term.term_name) {
    throw new Error('Term number and name are required');
  }
  if (!data.term.start_date || !data.term.end_date) {
    throw new Error('Term start and end dates are required');
  }
  if (!data.term.description) {
    throw new Error('Term description is required');
  }
  return data;
}

/**
 * Process manually entered text to extract court term data
 * This function parses the text to identify term details, assignments, and personnel
 */
export async function createTermFromManualInput(text: string): Promise<TermImportData> {
  console.log('Processing manual input text');
  
  try {
    // Initialize the structures to hold our parsed data
    const term: Partial<CourtTerm> = {
      term_number: '',
      term_name: '',
      description: '',
      start_date: '',
      end_date: '',
      location: ''
    };
    
    const personnel: Partial<TermPersonnel>[] = [];
    const assignments: Partial<TermAssignment>[] = [];
    
    // Split the text into lines and process it
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    if (lines.length === 0) {
      throw new Error('No valid content found in input text');
    }
    
    // Process first line as description (typically contains "SUPREME COURT" and term type)
    if (lines.length > 0) {
      term.description = lines[0];
      
      // Try to extract term name/number from description
      const termMatch = lines[0].match(/TERM\s+([IVX]+)/i) || lines[0].match(/([A-Z]+)\s+TERM/i);
      if (termMatch) {
        term.term_number = termMatch[1];
        term.term_name = `Term ${termMatch[1]}`;
      }
    }
    
    // Look for date ranges (second line typically)
    for (let i = 0; i < Math.min(3, lines.length); i++) {
      const dateLine = lines[i];
      const datePattern = /(\w+\s+\d{1,2},?\s+\d{4})\s*[-–—]\s*(\w+\s+\d{1,2},?\s+\d{4})/i;
      const dateMatch = dateLine.match(datePattern);
      
      if (dateMatch) {
        const startDate = parseDate(dateMatch[1]);
        const endDate = parseDate(dateMatch[2]);
        
        if (!startDate || !endDate) {
          console.warn('Invalid date format detected');
          continue;
        }
        
        term.start_date = startDate;
        term.end_date = endDate;
        
        // Validate that end date is after start date
        if (term.end_date < term.start_date) {
          throw new Error('Term end date must be after start date');
        }
        
        // If no term name/number was found earlier, try to extract from surrounding text
        if (!term.term_number) {
          const termNumberMatch = dateLine.match(/TERM\s+([IVX]+)/i) || dateLine.match(/([A-Z]+)\s+TERM/i);
          if (termNumberMatch) {
            term.term_number = termNumberMatch[1];
            term.term_name = `Term ${termNumberMatch[1]}`;
          }
        }
        
        break;
      }
    }
    
    // Look for location
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      if (lines[i].toUpperCase().includes('LOCATION:')) {
        term.location = lines[i].replace(/LOCATION:\s*/i, '').trim();
        break;
      } else if (lines[i].includes('CENTRE STREET') || lines[i].includes('CENTER STREET')) {
        term.location = lines[i];
        break;
      }
    }
    
    // Process personnel
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toUpperCase();
      const adminJudgeMatch = line.match(/ADMINISTRATIVE\s+JUDGE:?\s*(.*)/i) || 
                             line.match(/ADMIN\.?\s+JUDGE:?\s*(.*)/i) ||
                             line.match(/HON\.?\s*(.*?)\s*[-–—]?\s*ADMINISTRATIVE/i);
                               
      const chiefClerkMatch = line.match(/CHIEF\s+CLERK:?\s*(.*)/i);
      
      if (adminJudgeMatch) {
        const judgeName = adminJudgeMatch[1].trim();
        
        // Try to extract phone from the same line
        let phone = '';
        const phoneMatch = judgeName.match(/([\d-]+)$/);
        if (phoneMatch) {
          phone = phoneMatch[0];
        }
        
        personnel.push({
          role: 'administrative_judge' as any,
          name: judgeName.replace(phone, '').trim(),
          phone: phone
        });
      }
      
      if (chiefClerkMatch) {
        const clerkName = chiefClerkMatch[1].trim();
        
        // Try to extract phone from the same line
        let phone = '';
        const phoneMatch = clerkName.match(/([\d-]+)$/);
        if (phoneMatch) {
          phone = phoneMatch[0];
        }
        
        personnel.push({
          role: 'chief_clerk' as any,
          name: clerkName.replace(phone, '').trim(),
          phone: phone
        });
      }
    }
    
    // Find the assignments section
    let assignmentsStartIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].toUpperCase().includes('PART ASSIGNMENTS') || 
          lines[i].toUpperCase().includes('ASSIGNMENTS') || 
          lines[i].toUpperCase().includes('JUSTICE ASSIGNMENTS')) {
        assignmentsStartIndex = i + 1;
        break;
      }
    }
    
    // If we couldn't find an assignments section header, 
    // look for patterns that suggest assignments
    if (assignmentsStartIndex === -1) {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Common patterns in assignments:
        // PART 1 - JUSTICE NAME - ROOM 123
        // TAP A - HON. J. SMITH - ROOM 456
        if (/^(PART|TAP|IAS|COMP)/i.test(line) || 
            line.match(/^[A-Z]+\s+[A-Z](\s+[-–—]\s+|\s+)/) || 
            line.match(/^[0-9]+(\s+[-–—]\s+|\s+)/) ||
            line.match(/^[A-Z]{1,3}\s+[-–—]/) ||
            line.match(/^[A-Z]{1,3}[0-9]?\s+[-–—]/)) {
          assignmentsStartIndex = i;
          break;
        }
      }
    }
    
    // Process assignments
    if (assignmentsStartIndex !== -1) {
      for (let i = assignmentsStartIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // Skip lines that look like headers
        if (line.toUpperCase().includes('ASSIGNMENTS:') || 
            line.toUpperCase() === 'ASSIGNMENTS' ||
            line.toUpperCase() === 'JUSTICE ASSIGNMENTS') {
          continue;
        }
        
        // Parse the assignment line
        // Examples:
        // TAP A - HON. M. LEWIS - ROOM 1180 - 646-386-4107
        // PART 1 - HON. WASHINGTON - ROOM 1220 - 646-386-4033
        
        // First, try to identify part code at the beginning
        const partCodeMatch = line.match(/^(PART\s+[0-9]+|TAP\s+[A-Z]|IAS\s+[0-9]+|[A-Z]{1,3}\s*[0-9]*)/i);
        
        if (partCodeMatch) {
          const partCode = partCodeMatch[0].trim();
          const remainingText = line.substring(partCodeMatch[0].length).trim();
          
          // Split the remaining text on delimiters (dash, comma, etc.)
          const parts = remainingText.split(/\s*[-–—,]\s*/);
          
          let justiceName = '';
          let roomNumber = '';
          let phone = '';
          let fax = '';
          let clerkNames: string[] = [];
          
          // Extract justice name
          if (parts.length > 0) {
            justiceName = parts[0].replace(/^HON\.?\s*/i, '').trim();
          }
          
          // Extract room number
          for (const part of parts) {
            const roomMatch = part.match(/ROOM\s+([0-9]+)/i);
            if (roomMatch) {
              roomNumber = roomMatch[1];
              break;
            } else if (/^[0-9]{3,4}$/.test(part.trim())) {
              // If it's just a 3-4 digit number by itself, it's likely a room
              roomNumber = part.trim();
              break;
            }
          }
          
          // Extract phone number
          for (const part of parts) {
            const phoneMatch = part.match(/(\d{3}-\d{3}-\d{4})/);
            if (phoneMatch) {
              phone = phoneMatch[0];
              break;
            }
          }
          
          // Look for clerk information in subsequent lines
          if (i + 1 < lines.length && lines[i+1].toUpperCase().includes('CLERK')) {
            const clerkLine = lines[i+1];
            const clerkText = clerkLine.replace(/CLERK[S]?:?\s*/i, '').trim();
            clerkNames = clerkText.split(/\s*[,;]\s*/).map(name => name.trim()).filter(Boolean);
            i++; // Skip the clerk line in the next iteration
          }
          
          assignments.push({
            part_code: partCode,
            justice_name: justiceName,
            room_number: roomNumber,
            phone: phone,
            fax: fax,
            clerk_names: clerkNames.length > 0 ? clerkNames : []
          });
        }
      }
    }
    
    // Set default term details if not found
    if (!term.term_number) {
      term.term_number = 'I';
    }
    
    if (!term.term_name) {
      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      const currentMonth = months[new Date().getMonth()];
      term.term_name = `${currentMonth} TERM`;
    }
    
    if (!term.description) {
      term.description = 'SUPREME COURT TERM';
    }
    
    if (!term.start_date || !term.end_date) {
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      
      term.start_date = startOfMonth.toISOString().split('T')[0];
      term.end_date = endOfMonth.toISOString().split('T')[0];
    }
    
    if (!term.location) {
      term.location = '100 CENTRE STREET & 111 CENTRE STREET';
    }
    
    // Look up room IDs for the room numbers
    await matchRoomIdsForAssignments(assignments);
    
    return validateTermData({
      term: term as CourtTerm,
      personnel,
      assignments
    });
  } catch (error) {
    console.error('Error processing manual term input:', error);
    throw error;
  }
}

/**
 * Match room numbers in assignments to actual room IDs
 */
async function matchRoomIdsForAssignments(assignments: Partial<TermAssignment>[]): Promise<void> {
  // Only process if we have assignments with room numbers
  if (!assignments || assignments.length === 0) {
    console.log('No assignments to match room IDs for');
    return;
  }
  
  try {
    // Get all room numbers from the assignments
    const roomNumbers = assignments
      .filter(a => a.room_number)
      .map(a => a.room_number);
      
    if (roomNumbers.length === 0) {
      console.log('No room numbers to match');
      return;
    }
    
    console.log('Looking up room IDs for room numbers:', roomNumbers);
    
    // Query rooms by room numbers
    const { data: rooms, error } = await supabase
      .from('rooms')
      .select('id, room_number')
      .in('room_number', roomNumbers);
      
    if (error) {
      console.error('Error fetching rooms:', error);
      return;
    }
    
    console.log('Found rooms:', rooms);
    
    // Create a map of room_number -> id
    const roomMap = Object.fromEntries(
      (rooms || []).map(room => [room.room_number, room.id])
    );
    
    // Update assignments with room IDs
    for (const assignment of assignments) {
      if (assignment.room_number && roomMap[assignment.room_number]) {
        assignment.room_id = roomMap[assignment.room_number];
        console.log(`Matched room ${assignment.room_number} to ID ${assignment.room_id}`);
      }
    }
    
    console.log('Room ID matching complete');
  } catch (err) {
    console.error('Error matching room IDs:', err);
  }
}
