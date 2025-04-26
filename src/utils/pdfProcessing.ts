import { PDFDocumentProxy } from "pdfjs-dist";

export interface TermAssignment {
  part?: string;
  justice?: string;
  room?: string | null;
  tel?: string | null;
  fax?: string | null;
  sgt?: string | null;
  clerks?: string[] | string;
  extension?: string | null;
}

/**
 * Extract text from a PDF document with layout preservation
 * @param pdfArrayBuffer The PDF file as an ArrayBuffer
 * @returns The extracted text content
 */
export async function extractTextFromPDF(pdfArrayBuffer: ArrayBuffer): Promise<string> {
  try {
    const pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
    
    const pdf = await pdfjsLib.getDocument({ data: pdfArrayBuffer }).promise;
    console.info(`PDF loaded with ${pdf.numPages} pages`);
    
    let extractedText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      
      // Group items by their y-position to better preserve layout
      const lineMap = new Map<number, {text: string, x: number}[]>();
      
      textContent.items.forEach((item: any) => {
        // Round the y-position to the nearest integer to group items on the same line
        const yPos = Math.round(item.transform[5]);
        if (!lineMap.has(yPos)) {
          lineMap.set(yPos, []);
        }
        lineMap.get(yPos)!.push({
          text: item.str,
          x: item.transform[4] // x-position for sorting
        });
      });
      
      // Sort lines by y-position (descending) and items in each line by x-position
      const sortedLines = Array.from(lineMap.entries())
        .sort((a, b) => b[0] - a[0])
        .map(([_, items]) => {
          return items.sort((a, b) => a.x - b.x).map(item => item.text).join(' ');
        });
      
      // Join the sorted lines with newlines
      extractedText += sortedLines.join('\n') + '\n';
    }
    
    return extractedText;
  } catch (error) {
    console.error("Error extracting text from PDF:", error);
    throw new Error("Failed to extract text from PDF");
  }
}

/**
 * Primary assignment extractor using improved pattern matching
 * @param text The extracted PDF text
 * @returns Array of parsed assignments
 */
