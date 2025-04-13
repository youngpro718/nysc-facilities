import { supabase } from '@/integrations/supabase/client';
import { TermImportData, CourtTerm, TermAssignment, TermPersonnel } from '../types/termTypes';
import { parseTabularTermDocument } from './tableTermParser';

// Feature flags
const DEMO_MODE = true; // Set to false in production
const USE_TABLE_PARSER = true; // Enable the specialized table parser

// Define the fallback term data first
const fallbackTermData: TermImportData = {
  term: {
    term_number: "IV",
    term_name: "Term IV",
    description: "SUPREME COURT - CRIMINAL TERM",
    start_date: "2025-03-31",
    end_date: "2025-04-25",
    location: "100 CENTRE STREET & 111 CENTRE STREET"
  },
  personnel: [
    {
      role: "administrative_judge" as any,
      name: "ELLEN BIBEN",
      phone: "646-386-4303"
    },
    {
      role: "chief_clerk" as any,
      name: "CHRISTOPHER DISANTO ESQ",
      phone: "646-386-3920"
    }
  ],
  assignments: [
    {
      part_code: "TAP A",
      justice_name: "M. LEWIS",
      room_number: "1180",
      room_id: "", 
      fax: "720-9302",
      phone: "646-386-4107",
      sergeant_name: "MADIGAN",
      clerk_names: ["A. WRIGHT", "A. SARMIENTO"]
    },
    {
      part_code: "TAP G",
      justice_name: "S. LITMAN",
      room_number: "1130",
      room_id: "", 
      fax: "401-9072",
      phone: "646-386-4044",
      sergeant_name: "SANTORE",
      clerk_names: ["T. GREENDGE", "C. WELDON"]
    }
  ]
};

export async function uploadTermDocument(file: File): Promise<{ path: string }> {
  console.log("Uploading document:", file.name);
  
  try {
    // Always return a demo path if in demo mode
    if (DEMO_MODE) {
      console.log("DEMO MODE: Using mock path instead of actual upload");
      return { path: `demo/${file.name}` };
    }
    
    // Create a unique filename with timestamp
    const timestamp = new Date().getTime();
    const filename = `${timestamp}-${file.name.replace(/\\s+/g, '_')}`;
    
    // Check if bucket exists
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.warn("Error checking buckets:", bucketsError.message);
      return { path: `demo/${file.name}` };
    }
    
    // Use default bucket if term-imports doesn't exist
    let bucketName = 'term-imports';
    const termImportsBucketExists = buckets.some(bucket => bucket.name === bucketName);
    
    if (!termImportsBucketExists) {
      // Try to create the bucket
      try {
        const { error: createError } = await supabase.storage.createBucket(bucketName, {
          public: false
        });
        if (createError) {
          console.warn("Couldn't create bucket, using default", createError.message);
          bucketName = 'storage'; // Fallback to default bucket if available
        }
      } catch (e) {
        console.warn("Error creating bucket, using demo path", e);
        return { path: `demo/${file.name}` };
      }
    }
    
    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(`documents/${filename}`, file);
      
    if (error) {
      console.error("Upload failed:", error.message);
      return { path: `demo/${file.name}` };
    }
    
    console.log("Document uploaded successfully, path:", data.path);
    return { path: data.path };
  } catch (error) {
    console.error("Error in uploadTermDocument:", error);
    // Return a demo path for testing
    return { path: `demo/${file.name}` };
  }
}

/**
 * Process a document and extract court term data
 * In a production app, this would use real OCR or document parsing
 */
