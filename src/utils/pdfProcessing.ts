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

export interface ExtractedTermMetadata {
  termName?: string;
  termNumber?: string;
  location?: string;
  startDate?: Date;
  endDate?: Date;
}

/**
 * Extract text from a PDF document with layout preservation
 * @param pdfArrayBuffer The PDF file as an ArrayBuffer
 * @returns The extracted text content with position information
 */
export async function extractTextFromPDF(pdfArrayBuffer: ArrayBuffer): Promise<string> {
  try {
    const pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
    
    const pdf = await pdfjsLib.getDocument({ data: pdfArrayBuffer }).promise;
    console.info(`PDF loaded with ${pdf.numPages} pages`);
    
    let extractedText = '';
    
    // First pass: Extract text with more precise layout preservation
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      
      // Group items by their y-position with higher precision
      const lineMap = new Map<number, {text: string, x: number, fontSize?: number}[]>();
      
      textContent.items.forEach((item: any) => {
        // Round the y-position with higher precision (0.1 instead of 1)
        // This helps maintain the document's layout more accurately
        const yPos = Math.round(item.transform[5] * 10) / 10;
        
        if (!lineMap.has(yPos)) {
          lineMap.set(yPos, []);
        }
        
        // Also store font size information for potential header detection
        const fontSize = item.transform[3]; // This corresponds to font size in the transform matrix
        
        lineMap.get(yPos)!.push({
          text: item.str,
          x: item.transform[4], // x-position for sorting
          fontSize: fontSize
        });
      });
      
      // Sort lines by y-position (descending) and items in each line by x-position
      const sortedLines = Array.from(lineMap.entries())
        .sort((a, b) => b[0] - a[0])
        .map(([_, items]) => {
          return items
            .sort((a, b) => a.x - b.x)
            .map(item => item.text)
            .join(' ');
        });
      
      // Join the sorted lines with newlines and add a page separator
      extractedText += sortedLines.join('\n') + '\n\n========= PAGE ' + i + ' =========\n\n';
    }
    
    return extractedText;
  } catch (error) {
    console.error("Error extracting text from PDF:", error);
    throw new Error("Failed to extract text from PDF");
  }
}

/**
 * Extract term metadata from the PDF text
 * @param text The extracted PDF text
 * @returns Extracted term metadata
 */