export function extractAssignmentsByPattern(text: string): TermAssignment[] {
  try {
    // Split text into lines and clean them
    const lines = text.split(/\n/).map(line => line.trim()).filter(Boolean);
    
    // Enhanced pattern to match various assignment formats
    // This regex is more flexible with spacing and format variations
    const assignmentPattern = /\b([A-Z0-9][-A-Z0-9]*)\s+([A-Za-z\s\.\-,']+?)(?:\s+(?:[Rr]oom\s*)?(\d+[A-Za-z]?))?\s*(?:[()]*\s*(\(?\d{1,2}\)?[-\s]?\d{3,4}|\d{4})\s*[()]*)?/i;
    
    const assignments: TermAssignment[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const match = line.match(assignmentPattern);
      
      if (match) {
        // Extract the main components with better handling of edge cases
        const [_, part, justiceRaw, room, phone] = match;
        
        // Clean up justice name - trim trailing periods, commas
        const justice = justiceRaw.replace(/[,\s]+$/, '').trim();
        
        // Initialize assignment
        const assignment: TermAssignment = {
          part: part.trim(),
          justice: justice,
          room: room?.trim() || null,
          tel: phone?.trim() || null
        };
        
        // Look ahead for additional information
        let sgtsFound = false;
        let clerksCollecting = false;
        let clerkLines: string[] = [];
        let sgtLine = '';
        
        // Scan subsequent lines for SGT and clerks
        let j = i + 1;
        while (j < lines.length && j < i + 5) {
          const nextLine = lines[j].trim();
          
          // Skip empty lines
          if (!nextLine) {
            j++;
            continue;
          }
          
          // Detect SGT line - more flexible pattern
          if (!sgtsFound && /\bSGT\b|SERGEANT|SGT\./.test(nextLine)) {
            sgtLine = nextLine.replace(/\bSGT\b|SERGEANT|SGT\./, '').trim();
            sgtsFound = true;
            j++;
            continue;
          }
          
          // Start collecting clerks after SGT or if we see clerk indicators
          if (sgtsFound || /CLERK|[A-Z]\.\s[A-Za-z]+/.test(nextLine)) {
            clerksCollecting = true;
            // Don't include lines that look like new assignments
            if (!nextLine.match(assignmentPattern)) {
              clerkLines.push(nextLine);
            } else {
              break; // Stop if we hit what looks like a new assignment
            }
          }
          
          // Stop if we encounter a likely new assignment pattern
          if (/^[A-Z0-9][-A-Z0-9]*\s+[A-Z]/.test(nextLine)) {
            break;
          }
          
          j++;
        }
        
        // Process SGT
        if (sgtLine) {
          assignment.sgt = sgtLine;
        }
        
        // Process clerks with improved formatting
        if (clerkLines.length > 0) {
          // Join and then split by commas or other delimiters
          let clerkText = clerkLines.join(' ');
          
          // Split by various delimiters, clean, and remove duplicates
          let clerks = clerkText
            .split(/[,\/]/)
            .map(c => c.trim())
            .filter(Boolean);
          
          // Preserve structure in complex formats
          if (clerks.length === 0 && clerkText.trim()) {
            clerks = [clerkText.trim()];
          }
          
          assignment.clerks = clerks;
        }
        
        assignments.push(assignment);
      }
    }
    
    return assignments;
  } catch (error) {
    console.error("Error in extractAssignmentsByPattern:", error);
    return [];
  }
}

/**
 * Column-based extraction method for tabular data
 * @param text The extracted PDF text
 * @returns Array of parsed assignments
 */
export function extractAssignmentsByColumn(text: string): TermAssignment[] {
  try {
    const lines = text.split(/\n/).filter(Boolean);
    const assignments: TermAssignment[] = [];
    
    // Try to detect table headers to identify columns
    const headerIndex = lines.findIndex(line => 
      /PART|JUSTICE|JUDGE|ROOM|PHONE|SGT|CLERK/i.test(line)
    );
    
    if (headerIndex === -1) {
      console.info("No table headers found for column extraction");
      return [];
    }
    
    const headerLine = lines[headerIndex];
    
    // Try to determine column positions based on header
    const partCol = headerLine.indexOf('PART');
    const justiceCol = headerLine.indexOf('JUSTICE') !== -1 ? 
                       headerLine.indexOf('JUSTICE') : 
                       headerLine.indexOf('JUDGE');
    const roomCol = headerLine.indexOf('ROOM');
    const phoneCol = headerLine.indexOf('PHONE') !== -1 ? 
                     headerLine.indexOf('PHONE') : 
                     headerLine.indexOf('TEL');
    const sgtCol = headerLine.indexOf('SGT');
    const clerkCol = headerLine.indexOf('CLERK');
    
    // Process data rows
    for (let i = headerIndex + 1; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip empty lines
      if (!line || line.length < 3) continue;
      
      // Skip lines that don't look like data rows
      if (!/[A-Z0-9]/.test(line.substring(0, Math.min(10, line.length)))) continue;
      
      const assignment: TermAssignment = {};
      
      // Extract data based on column positions
      if (partCol !== -1) {
        const endPos = justiceCol !== -1 ? justiceCol : line.length;
        assignment.part = line.substring(partCol, endPos).trim();
      }
      
      if (justiceCol !== -1) {
        const endPos = roomCol !== -1 ? roomCol : 
                      phoneCol !== -1 ? phoneCol : line.length;
        assignment.justice = line.substring(justiceCol, endPos).trim();
      }
      
      if (roomCol !== -1) {
        const endPos = phoneCol !== -1 ? phoneCol : 
                      sgtCol !== -1 ? sgtCol : line.length;
        const roomText = line.substring(roomCol, endPos).trim();
        // Extract numeric part with possible letter suffix
        const roomMatch = roomText.match(/\b(\d+[A-Za-z]?)\b/);
        assignment.room = roomMatch ? roomMatch[1] : null;
      }
      
      if (phoneCol !== -1) {
        const endPos = sgtCol !== -1 ? sgtCol : 
                      clerkCol !== -1 ? clerkCol : line.length;
        const phoneText = line.substring(phoneCol, endPos).trim();
        // Extract digits
        const phoneMatch = phoneText.match(/\b(\d{1,2}[-\s]?\d{3,4}|\d{4})\b/);
        assignment.tel = phoneMatch ? phoneMatch[1] : null;
      }
      
      if (sgtCol !== -1) {
        const endPos = clerkCol !== -1 ? clerkCol : line.length;
        assignment.sgt = line.substring(sgtCol, endPos).trim();
      }
      
      if (clerkCol !== -1) {
        assignment.clerks = line.substring(clerkCol).trim();
      }
      
      if (assignment.part || assignment.justice) {
        assignments.push(assignment);
      }
    }
    
    return assignments;
  } catch (error) {
    console.error("Error in extractAssignmentsByColumn:", error);
    return [];
  }
}

/**
 * Structural pattern extraction for less structured formats
 * @param text The extracted PDF text
 * @returns Array of parsed assignments
 */
export function extractAssignmentsByStructure(text: string): TermAssignment[] {
  try {
    const lines = text.split(/\n/).map(line => line.trim()).filter(Boolean);
    const assignments: TermAssignment[] = [];
    
    // Looking for patterns like "PART X - Justice Name - Room YYY"
    const structuredPattern = /\b([A-Z0-9][-A-Z0-9]*)\s*[-–:]?\s*([A-Za-z\s\.\-,']+?)(?:[-–:]?\s*(?:[Rr]oom\s*)?(\d+[A-Za-z]?))?(?:[-–:]?\s*(\d{1,2}[-\s]?\d{3,4}|\d{4}))?/i;
    
    // Look for blocks of text that might contain assignment information
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const match = line.match(structuredPattern);
      
      if (match) {
        const [_, part, justice, room, phone] = match;
        
        // Only accept if part looks valid (not just a single digit that might be a room number)
        if (part && part.length > 0 && !/^\d+$/.test(part)) {
          const assignment: TermAssignment = {
            part: part.trim(),
            justice: justice.trim(),
            room: room || null,
            tel: phone || null
          };
          
          // Look for additional information in nearby lines
          if (i + 1 < lines.length) {
            const nextLine = lines[i + 1].trim();
            
            if (/\bSGT\b|SERGEANT|SGT\./.test(nextLine)) {
              assignment.sgt = nextLine.replace(/\bSGT\b|SERGEANT|SGT\./, '').trim();
              i++;
            }
            
            // Check for clerk information
            if (i + 1 < lines.length && !/^[A-Z0-9][-A-Z0-9]*\s+[A-Z]/.test(lines[i + 1])) {
              const clerkLine = lines[i + 1].trim();
              assignment.clerks = clerkLine;
              i++;
            }
          }
          
          assignments.push(assignment);
        }
      }
    }
    
    return assignments;
  } catch (error) {
    console.error("Error in extractAssignmentsByStructure:", error);
    return [];
  }
}

/**
 * Extract part assignments from PDF text using multiple strategies
 * @param text The extracted PDF text
 * @returns Array of assignments
 */
export function parseAssignmentsFromText(text: string): TermAssignment[] {
  console.log("Beginning assignment parsing with text length:", text.length);
  
  try {
    // Try multiple extraction methods and use the one that produces the best results
    const strategies = [
      { name: 'Pattern Matching', fn: extractAssignmentsByPattern },
      { name: 'Column-Based', fn: extractAssignmentsByColumn },
      { name: 'Structural Pattern', fn: extractAssignmentsByStructure }
    ];
    
    let bestResults: TermAssignment[] = [];
    let bestResultCount = 0;
    let bestMethod = '';
    
    // Try each extraction method
    for (const strategy of strategies) {
      console.info(`Trying extraction strategy: ${strategy.name}`);
      const results = strategy.fn(text);
      console.info(`${strategy.name} found ${results.length} assignments`);
      
      // Keep track of the strategy that finds the most assignments
      if (results.length > bestResultCount) {
        bestResults = results;
        bestResultCount = results.length;
        bestMethod = strategy.name;
      }
    }
    
    console.info(`Using results from ${bestMethod} strategy with ${bestResultCount} assignments`);
    
    // Validate and clean up the results
    const validatedResults = bestResults.filter(assignment => {
      // Must have at least a part or justice name
      return assignment.part || assignment.justice;
    });
    
    console.log(`Final validated results: ${validatedResults.length} assignments`);
    return validatedResults;
  } catch (error) {
    console.error("Error parsing assignments:", error);
    return [];
  }
}

/**
 * Format part name consistently
 */
export function formatPart(part: string | undefined, fallback: string | undefined): string {
  if (typeof part === 'string' && part.trim()) return part;
  if (typeof fallback === 'string' && fallback.trim()) return fallback;
  return '—';
}

/**
 * Format phone number consistently
 */
export function formatPhone(phone: string | undefined): string {
  if (!phone) return '—';
  
  // Handle multiple formats
  const digits = phone.replace(/\D/g, '');
  
  if (digits.length === 5 && digits[0] === '6') {
    return `(6)${digits.slice(1)}`;
  }
  
  if (digits.length === 4) {
    return `(6)${digits}`;
  }
  
  // Try to format as (XX)XXXX
  if (digits.length >= 5) {
    const areaCode = digits.slice(0, 1);
    const number = digits.slice(1, 5);
    return `(${areaCode})${number}`;
  }
  
  return phone;
}

/**
 * Format sergeant name consistently
 */
export function formatSergeant(sgt: string | undefined): string {
  if (!sgt || typeof sgt !== 'string') return '—';
  
  // Clean up and format
  const cleaned = sgt.trim().replace(/^SGT\s+|^SERGEANT\s+|^SGT\.\s+/i, '');
  
  if (!cleaned) return '—';
  
  // Extract last name if multiple parts
  const parts = cleaned.trim().split(/\s+/);
  return parts.length > 0 ? parts[parts.length - 1].replace(/[^A-Z\-]/gi, '') : cleaned;
}

/**
 * Format clerk names consistently
 */
export function formatClerks(clerks: string[] | string | undefined): string {
  if (!clerks) return '—';
  
  // Convert string to array
  let clerkArray: string[];
  if (typeof clerks === 'string') {
    clerkArray = clerks.split(/[,\/]/).map(c => c.trim()).filter(Boolean);
    if (clerkArray.length === 0 && clerks.trim()) {
      clerkArray = [clerks.trim()];
    }
  } else if (Array.isArray(clerks)) {
    clerkArray = clerks.filter(Boolean);
  } else {
    return '—';
  }
  
  if (clerkArray.length === 0) return '—';
  
  // Format each clerk name
  return clerkArray.map(name => {
    // Handle "Initial. Last" format
    if (/^[A-Z]\.\s+[A-Za-z\-']+$/.test(name)) return name;
    
    // Try to extract initial and last name
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      let initial = parts[0].replace(/[^A-Z.]/gi, '');
      if (!initial.endsWith('.')) initial += '.';
      
      let last = parts.slice(1).join(' ').replace(/[^A-Za-z\-']/gi, '');
      return `${initial} ${last}`;
    }
    
    return name;
  }).join(', ');
}

/**
 * Get file size in readable format
 */
export function getReadableFileSize(size: number): string {
  const i = size === 0 ? 0 : Math.floor(Math.log(size) / Math.log(1024));
  return `${(size / Math.pow(1024, i)).toFixed(2)} ${['B', 'KB', 'MB', 'GB', 'TB'][i]}`;
}

/**
 * Validate PDF file
 */
export function validatePDFFile(file: File): { valid: boolean; error?: string } {
  if (file.type !== "application/pdf") {
    return { valid: false, error: "Please upload a PDF file." };
  }
  
  // Check file size (10MB limit)
  if (file.size > 10 * 1024 * 1024) {
    return { valid: false, error: `File size exceeds 10MB (${getReadableFileSize(file.size)})` };
  }
  
  return { valid: true };
}