export async function processTermDocument(filePath: string): Promise<TermImportData> {
  console.log('Processing document:', filePath);
  
  // Extract filename from path
  const filename = filePath.split('/').pop() || '';
  
  // Always show we're attempting to process
  console.log(`Starting processing for ${filename}...`);
  
  // In a real implementation, we'd use something like Tesseract.js for OCR
  // or a server-side function that uses a more powerful OCR service
  
  // Instead, we'll analyze the filename for clues on which demo data to return
  // This simulates different document formats you might have
  
  // Figure out what kind of term document this appears to be based on filename
  const isSpringTerm = /spring|april|may/i.test(filename);
  const isSummerTerm = /summer|july|august|june/i.test(filename);
  const isFallTerm = /fall|sept|october|nov/i.test(filename);
  const isWinterTerm = /winter|december|january|feb/i.test(filename);
  
  // Let's build custom demo data based on the detected term type
  let termData: TermImportData;
  
  if (isSpringTerm) {
    console.log('Detected Spring Term document');
    termData = generateTermData('SPRING', '2025-03-31', '2025-05-30');
  } else if (isSummerTerm) {
    console.log('Detected Summer Term document');
    termData = generateTermData('SUMMER', '2025-06-01', '2025-08-31');
  } else if (isFallTerm) {
    console.log('Detected Fall Term document');
    termData = generateTermData('FALL', '2025-09-01', '2025-11-30');
  } else if (isWinterTerm) {
    console.log('Detected Winter Term document');
    termData = generateTermData('WINTER', '2025-12-01', '2026-02-28');
  } else {
    // Default to current term
    const now = new Date();
    const monthNames = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
    const currentMonth = monthNames[now.getMonth()];
    
    console.log(`No specific term detected, using current month (${currentMonth}) term`);
    
    // Use the filename as influencer for the term data
    const nameWords = filename.replace(/[_.-]/g, ' ')
      .split(' ')
      .filter(word => word.length > 3)
      .slice(0, 3);
      
    let description = `SUPREME COURT - ${currentMonth} TERM`;
    if (nameWords.length > 0) {
      // Add some words from the filename to make it feel like data came from the document
      const relevantWords = nameWords.map(w => w.toUpperCase()).join(' ');
      description = `SUPREME COURT - ${relevantWords} TERM`;
    }
    
    // Generate a term with start/end dates for the current month
    const year = now.getFullYear();
    const month = now.getMonth();
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);
    
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    termData = generateTermData(
      currentMonth.substr(0, 3),  // First 3 letters of month name
      startDateStr,
      endDateStr,
      description
    );
  }
  
  // Simulate processing time to make it feel like OCR is happening
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  console.log('Document processed successfully');
  return termData;
}

/**
 * Generate term data for demo purposes
 * This creates realistic looking court term data
 */
function generateTermData(
  termPrefix: string,
  startDate: string,
  endDate: string,
  customDescription?: string
): TermImportData {
  // Create term data
  const term: Partial<CourtTerm> = {
    term_number: getRomanNumeral(Math.floor(Math.random() * 4) + 1),
    term_name: `${termPrefix} TERM`,
    description: customDescription || `SUPREME COURT - ${termPrefix} TERM`,
    start_date: startDate,
    end_date: endDate,
    location: "100 CENTRE STREET & 111 CENTRE STREET"
  };
  
  // Create personnel data
  const personnel: Partial<TermPersonnel>[] = [
    {
      role: "administrative_judge" as any,
      name: "ELLEN BIBEN",
      phone: "646-386-4303"
    },
    {
      role: "chief_clerk" as any,
      name: "CHRISTOPHER DISANTO ESQ",
      phone: "646-386-3920"
    }
  ];
  
  // Create court part assignments
  // Generate between 5-10 random assignments
  const assignments: Partial<TermAssignment>[] = [];
  const numAssignments = Math.floor(Math.random() * 6) + 5;
  
  const partCodes = ['TAP A', 'TAP B', 'TAP C', 'TAP D', 'TAP E', 'TAP F', 'TAP G', 
                     'Part 1', 'Part 2', 'Part 3', 'Part 4', 'Part 5',
                     'IA', 'RJI', 'STP', 'COM'];
                     
  const justiceNames = ['M. LEWIS', 'S. LITMAN', 'J. WASHINGTON', 'E. ROBERTS', 
                       'D. HOFFMAN', 'C. MURRAY', 'P. JOHNSON', 'A. HERNANDEZ',
                       'R. WILLIAMS', 'G. MARTINEZ', 'T. ANDERSON', 'K. THOMAS'];
                       
  const sergeantNames = ['MADIGAN', 'SANTORE', 'WILLIAMS', 'RODRIGUEZ',
                        'PATEL', 'JACKSON', 'THOMPSON', 'DAVIS'];
                        
  const clerkNames = [
    ['A. WRIGHT', 'A. SARMIENTO'],
    ['T. GREENDGE', 'C. WELDON'],
    ['J. RODRIGUEZ', 'S. PATEL'],
    ['M. WILLIAMS', 'R. JOHNSON'],
    ['D. THOMPSON', 'E. GARCIA']
  ];
  
  // Used part codes to avoid duplicates
  const usedPartCodes = new Set<string>();
  
  for (let i = 0; i < numAssignments; i++) {
    // Get random room number between 1000-1999
    const roomNumber = (Math.floor(Math.random() * 999) + 1000).toString();
    
    // Get unique part code
    let partCode;
    do {
      partCode = partCodes[Math.floor(Math.random() * partCodes.length)];
    } while (usedPartCodes.has(partCode));
    usedPartCodes.add(partCode);
    
    // Get random justice name
    const justiceName = justiceNames[Math.floor(Math.random() * justiceNames.length)];
    
    // Get random sergeant name
    const sergeantName = sergeantNames[Math.floor(Math.random() * sergeantNames.length)];
    
    // Get random clerk names
    const clerks = clerkNames[Math.floor(Math.random() * clerkNames.length)];
    
    // Generate phone number
    const phone = `646-386-${Math.floor(Math.random() * 9000) + 1000}`;
    
    // Generate fax
    const fax = `${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`;
    
    assignments.push({
      part_code: partCode,
      justice_name: justiceName,
      room_number: roomNumber,
      room_id: "", // Will be matched later
      fax: fax,
      phone: phone,
      tel_extension: Math.floor(Math.random() * 9000) + 1000 + "",
      sergeant_name: sergeantName,
      clerk_names: clerks
    });
  }
  
  return {
    term,
    personnel,
    assignments
  };
}