export function extractTermMetadata(text: string): ExtractedTermMetadata {
  const metadata: ExtractedTermMetadata = {};
  
  try {
    // Look for term name and number patterns
    // Term patterns like "FALL TERM 2025" or "TERM IV - SUMMER 2025"
    const termPatterns = [
      /([A-Z]+\s+TERM\s+(?:OF\s+)?(\d{4}))/i,
      /TERM\s+([IVX]+)[\s-]+([A-Za-z]+\s+\d{4})/i,
      /([A-Za-z]+)\s+TERM[\s-]+([IVX]+)/i,
      /TERM\s+([IVX]+|\d)[\s-]+([A-Za-z]+)/i,
      /([A-Za-z]+\s+\d{4})\s+TERM/i,
      /ASSIGNMENT\s+OF\s+JUSTICES\s+([A-Za-z]+\s+\d{4})/i
    ];
    
    // Try each pattern
    for (const pattern of termPatterns) {
      const match = text.match(pattern);
      if (match) {
        if (match[1] && match[2]) {
          // Different patterns have different group arrangements
          if (/TERM\s+[IVX]+/i.test(match[1])) {
            // Pattern like "TERM IV - SUMMER 2025"
            metadata.termNumber = match[1].replace(/TERM\s+/i, '').trim();
            metadata.termName = match[2].trim();
          } else if (/^\d{4}$/.test(match[2])) {
            // Pattern like "FALL TERM 2025"
            metadata.termName = match[1].replace(/\s+\d{4}$/, '').trim();
            metadata.termNumber = ""; // No explicit term number
          } else if (/[IVX]+/i.test(match[2])) {
            // Pattern like "FALL TERM - IV"
            metadata.termName = match[1].trim();
            metadata.termNumber = match[2].trim();
          } else {
            // Generic fallback
            metadata.termName = match[1].trim();
            metadata.termNumber = match[2] ? match[2].trim() : '';
          }
          
          break;
        } else if (match[1]) {
          // Simple match found
          metadata.termName = match[1].trim();
          break;
        }
      }
    }
    
    // Extract dates - looking for date patterns
    const datePatterns = [
      /(?:FROM|PERIOD|DATES?)?\s*:\s*([A-Za-z]+\s+\d{1,2}(?:st|nd|rd|th)?,?\s*\d{4})\s*(?:TO|-|–|THROUGH)\s*([A-Za-z]+\s+\d{1,2}(?:st|nd|rd|th)?,?\s*\d{4})/i,
      /([A-Za-z]+\s+\d{1,2}(?:st|nd|rd|th)?,?\s*\d{4})\s*(?:TO|-|–|THROUGH)\s*([A-Za-z]+\s+\d{1,2}(?:st|nd|rd|th)?,?\s*\d{4})/i,
      /([A-Za-z]+\s+\d{1,2})\s*(?:TO|-|–|THROUGH)\s*([A-Za-z]+\s+\d{1,2},?\s*\d{4})/i,
      /EFFECTIVE\s+([A-Za-z]+\s+\d{1,2}(?:st|nd|rd|th)?,?\s*\d{4})/i
    ];
    
    // Try each date pattern
    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match) {
        try {
          if (match[1] && match[2]) {
            // Clean the date strings
            let startDateStr = match[1].replace(/(?:st|nd|rd|th)/g, '');
            let endDateStr = match[2].replace(/(?:st|nd|rd|th)/g, '');
            
            // If start date doesn't have a year but end date does, borrow the year
            if (!/\d{4}/.test(startDateStr) && /\d{4}/.test(endDateStr)) {
              const year = endDateStr.match(/\d{4}/)[0];
              startDateStr = `${startDateStr} ${year}`;
            }
            
            // Try to parse the dates
            metadata.startDate = new Date(startDateStr);
            metadata.endDate = new Date(endDateStr);
            
            // Validate dates are valid
            if (isNaN(metadata.startDate.getTime())) {
              metadata.startDate = undefined;
            }
            if (isNaN(metadata.endDate.getTime())) {
              metadata.endDate = undefined;
            }
            
            break;
          } else if (match[1]) {
            // Only found a single date (like "EFFECTIVE JANUARY 5, 2025")
            const dateStr = match[1].replace(/(?:st|nd|rd|th)/g, '');
            metadata.startDate = new Date(dateStr);
            
            // Validate date is valid
            if (isNaN(metadata.startDate.getTime())) {
              metadata.startDate = undefined;
            }
            
            break;
          }
        } catch (e) {
          console.error("Error parsing dates:", e);
        }
      }
    }
    
    // Extract location
    const locationPatterns = [
      /SUPREME COURT(?:,|\s+OF)?\s+([A-Za-z\s]+)(?:,|\s+COUNTY)?/i,
      /COUNTY\s+OF\s+([A-Za-z\s]+)/i,
      /([A-Za-z]+)\s+COUNTY/i,
      /COURTHOUSE,\s+([A-Za-z\s]+)/i
    ];
    
    // Try each location pattern
    for (const pattern of locationPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        let location = match[1].trim();
        
        // Clean up the location name
        location = location.replace(/COUNTY|COURTHOUSE|SUPREME COURT/gi, '').trim();
        
        // Map to standardized location if it's recognized
        const locationMap: Record<string, string> = {
          "KINGS": "Brooklyn",
          "NEW YORK": "Manhattan",
          "QUEENS": "Queens",
          "BRONX": "Bronx",
          "RICHMOND": "Staten Island"
        };
        
        metadata.location = locationMap[location.toUpperCase()] || location;
        break;
      }
    }
    
    return metadata;
  } catch (error) {
    console.error("Error extracting term metadata:", error);
    return metadata;
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
    const assignmentPattern = /\b([A-Z0-9][-A-Z0-9]*)\s+([A-Za-z\s\.\-,']+?)(?:\s+(?:[Rr]oom\s*)?(\d+[A-Za-z]?))?(?:\s*[-–]?\s*(?:\(?\s*(?:Tel|TEL|Phone|PHONE)?\.?\s*(?:\(?\s*(\d{1,2})\s*\)?\s*[-\s]?(\d{3,4}))?\s*\)?)?)?/i;
    
    const assignments: TermAssignment[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const match = line.match(assignmentPattern);
      
      if (match) {
        // Extract the main components with better handling of edge cases
        const [_, part, justiceRaw, room, extRaw, phoneRaw] = match;
        
        // Clean up justice name - trim trailing periods, commas
        const justice = justiceRaw.replace(/[,\s\.]+$/, '').trim();
        
        // Prepare phone number and extension if available
        let tel = null;
        let extension = null;
        
        if (extRaw && phoneRaw) {
          tel = `(${extRaw})${phoneRaw}`;
          extension = extRaw;
        } else if (phoneRaw) {
          tel = phoneRaw;
        }
        
        // Initialize assignment
        const assignment: TermAssignment = {
          part: part.trim(),
          justice: justice,
          room: room?.trim() || null,
          tel: tel
        };
        
        // Look ahead for additional information - check for SGT and clerks more intelligently
        let sgtFound = false;
        let clerksCollecting = false;
        let clerkLines: string[] = [];
        let sgtLine = '';
        let faxLine = '';
        
        // Scan subsequent lines for SGT, clerks, and other data
        let j = i + 1;
        while (j < lines.length && j < i + 8) { // Look ahead up to 8 lines
          const nextLine = lines[j].trim();
          
          // Skip empty lines
          if (!nextLine) {
            j++;
            continue;
          }
          
          // Check for fax information
          const faxMatch = nextLine.match(/FAX\s*[.:]\s*(\(?\d{1,2}\)?[-\s]?\d{3,4})/i);
          if (faxMatch && faxMatch[1]) {
            assignment.fax = faxMatch[1].trim();
            j++;
            continue;
          }
          
          // Check for extension information if not already found
          const extMatch = nextLine.match(/EXT(?:ENSION)?\.?\s*[.:]\s*(\d+)/i);
          if (extMatch && extMatch[1] && !assignment.extension) {
            assignment.extension = extMatch[1].trim();
            j++;
            continue;
          }
          
          // Detect SGT line with more patterns
          if (!sgtFound && /\b(?:SGT|SERGEANT|SGT\.|S(?:er)?g(?:ean)?t\.?)\b/i.test(nextLine)) {
            sgtLine = nextLine.replace(/\b(?:SGT|SERGEANT|SGT\.|S(?:er)?g(?:ean)?t\.?)\b/i, '').trim();
            sgtFound = true;
            j++;
            continue;
          }
          
          // Start collecting clerks after SGT or if we see clerk indicators
          if (sgtFound || 
              /\b(?:CLERK|CLK\.?|Court Clerk)\b/i.test(nextLine) || 
              /^[A-Z]\.\s+[A-Za-z]+/.test(nextLine) ||
              /^(?:Ms\.|Mrs\.|Mr\.)\s+[A-Za-z]+/.test(nextLine)) {
            
            clerksCollecting = true;
            
            // Don't include lines that look like new assignments
            if (!nextLine.match(assignmentPattern) && 
                !/^[A-Z0-9]{1,3}\s+[A-Z]/.test(nextLine) &&
                !/^PART\s+[A-Z0-9]{1,3}/.test(nextLine)) {
              clerkLines.push(nextLine);
            } else {
              break; // Stop if we hit what looks like a new assignment
            }
          }
          
          // Stop if we encounter a likely new assignment pattern
          if (/^[A-Z0-9][-A-Z0-9]*\s+[A-Z]/.test(nextLine) ||
              /^PART\s+[A-Z0-9]{1,3}/.test(nextLine)) {
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
          // Join and then split more intelligently
          let clerkText = clerkLines.join(' ');
          
          // Remove any "CLERK:" or similar prefixes
          clerkText = clerkText.replace(/\b(?:CLERK|CLK)s?\.?:?\s*/i, '');
          
          // Split by commas, slashes, or clear name separators
          let clerks = clerkText
            .split(/[,\/]|\s+(?:and|&)\s+/i)
            .map(c => c.trim())
            .filter(Boolean);
          
          // If no clear separators, look for title or initial patterns
          if (clerks.length <= 1 && clerkText.trim()) {
            const nameMatches = clerkText.match(/(?:Mr\.|Mrs\.|Ms\.|[A-Z]\.)\s+[A-Za-z]+/g);
            if (nameMatches && nameMatches.length > 1) {
              clerks = nameMatches.map(name => name.trim());
            } else {
              // Keep as is if no pattern found
              clerks = [clerkText.trim()];
            }
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
 * Table-based extraction method for tabular term assignments
 * @param text The extracted PDF text
 * @returns Array of parsed assignments
 */
export function extractAssignmentsByTable(text: string): TermAssignment[] {
  try {
    const lines = text.split(/\n/).map(line => line.trim()).filter(Boolean);
    const assignments: TermAssignment[] = [];
    
    // Look for table headers to identify columns
    const headerPatterns = [
      /PART.*JUSTICE.*(?:ROOM|LOCATION).*(?:PHONE|TEL)/i,
      /PART.*JUDGE.*(?:ROOM|LOCATION).*(?:PHONE|TEL)/i
    ];
    
    let headerIndex = -1;
    let headerLine = '';
    
    for (let i = 0; i < lines.length; i++) {
      for (const pattern of headerPatterns) {
        if (pattern.test(lines[i])) {
          headerIndex = i;
          headerLine = lines[i];
          break;
        }
      }
      if (headerIndex !== -1) break;
    }
    
    if (headerIndex === -1) {
      console.info("No table headers found for table extraction");
      return [];
    }
    
    // Determine column positions based on header
    const getColumnPos = (text: string, patterns: RegExp[]) => {
      for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) return match.index || -1;
      }
      return -1;
    };
    
    const partCol = getColumnPos(headerLine, [/PART/i]);
    const justiceCol = Math.max(
      getColumnPos(headerLine, [/JUSTICE/i]),
      getColumnPos(headerLine, [/JUDGE/i])
    );
    const roomCol = Math.max(
      getColumnPos(headerLine, [/ROOM/i]),
      getColumnPos(headerLine, [/LOCATION/i])
    );
    const phoneCol = Math.max(
      getColumnPos(headerLine, [/PHONE/i]),
      getColumnPos(headerLine, [/TEL/i])
    );
    const sgtCol = getColumnPos(headerLine, [/SGT/i, /SERGEANT/i]);
    const clerkCol = getColumnPos(headerLine, [/CLERK/i]);
    
    // Process data rows
    for (let i = headerIndex + 1; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip empty lines
      if (!line || line.length < 3) continue;
      
      // Skip lines that don't look like data rows
      if (!/[A-Z0-9]/.test(line.substring(0, Math.min(10, line.length)))) continue;
      
      const assignment: TermAssignment = {};
      let hasData = false;
      
      // Extract data based on column positions
      if (partCol !== -1) {
        const endPos = justiceCol !== -1 ? justiceCol : line.length;
        const partText = line.substring(partCol, endPos).trim();
        const partMatch = partText.match(/([A-Z0-9][-A-Z0-9]*)/);
        if (partMatch) {
          assignment.part = partMatch[1].trim();
          hasData = true;
        }
      }
      
      if (justiceCol !== -1) {
        const endPos = roomCol !== -1 ? roomCol : 
                      phoneCol !== -1 ? phoneCol : line.length;
        assignment.justice = line.substring(justiceCol, endPos).trim();
        hasData = true;
      }
      
      if (roomCol !== -1 && roomCol < line.length) {
        const endPos = phoneCol !== -1 ? phoneCol : 
                      sgtCol !== -1 ? sgtCol : line.length;
        const roomText = line.substring(roomCol, endPos).trim();
        // Extract numeric part with possible letter suffix
        const roomMatch = roomText.match(/\b(\d+[A-Za-z]?)\b/);
        assignment.room = roomMatch ? roomMatch[1] : null;
      }
      
      if (phoneCol !== -1 && phoneCol < line.length) {
        const endPos = sgtCol !== -1 ? sgtCol : 
                      clerkCol !== -1 ? clerkCol : line.length;
        const phoneText = line.substring(phoneCol, endPos).trim();
        // Extract formatted phone number
        const phoneMatch = phoneText.match(/\(?\s*(\d{1,2})\s*\)?\s*[-\s]?(\d{3,4})/);
        if (phoneMatch) {
          assignment.tel = `(${phoneMatch[1]})${phoneMatch[2]}`;
          assignment.extension = phoneMatch[1];
        }
      }
      
      if (sgtCol !== -1 && sgtCol < line.length) {
        const endPos = clerkCol !== -1 ? clerkCol : line.length;
        assignment.sgt = line.substring(sgtCol, endPos).trim();
      }
      
      if (clerkCol !== -1 && clerkCol < line.length) {
        const clerkText = line.substring(clerkCol).trim();
        // Handle multiple clerks
        if (clerkText.includes(',') || clerkText.includes('/')) {
          assignment.clerks = clerkText
            .split(/[,\/]/)
            .map(c => c.trim())
            .filter(Boolean);
        } else {
          assignment.clerks = clerkText;
        }
      }
      
      if (hasData) {
        assignments.push(assignment);
      }
    }
    
    return assignments;
  } catch (error) {
    console.error("Error in extractAssignmentsByTable:", error);
    return [];
  }
}

/**
 * Structural pattern extraction for semi-structured formats
 * @param text The extracted PDF text
 * @returns Array of parsed assignments
 */
export function extractAssignmentsByStructure(text: string): TermAssignment[] {
  try {
    const lines = text.split(/\n/).map(line => line.trim()).filter(Boolean);
    const assignments: TermAssignment[] = [];
    
    // Enhanced patterns to detect assignment blocks with more variations
    const structurePatterns = [
      // "PART X - Justice Name - Room YYY"
      /\b(?:PART\s+)?([A-Z0-9][-A-Z0-9]*)\s*[-–:]\s*([A-Za-z\s\.\-,']+?)(?:[-–:]\s*(?:[Rr]oom\s*)?(\d+[A-Za-z]?))?(?:[-–:]\s*(\d{1,2}[-\s]?\d{3,4}|\d{4}))?/i,
      
      // Detect formats with explicit labels
      /\b(?:PART|PT)\.?\s*[:=]?\s*([A-Z0-9][-A-Z0-9]*)\s+(?:JUSTICE|JUDGE)\.?\s*[:=]?\s*([A-Za-z\s\.\-,']+?)(?:\s+(?:ROOM|RM)\.?\s*[:=]?\s*(\d+[A-Za-z]?))?/i,
      
      // Court part followed by justice name
      /\b(?:COURT\s+)?PART\s+([A-Z0-9][-A-Z0-9]*)\s+([A-Za-z\s\.\-,']+)/i,
      
      // Justice assignment format
      /\bJUSTICE\s+([A-Za-z\s\.\-,']+)\s+[-–:]\s+PART\s+([A-Z0-9][-A-Z0-9]*)/i
    ];
    
    // Process each line
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      let assignment: TermAssignment | null = null;
      
      // Try each pattern
      for (const pattern of structurePatterns) {
        const match = line.match(pattern);
        if (match) {
          // Handle different pattern formats
          if (pattern.toString().includes('JUSTICE\\s+') && pattern.toString().includes('PART\\s+')) {
            // Pattern with Justice first, Part second
            assignment = {
              part: match[2]?.trim(),
              justice: match[1]?.trim(),
              room: match[3]?.trim() || null,
              tel: match[4]?.trim() || null
            };
          } else {
            // Standard pattern (Part, Justice, Room)
            assignment = {
              part: match[1]?.trim(),
              justice: match[2]?.trim(),
              room: match[3]?.trim() || null,
              tel: match[4]?.trim() || null
            };
          }
          
          break;
        }
      }
      
      if (assignment) {
        // Look for additional information in nearby lines
        let j = i + 1;
        while (j < lines.length && j < i + 6) {
          const nextLine = lines[j].trim();
          
          if (!nextLine) {
            j++;
            continue;
          }
          
          // SGT detection
          if (/\b(?:SGT|SERGEANT|SGT\.|SERG\.?)\b/i.test(nextLine)) {
            assignment.sgt = nextLine.replace(/\b(?:SGT|SERGEANT|SGT\.|SERG\.?)\b/i, '').trim();
            j++;
            continue;
          }
          
          // Fax detection
          const faxMatch = nextLine.match(/FAX\.?\s*[:#]?\s*(\(?\d{1,2}\)?[-\s]?\d{3,4})/i);
          if (faxMatch && faxMatch[1]) {
            assignment.fax = faxMatch[1].trim();
            j++;
            continue;
          }
          
          // Phone or extension detection
          const phoneMatch = nextLine.match(/(?:TEL|PHONE|EXT(?:ENSION)?)\.?\s*[:#]?\s*(\(?\d{1,2}\)?[-\s]?\d{3,4})/i);
          if (phoneMatch && phoneMatch[1]) {
            if (!assignment.tel) {
              assignment.tel = phoneMatch[1].trim();
            }
            const extMatch = phoneMatch[1].match(/\((\d{1,2})\)/);
            if (extMatch) {
              assignment.extension = extMatch[1];
            }
            j++;
            continue;
          }
          
          // Clerk detection
          if (/\b(?:CLERK|CLK\.?|COURTHROOM\s+CLERK)\b/i.test(nextLine) || 
              /^[A-Z]\.\s+[A-Za-z]+/.test(nextLine) ||
              /^(?:Ms\.|Mrs\.|Mr\.)\s+[A-Za-z]+/.test(nextLine)) {
            
            let clerkText = nextLine.replace(/\b(?:CLERK|CLK\.?)s?:?\s*/i, '').trim();
            
            // Process multiple lines of clerks if needed
            let k = j + 1;
            while (k < lines.length && k < j + 3) {
              const clerkNext = lines[k].trim();
              if (/^[A-Z]\.\s+[A-Za-z]+/.test(clerkNext) ||
                  /^(?:Ms\.|Mrs\.|Mr\.)\s+[A-Za-z]+/.test(clerkNext)) {
                clerkText += `, ${clerkNext}`;
                k++;
              } else {
                break;
              }
            }
            
            // Parse clerk names
            if (clerkText.includes(',') || clerkText.includes('/')) {
              assignment.clerks = clerkText
                .split(/[,\/]/)
                .map(c => c.trim())
                .filter(Boolean);
            } else {
              assignment.clerks = clerkText;
            }
            
            j = k;
            continue;
          }
          
          // Stop if we hit another pattern that looks like a new assignment
          let isNewAssignment = false;
          for (const pattern of structurePatterns) {
            if (pattern.test(nextLine)) {
              isNewAssignment = true;
              break;
            }
          }
          
          if (isNewAssignment || /^[A-Z0-9][-A-Z0-9]*\s+[A-Z]/.test(nextLine)) {
            break;
          }
          
          j++;
        }
        
        assignments.push(assignment);
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
 * @returns Array of assignments and the method used
 */
export function parseAssignmentsFromText(text: string): { 
  assignments: TermAssignment[],
  method: string
} {
  console.log("Beginning assignment parsing with text length:", text.length);
  
  try {
    // Try multiple extraction methods and use the one that produces the best results
    const strategies = [
      { name: 'Pattern Matching', fn: extractAssignmentsByPattern },
      { name: 'Table Format', fn: extractAssignmentsByTable },
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
    return {
      assignments: validatedResults,
      method: bestMethod
    };
  } catch (error) {
    console.error("Error parsing assignments:", error);
    return {
      assignments: [],
      method: 'Error'
    };
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
    clerkArray = clerks.split(/[,\/]/).map(c => c.