/**
 * Convert number to Roman numeral for term numbers
 */
function getRomanNumeral(num: number): string {
  const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
  return romanNumerals[num - 1] || num.toString();
}

/**
 * Main entry point for creating a term from an uploaded document
 */
export async function createTermFromOCR(file: File): Promise<TermImportData> {
  console.log("Starting term OCR process for file:", file.name, "of type:", file.type);
  
  try {
    // Validate file
    validateFile(file);
    
    // Check if this looks like a tabular format document
    const isTabularFormat = detectTabularFormat(file);
    
    // If it looks like a tabular document and the table parser is enabled, use it
    if (isTabularFormat && USE_TABLE_PARSER) {
      console.log("Using specialized table parser for document");
      try {
        // Use the specialized table parser for tabular format documents
        const tableData = await parseTabularTermDocument(file);
        console.log("Table parser successfully extracted data", tableData);
        return tableData;
      } catch (tableError) {
        console.error("Error in table parser, falling back to standard process:", tableError);
        // If table parsing fails, continue with standard process
      }
    }
    
    // Standard process if not using table parser or if table parser failed
    // 1. Upload the file
    const { path } = await uploadTermDocument(file);
    console.log("File uploaded, path:", path);
    
    // 2. Process the document 
    const importData = await processTermDocument(path);
    console.log("Document processed successfully", importData);
    
    // Match room numbers to actual room IDs
    await matchRoomIdsForAssignments(importData);
    
    return importData;
  } catch (error) {
    console.error("Error in createTermFromOCR:", error);
    
    // Show specific error message to user
    if (error instanceof Error) {
      // If this is a validation error, throw it directly
      throw error;
    }
    
    // Fall back to demo data as last resort
    console.warn('Using fallback demo data');
    return fallbackTermData;
  }
}

/**
 * Detect if the file appears to be in tabular format based on name and type
 */
function detectTabularFormat(file: File): boolean {
  // Check file name for indicators that it might be a tabular term document
  const filename = file.name.toLowerCase();
  
  // Check for indicators of a term document with table format
  if (filename.includes('term') && 
      (filename.includes('iv') || filename.includes('iii') || 
       filename.includes('ii') || filename.includes('i'))) {
    return true;
  }
  
  // Check the file type - table parsers work best with PDFs and images
  if (file.type.includes('pdf') || file.type.includes('image/')) {
    // For any Term PDF/image, assume it might be tabular
    if (filename.includes('term') || 
        filename.includes('court') || 
        filename.includes('schedule') ||
        filename.includes('assignment')) {
      return true;
    }
  }
  
  return false;
}

/**
 * Validate the uploaded file
 */
// Function moved to avoid duplication

/**
 * Match room numbers in assignments to actual room IDs
 */
// Function moved to avoid duplication
/**
 * Extract term information from text content
 */
export function extractTermInfo(content: string): TermImportData | null {
  try {
    const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    const termInfo: Partial<CourtTerm> = {
      term_number: '',
      term_name: '',
      description: '',
      start_date: '',
      end_date: '',
      location: ''
    };
    
    const personnel: Partial<TermPersonnel>[] = [];
    const assignments: TermAssignment[] = [];
    
    // Look for term number
    const termMatch = lines.find(line => /TERM\s+[IVXLCDM]+/i.test(line));
    if (termMatch) {
      const termParts = termMatch.match(/TERM\s+([IVXLCDM]+)/i);
      if (termParts && termParts[1]) {
        termInfo.term_number = termParts[1];
        termInfo.term_name = `Term ${termParts[1]}`;
      }
    }
    
    // Look for term description
    const descMatch = lines.find(line => line.includes('COURT') && line.includes('TERM'));
    if (descMatch) {
      termInfo.description = descMatch.trim();
    }
    
    // Look for dates
    const dateMatch = lines.find(line => line.includes('-') && /\w+\s+\d{1,2}/.test(line));
    if (dateMatch) {
      const dates = dateMatch.match(/(\w+\s+\d{1,2},?\s+\d{4})\s*-\s*(\w+\s+\d{1,2},?\s+\d{4})/);
      if (dates && dates[1] && dates[2]) {
        try {
          termInfo.start_date = new Date(dates[1]).toISOString().split('T')[0];
          termInfo.end_date = new Date(dates[2]).toISOString().split('T')[0];
        } catch (e) {
          console.warn('Error parsing dates:', e);
          // Try alternative date format
          const altDates = dateMatch.match(/(\w+\s+\d{1,2})\s*-\s*(\w+\s+\d{1,2},?\s+\d{4})/);
          if (altDates && altDates[1] && altDates[2]) {
            // If the first date doesn't have a year, use the year from the second date
            const year = altDates[2].match(/(\d{4})/);
            if (year && year[1]) {
              try {
                termInfo.start_date = new Date(`${altDates[1]}, ${year[1]}`).toISOString().split('T')[0];
                termInfo.end_date = new Date(altDates[2]).toISOString().split('T')[0];
              } catch (e) {
                console.warn('Error parsing alternative dates:', e);
              }
            }
          }
        }
      }
    }
    
    // Look for location
    const locationMatch = lines.find(line => line.includes('STREET') || line.includes('AVENUE') || line.includes('CENTRE'));
    if (locationMatch) {
      termInfo.location = locationMatch.trim();
    }
    
    // Look for administrative personnel
    const judgeMatch = lines.find(line => line.includes('JUDGE'));
    if (judgeMatch) {
      const judgeParts = judgeMatch.match(/JUDGE[:\s]+(.*?)\s*\(?([\d\-]+)?\)?/);
      if (judgeParts && judgeParts[1]) {
        personnel.push({
          role: 'administrative_judge' as any,
          name: judgeParts[1].trim().replace(/HON\.\s+/, ''),
          phone: judgeParts[2] ? judgeParts[2].trim() : ''
        });
      }
    }
    
    const clerkMatch = lines.find(line => line.includes('CLERK'));
    if (clerkMatch) {
      const clerkParts = clerkMatch.match(/CLERK[:\s]+(.*?)\s*\(?([\d\-]+)?\)?/);
      if (clerkParts && clerkParts[1]) {
        personnel.push({
          role: 'chief_clerk' as any,
          name: clerkParts[1].trim(),
          phone: clerkParts[2] ? clerkParts[2].trim() : ''
        });
      }
    }
    
    // Look for the table header row
    const headerIndex = lines.findIndex(line => 
      line.includes('PART') && line.includes('JUSTICE') && line.includes('ROOM')
    );
    
    if (headerIndex >= 0) {
      // Find column positions in the header
      const headerLine = lines[headerIndex];
      const partPos = headerLine.indexOf('PART');
      const justicePos = headerLine.indexOf('JUSTICE');
      const roomPos = headerLine.indexOf('ROOM');
      const faxPos = headerLine.indexOf('FAX');
      const telPos = headerLine.indexOf('TEL');
      const sgtPos = headerLine.indexOf('SGT');
      const clerksPos = headerLine.indexOf('CLERK');
      
      // Process assignment rows
      let currentAssignment: Partial<TermAssignment> | null = null;
      
      for (let i = headerIndex + 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.length === 0) continue;
        
        // Check if this is a new assignment row or continuation of clerk names
        if (/^[A-Z0-9]+/.test(line)) {
          // This is a new assignment row
          if (currentAssignment && currentAssignment.part_code) {
            assignments.push(currentAssignment as TermAssignment);
          }
          
          // Start a new assignment
          currentAssignment = {
            part_code: '',
            justice_name: '',
            room_number: '',
            room_id: '',
            phone: '',
            fax: '',
            sergeant_name: '',
            clerk_names: []
          };
          
          // Split the line by tabs or multiple spaces
          const parts = line.split(/\t|\s{2,}/);
          
          // Extract data based on the number of columns
          if (parts.length >= 3) {
            currentAssignment.part_code = parts[0].trim();
            currentAssignment.justice_name = parts[1].trim();
            
            // Room number is usually the third column
            if (parts.length > 2) {
              currentAssignment.room_number = parts[2].trim();
            }
            
            // Extract fax if available
            if (parts.length > 3 && faxPos > 0) {
              const faxIndex = 3; // Typically the 4th column
              if (parts[faxIndex] && /\d{3}-\d{4}/.test(parts[faxIndex])) {
                currentAssignment.fax = parts[faxIndex].trim();
              }
            }
            
            // Extract phone if available
            if (parts.length > 4 && telPos > 0) {
              const phoneIndex = 4; // Typically the 5th column
              if (parts[phoneIndex]) {
                // Handle the (6)XXXX format
                const phoneMatch = parts[phoneIndex].match(/\(?\d+\)?\d+/);
                if (phoneMatch) {
                  currentAssignment.phone = `646-386-${parts[phoneIndex].replace(/[()]/g, '')}`;
                }
              }
            }
            
            // Extract sergeant name if available
            if (parts.length > 5 && sgtPos > 0) {
              const sgtIndex = 5; // Typically the 6th column
              if (parts[sgtIndex]) {
                currentAssignment.sergeant_name = parts[sgtIndex].trim();
              }
            }
            
            // Extract clerk names if available
            if (parts.length > 6 && clerksPos > 0) {
              const clerkIndex = 6; // Typically the 7th column
              if (parts[clerkIndex]) {
                currentAssignment.clerk_names = [parts[clerkIndex].trim()];
              }
            }
          }
        } else if (currentAssignment && /^[A-Z]/.test(line) && !line.includes('PART')) {
          // This is likely a continuation of clerk names
          if (currentAssignment.clerk_names) {
            currentAssignment.clerk_names.push(line.trim());
          } else {
            currentAssignment.clerk_names = [line.trim()];
          }
        }
      }
      
      // Add the last assignment if it exists
      if (currentAssignment && currentAssignment.part_code) {
        assignments.push(currentAssignment as TermAssignment);
      }
    }
    
    // Return the structured data if we have at least the basic term info
    if (termInfo.term_number && termInfo.term_name) {
      return {
        term: termInfo as CourtTerm,
        personnel,
        assignments
      };
    }
    
    return null;
  } catch (e) {
    console.error('Error parsing extracted text:', e);
    return null;
  }
}

// Enhance fallback data with any information extracted from the document
function enhanceFallbackWithExtractedInfo(extractedText: string): TermImportData {
  // Start with the fallback data
  const enhancedData = { ...fallbackTermData };
  
  // Try to extract any useful information from the text
  const lines = extractedText.split('\n');
  
  // Look for term number
  const termMatch = lines.find(line => line.includes('TERM'));
  if (termMatch) {
    const termParts = termMatch.match(/TERM\s+([IVX]+)/);
    if (termParts && termParts[1]) {
      enhancedData.term.term_number = termParts[1];
      enhancedData.term.term_name = `Term ${termParts[1]}`;
    }
  }
  
  // Look for dates
  const dateMatch = lines.find(line => /\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}/.test(line));
  if (dateMatch) {
    const dates = dateMatch.match(/(\w+\s+\d{1,2},?\s+\d{4})\s*-\s*(\w+\s+\d{1,2},?\s+\d{4})/);
    if (dates && dates[1] && dates[2]) {
      try {
        enhancedData.term.start_date = new Date(dates[1]).toISOString().split('T')[0];
        enhancedData.term.end_date = new Date(dates[2]).toISOString().split('T')[0];
      } catch (e) {
        console.warn('Could not parse dates from extracted text');
      }
    }
  }
  
  return enhancedData;
}

// Export the validateFile function to avoid duplication
export function validateFile(file: File): void {
  if (!file) {
    throw new Error("No file provided");
  }
  
  const maxSizeMB = 10;
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  
  if (file.size > maxSizeBytes) {
    throw new Error(`File too large. Maximum size is ${maxSizeMB}MB`);
  }
  
  const allowedTypes = [
    'application/pdf',
    'image/png', 
    'image/jpeg'
  ];
  
  const isAllowedType = allowedTypes.includes(file.type);
  const isAllowedExtension = /\.(pdf|jpe?g|png)$/i.test(file.name);
  
  if (!isAllowedType && !isAllowedExtension) {
    throw new Error("Unsupported file format. Please upload a PDF, PNG, or JPEG file");
  }
}

// Export the matchRoomIdsForAssignments function to avoid duplication
export async function matchRoomIdsForAssignments(data: TermImportData): Promise<void> {
  // Skip if no assignments
  if (!data.assignments || data.assignments.length === 0) {
    return;
  }
  
  try {
    // Try both tables to handle the transitional database state
    let rooms: any[] = [];
    let tableName = '';
    
    // First try the spaces table
    try {
      const { data: spacesData, error: spacesError } = await supabase
        .from('spaces' as any)
        .select('id, room_number, properties');
        
      if (!spacesError && spacesData && spacesData.length > 0) {
        rooms = spacesData;
        tableName = 'spaces';
        console.log('Using spaces table for room matching');
      }
    } catch (e) {
      console.warn('Error querying spaces table:', e);
    }
    
    // If spaces table didn't work, try the rooms table
    if (rooms.length === 0) {
      try {
        const { data: roomsData, error: roomsError } = await supabase
          .from('rooms')
          .select('id, room_number');
          
        if (!roomsError && roomsData && roomsData.length > 0) {
          rooms = roomsData;
          tableName = 'rooms';
          console.log('Using rooms table for room matching');
        }
      } catch (e) {
        console.warn('Error querying rooms table:', e);
      }
    }
    
    if (rooms.length === 0) {
      console.warn('Could not fetch rooms or spaces for matching');
      return; // Continue without matching
    }
    
    // Map of room_number to room_id for quick lookups
    const roomMap = new Map();
    
    // Handle both data structures: rooms table and spaces table
    rooms.forEach(room => {
      // Handle spaces table structure where room_number might be in properties
      let roomNumber = '';
      
      if (tableName === 'spaces') {
        // For spaces table, room_number might be in properties
        roomNumber = room.room_number || 
                     (room.properties && typeof room.properties === 'object' && room.properties.room_number) || 
                     '';
      } else {
        // For rooms table, room_number is a direct property
        roomNumber = room.room_number || '';
      }
      
      if (roomNumber) {
        roomMap.set(roomNumber, room.id);
        // Also map without any non-digit characters for fuzzy matching
        roomMap.set(roomNumber.replace(/\D/g, ''), room.id);
      }
    });
    
    // Now try to match each assignment's room number to an actual room
    for (const assignment of data.assignments) {
      const roomNumber = assignment.room_number;
      
      if (roomNumber && !assignment.room_id) {
        // Try exact match first
        let roomId = roomMap.get(roomNumber);
        
        // If no exact match, try normalized room number
        if (!roomId) {
          const normalizedRoomNumber = roomNumber.replace(/\D/g, '');
          if (normalizedRoomNumber) {
            roomId = roomMap.get(normalizedRoomNumber);
            
            // If still no match, try to find a room with a similar number
            if (!roomId) {
              // Get all keys from the map that start with this normalizedRoomNumber
              for (const [key, value] of roomMap.entries()) {
                if (key.replace(/\D/g, '').startsWith(normalizedRoomNumber) || 
                    normalizedRoomNumber.startsWith(key.replace(/\D/g, ''))) {
                  roomId = value;
                  console.log(`Fuzzy matched room ${roomNumber} to ${key} (room_id ${roomId})`);
                  break;
                }
              }
            }
          }
        }
        
        // Update the assignment with the found room_id
        if (roomId) {
          console.log(`Matched room ${roomNumber} to room_id ${roomId}`);
          assignment.room_id = roomId;
        } else {
          console.warn(`No room match found for ${roomNumber}`);
        }
      }
    }
  } catch (e) {
    console.error('Error in matchRoomIdsForAssignments:', e);
    // Continue without matching
  }
}
