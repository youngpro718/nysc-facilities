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
  confidence?: {
    termName?: number;
    termNumber?: number;
    location?: number;
    dates?: number;
    overall?: number;
  };
}

/**
 * Extract text from a PDF document with layout preservation and font information
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
    let firstPageSpecialProcessing = '';
    
    // First pass: Extract text with more precise layout preservation
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const viewport = page.getViewport({ scale: 1.0 });
      const pageHeight = viewport.height;
      
      // Group items by their y-position with higher precision
      const lineMap = new Map<number, {text: string, x: number, fontSize?: number, fontWeight?: string}[]>();
      
      textContent.items.forEach((item: any) => {
        // Round the y-position with higher precision (0.1 instead of 1)
        // This helps maintain the document's layout more accurately
        const yPos = Math.round(item.transform[5] * 10) / 10;
        
        if (!lineMap.has(yPos)) {
          lineMap.set(yPos, []);
        }
        
        // Extract font size and font weight information for potential header detection
        const fontSize = item.transform[3]; // This corresponds to font size in the transform matrix
        const fontName = item.fontName || '';
        const fontWeight = fontName.toLowerCase().includes('bold') ? 'bold' : 'normal';
        
        lineMap.get(yPos)!.push({
          text: item.str,
          x: item.transform[4], // x-position for sorting
          fontSize: fontSize,
          fontWeight: fontWeight
        });
      });
      
      // Sort lines by y-position (descending) and items in each line by x-position
      const sortedLines = Array.from(lineMap.entries())
        .sort((a, b) => b[0] - a[0]) // Sort by y-position (top to bottom)
        .map(([yPos, items]) => {
          // Sort items in each line by x-position (left to right)
          const sortedItems = items.sort((a, b) => a.x - b.x);
          
          // Check if this line contains potential header elements (larger font size)
          const avgFontSize = sortedItems.reduce((sum, item) => sum + (item.fontSize || 0), 0) / sortedItems.length;
          const hasLargeFont = avgFontSize > 14; // Threshold for header detection
          const hasBoldFont = sortedItems.some(item => item.fontWeight === 'bold');
          
          // For header-like elements, add special markers for easier parsing later
          let lineText = sortedItems.map(item => item.text).join(' ');
          
          // Add metadata markers for key elements to aid extraction
          if ((hasLargeFont || hasBoldFont) && (i === 1 || i === 2)) {
            // For first 2 pages, highlight potential headers for metadata extraction
            if (/TERM|ASSIGNMENT|JUSTICE|PERIOD|SCHEDULE|COURT/i.test(lineText)) {
              lineText = `## HEADER ## ${lineText} ## HEADER ##`;
            }
            
            if (/DATE|FROM|TO|THROUGH|EFFECTIVE/i.test(lineText)) {
              lineText = `## DATE ## ${lineText} ## DATE ##`;
            }
            
            if (/COUNTY|COURTHOUSE|SUPREME COURT/i.test(lineText)) {
              lineText = `## LOCATION ## ${lineText} ## LOCATION ##`;
            }
          }
          
          return lineText;
        });
      
      // Join the sorted lines with newlines and add a page separator
      const pageText = sortedLines.join('\n') + '\n\n========= PAGE ' + i + ' =========\n\n';
      extractedText += pageText;
      
      // Store first page text separately for focused metadata extraction
      if (i === 1) {
        firstPageSpecialProcessing = pageText;
      }
    }
    
    // Attempt a specialized extraction of the header section (first 20 lines of first page)
    let headerSection = '';
    const firstPageLines = firstPageSpecialProcessing.split('\n');
    const headerLines = firstPageLines.slice(0, Math.min(20, firstPageLines.length));
    headerSection = headerLines.join('\n');
    
    // Add the header section at the beginning for easier access during extraction
    extractedText = `## DOCUMENT HEADER START ##\n${headerSection}\n## DOCUMENT HEADER END ##\n\n` + extractedText;
    
    return extractedText;
  } catch (error) {
    console.error("Error extracting text from PDF:", error);
    throw new Error("Failed to extract text from PDF");
  }
}

/**
 * Extract term metadata from the PDF text with improved pattern matching
 * @param text The extracted PDF text
 * @returns Extracted term metadata with confidence scores
 */
export function extractTermMetadata(text: string): ExtractedTermMetadata {
  const metadata: ExtractedTermMetadata = {
    confidence: {
      termName: 0,
      termNumber: 0,
      location: 0,
      dates: 0,
      overall: 0
    }
  };
  
  try {
    // First, try to extract header section for focused processing
    let headerSection = text;
    const headerMatch = text.match(/## DOCUMENT HEADER START ##([\s\S]*?)## DOCUMENT HEADER END ##/);
    if (headerMatch && headerMatch[1]) {
      // Prioritize header section, but keep full text as backup
      headerSection = headerMatch[1];
    } else {
      // Limit to first page if no specific header section was found
      const firstPageMatch = text.match(/[\s\S]*?========= PAGE 1 =========/);
      if (firstPageMatch) {
        headerSection = firstPageMatch[0];
      }
    }
    
    // Extract Term Name and Number with improved patterns
    
    // Look for term name and number patterns with more variations
    // Term patterns like "FALL TERM 2025" or "TERM IV - SUMMER 2025" or "2023 JANUARY TERM"
    const termPatterns = [
      // Standard term formats
      /([A-Z]+\s+TERM\s+(?:OF\s+)?(\d{4}))/i,
      /TERM\s+([IVX]+)[\s-]+([A-Za-z]+\s+\d{4})/i,
      /([A-Za-z]+)\s+TERM[\s-]+([IVX]+)/i,
      /TERM\s+([IVX]+|\d+)[\s-]+([A-Za-z]+)/i,
      /([A-Za-z]+\s+\d{4})\s+TERM/i,
      
      // Assignment-based formats
      /ASSIGNMENT\s+OF\s+JUSTICES\s+(?:FOR|IN|TO)?\s+(?:THE\s+)?([A-Za-z]+\s+\d{4})/i,
      /ASSIGNMENT\s+OF\s+JUSTICES\s+(?:FOR|IN|TO)?\s+(?:THE\s+)?TERM\s+([IVX]+|\d+)/i,
      /JUSTICE\s+ASSIGNMENTS?\s+(?:FOR|IN|TO)?\s+(?:THE\s+)?([A-Za-z]+\s+\d{4})/i,
      
      // Year-first formats
      /(\d{4})\s+([A-Za-z]+)\s+TERM/i,
      /(\d{4})\s+([A-Za-z]+)\s+ASSIGNMENT/i,
      
      // Header-marked formats
      /## HEADER ##[^\n]*\b(?:TERM|ASSIGNMENT)[^\n]*?([A-Za-z]+\s+\d{4})[^\n]*?## HEADER ##/i,
      /## HEADER ##[^\n]*\b(?:TERM|ASSIGNMENT)[^\n]*?TERM\s+([IVX]+|\d+)[^\n]*?## HEADER ##/i,
      
      // New variations
      /SCHEDULE\s+(?:FOR|OF)\s+([A-Za-z]+\s+\d{4})/i,
      /([A-Za-z]+)\s+SESSION\s+\d{4}/i,
      /JUDICIAL\s+ASSIGNMENTS?\s+(?:FOR|IN|TO)?\s+(?:THE\s+)?([A-Za-z]+\s+\d{4})/i,
    ];
    
    // Try each pattern on both full text and header section
    let bestTermMatch: RegExpMatchArray | null = null;
    let bestConfidence = 0;
    
    // First try header section for higher confidence
    for (const pattern of termPatterns) {
      const match = headerSection.match(pattern);
      if (match) {
        // Higher confidence for matches in header section with ## markers
        const confidenceScore = headerSection.includes('## HEADER ##') ? 0.9 : 0.8;
        if (confidenceScore > bestConfidence) {
          bestTermMatch = match;
          bestConfidence = confidenceScore;
        }
      }
    }
    
    // If no good match in header, try full text
    if (bestConfidence < 0.7) {
      for (const pattern of termPatterns) {
        const match = text.match(pattern);
        if (match) {
          // Lower confidence for matches in full text
          const confidenceScore = 0.6;
          if (confidenceScore > bestConfidence) {
            bestTermMatch = match;
            bestConfidence = confidenceScore;
          }
        }
      }
    }
    
    // Process best match if found
    if (bestTermMatch) {
      // Different patterns have different group arrangements
      if (bestTermMatch[0].match(/TERM\s+[IVX]+/i)) {
        // Pattern like "TERM IV - SUMMER 2025"
        metadata.termNumber = bestTermMatch[1]?.replace(/TERM\s+/i, '').trim();
        metadata.termName = bestTermMatch[2]?.trim();
        metadata.confidence!.termNumber = bestConfidence;
        metadata.confidence!.termName = bestConfidence - 0.1; // Slightly lower confidence for derived name
      } else if (bestTermMatch[0].match(/ASSIGNMENT/i)) {
        // Pattern like "ASSIGNMENT OF JUSTICES FOR FALL 2025"
        metadata.termName = bestTermMatch[1]?.trim();
        // Try to find term number nearby
        const termNumNearby = text.match(/TERM\s+([IVX]+|\d+)/i);
        if (termNumNearby) {
          metadata.termNumber = termNumNearby[1].trim();
          metadata.confidence!.termNumber = 0.5; // Lower confidence for derived number
        }
        metadata.confidence!.termName = bestConfidence;
      } else if (bestTermMatch[0].match(/\d{4}\s+[A-Za-z]+\s+TERM/i)) {
        // Pattern like "2023 JANUARY TERM"
        metadata.termName = `${bestTermMatch[2]} ${bestTermMatch[1]}`.trim();
        metadata.confidence!.termName = bestConfidence;
      } else if (bestTermMatch[1] && bestTermMatch[2]) {
        // Pattern has both term name and number
        if (/^\d{4}$/.test(bestTermMatch[2])) {
          // Pattern like "FALL TERM 2025"
          metadata.termName = `${bestTermMatch[1].replace(/\s+\d{4}$/, '')} ${bestTermMatch[2]}`.trim();
          metadata.confidence!.termName = bestConfidence;
        } else if (/[IVX]+/i.test(bestTermMatch[2])) {
          // Pattern like "FALL TERM - IV"
          metadata.termName = bestTermMatch[1].trim();
          metadata.termNumber = bestTermMatch[2].trim();
          metadata.confidence!.termName = bestConfidence;
          metadata.confidence!.termNumber = bestConfidence;
        } else {
          // Generic fallback
          metadata.termName = bestTermMatch[1].trim();
          metadata.termNumber = bestTermMatch[2] ? bestTermMatch[2].trim() : '';
          metadata.confidence!.termName = bestConfidence;
          metadata.confidence!.termNumber = bestTermMatch[2] ? bestConfidence : 0;
        }
      } else if (bestTermMatch[1]) {
        // Simple match found
        metadata.termName = bestTermMatch[1].trim();
        metadata.confidence!.termName = bestConfidence;
      }
      
      // Cleanup and enhancement of term name
      if (metadata.termName) {
        // Clean up term name - standardize format
        let termName = metadata.termName;
        
        // Extract year if present
        const yearMatch = termName.match(/\b(20\d{2})\b/);
        let year = yearMatch ? yearMatch[1] : '';
        
        // Clean term name of year if present
        if (year) {
          termName = termName.replace(year, '').trim();
        }
        
        // Extract season/month if present
        const seasonRegex = /\b(SPRING|SUMMER|FALL|WINTER|JANUARY|FEBRUARY|MARCH|APRIL|MAY|JUNE|JULY|AUGUST|SEPTEMBER|OCTOBER|NOVEMBER|DECEMBER)\b/i;
        const seasonMatch = termName.match(seasonRegex);
        let season = seasonMatch ? seasonMatch[1].toUpperCase() : '';
        
        // If we have both season and year, format consistently
        if (season && year) {
          metadata.termName = `${season} ${year}`;
        }
      }
    }
    
    // Extract dates - looking for date patterns with enhanced formats
    const datePatterns = [
      // Standard date ranges
      /(?:FROM|PERIOD|DATES?)?\s*:\s*([A-Za-z]+\s+\d{1,2}(?:st|nd|rd|th)?,?\s*\d{4})\s*(?:TO|-|–|THROUGH)\s*([A-Za-z]+\s+\d{1,2}(?:st|nd|rd|th)?,?\s*\d{4})/i,
      /(?:FROM|PERIOD|DATES?)?\s*([A-Za-z]+\s+\d{1,2}(?:st|nd|rd|th)?,?\s*\d{4})\s*(?:TO|-|–|THROUGH)\s*([A-Za-z]+\s+\d{1,2}(?:st|nd|rd|th)?,?\s*\d{4})/i,
      
      // Same year formats
      /([A-Za-z]+\s+\d{1,2})\s*(?:TO|-|–|THROUGH)\s*([A-Za-z]+\s+\d{1,2},?\s*\d{4})/i,
      
      // Single date formats (effective date)
      /EFFECTIVE\s+(?:DATE)?\s*:?\s*([A-Za-z]+\s+\d{1,2}(?:st|nd|rd|th)?,?\s*\d{4})/i,
      /COMMENCING\s+(?:ON)?\s*:?\s*([A-Za-z]+\s+\d{1,2}(?:st|nd|rd|th)?,?\s*\d{4})/i,
      
      // Header-marked date patterns
      /## DATE ##[^\n]*?([A-Za-z]+\s+\d{1,2}(?:st|nd|rd|th)?,?\s*\d{4})\s*(?:TO|-|–|THROUGH)\s*([A-Za-z]+\s+\d{1,2}(?:st|nd|rd|th)?,?\s*\d{4})[^\n]*?## DATE ##/i,
      
      // Numeric date formats (MM/DD/YYYY)
      /(?:FROM|PERIOD|DATES?)?\s*:\s*(\d{1,2}\/\d{1,2}\/\d{4})\s*(?:TO|-|–|THROUGH)\s*(\d{1,2}\/\d{1,2}\/\d{4})/i,
      
      // New formats
      /(?:TERM|SESSION)\s+(?:DATES?|PERIOD)?\s*:?\s*([A-Za-z]+\s+\d{1,2}(?:st|nd|rd|th)?,?\s*\d{4})\s*(?:TO|-|–|THROUGH)\s*([A-Za-z]+\s+\d{1,2}(?:st|nd|rd|th)?,?\s*\d{4})/i,
      /FOR\s+THE\s+PERIOD\s+(?:OF)?\s*([A-Za-z]+\s+\d{1,2}(?:st|nd|rd|th)?,?\s*\d{4})\s*(?:TO|-|–|THROUGH)\s*([A-Za-z]+\s+\d{1,2}(?:st|nd|rd|th)?,?\s*\d{4})/i
    ];
    
    // Try each date pattern first on header text (higher confidence) then full text
    let bestDateMatch: RegExpMatchArray | null = null;
    let dateConfidence = 0;
    
    // First try header or marked sections
    for (const pattern of datePatterns) {
      // Check for dates in header marked sections first
      const headerDateSection = text.match(/## DATE ##([\s\S]*?)## DATE ##/);
      if (headerDateSection && headerDateSection[1]) {
        const match = headerDateSection[1].match(pattern);
        if (match) {
          bestDateMatch = match;
          dateConfidence = 0.95;
          break;
        }
      }
      
      // Try header section next
      const match = headerSection.match(pattern);
      if (match) {
        bestDateMatch = match;
        dateConfidence = 0.85;
        break;
      }
    }
    
    // If no match in header, try full text
    if (!bestDateMatch) {
      for (const pattern of datePatterns) {
        const match = text.match(pattern);
        if (match) {
          bestDateMatch = match;
          dateConfidence = 0.7;
          break;
        }
      }
    }
    
    // Process best date match if found
    if (bestDateMatch) {
      try {
        // Clean and parse dates
        if (bestDateMatch[1] && bestDateMatch[2]) {
          // Clean the date strings - remove ordinal indicators
          let startDateStr = bestDateMatch[1].replace(/(?:st|nd|rd|th)/g, '');
          let endDateStr = bestDateMatch[2].replace(/(?:st|nd|rd|th)/g, '');
          
          // Check if these are MM/DD/YYYY format
          const isNumericDate = /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(startDateStr);
          
          // Handle numeric date format
          if (isNumericDate) {
            metadata.startDate = new Date(startDateStr);
            metadata.endDate = new Date(endDateStr);
          } else {
            // If start date doesn't have a year but end date does, borrow the year
            if (!/\d{4}/.test(startDateStr) && /\d{4}/.test(endDateStr)) {
              const year = endDateStr.match(/\d{4}/)?.[0];
              if (year) {
                startDateStr = `${startDateStr} ${year}`;
              }
            }
            
            // Try to parse the dates
            metadata.startDate = new Date(startDateStr);
            metadata.endDate = new Date(endDateStr);
          }
          
          // Validate dates are valid
          if (isNaN(metadata.startDate.getTime())) {
            metadata.startDate = undefined;
          } else {
            metadata.confidence!.dates = dateConfidence;
          }
          
          if (isNaN(metadata.endDate.getTime())) {
            metadata.endDate = undefined;
          } else if (metadata.startDate) {
            // If we have both dates, increase confidence
            metadata.confidence!.dates = dateConfidence;
          }
          
          // If we only found start date, try to infer end date (approximately 3 months later)
          if (metadata.startDate && !metadata.endDate) {
            const estimatedEnd = new Date(metadata.startDate);
            estimatedEnd.setMonth(estimatedEnd.getMonth() + 3);
            metadata.endDate = estimatedEnd;
            // Lower confidence for estimated end date
            metadata.confidence!.dates = Math.max(0.5, dateConfidence - 0.2);
          }
        } else if (bestDateMatch[1]) {
          // Only found a single date (like "EFFECTIVE JANUARY 5, 2025")
          const dateStr = bestDateMatch[1].replace(/(?:st|nd|rd|th)/g, '');
          metadata.startDate = new Date(dateStr);
          
          // Validate date is valid
          if (isNaN(metadata.startDate.getTime())) {
            metadata.startDate = undefined;
          } else {
            // Set end date to approximately 3 months after start
            const estimatedEnd = new Date(metadata.startDate);
            estimatedEnd.setMonth(estimatedEnd.getMonth() + 3);
            metadata.endDate = estimatedEnd;
            metadata.confidence!.dates = 0.6; // Lower confidence for inferred date range
          }
        }
      } catch (e) {
        console.error("Error parsing dates:", e);
        metadata.startDate = undefined;
        metadata.endDate = undefined;
      }
    }
    
    // Extract location with improved patterns
    const locationPatterns = [
      // Standard location patterns
      /SUPREME COURT(?:,|\s+OF)?\s+([A-Za-z\s]+)(?:,|\s+COUNTY)?/i,
      /COUNTY\s+OF\s+([A-Za-z\s]+)/i,
      /([A-Za-z]+)\s+COUNTY/i,
      /COURTHOUSE,\s+([A-Za-z\s]+)/i,
      
      // Enhanced building specific patterns
      /([A-Za-z]+)\s+SUPREME\s+COURT/i,
      /SUPREME\s+COURT,\s+([A-Za-z]+)(?:\s+COUNTY)?/i,
      
      // Address-based patterns
      /\b(?:AT|IN)\s+(\d+\s+[A-Za-z\s]+?\s+(?:STREET|ST|AVENUE|AVE|BOULEVARD|BLVD))(?:,|\s+[A-Za-z]+)/i,
      /\b(\d+\s+(?:CENTRE|CENTER)\s+(?:STREET|ST))(?:,|\s+[A-Za-z]+)/i,
      
      // Header-marked location patterns
      /## LOCATION ##[^\n]*?([A-Z][A-Za-z]+(?:\s+County)?)[^\n]*?## LOCATION ##/i
    ];
    
    // Try each location pattern with confidence scoring
    let bestLocationMatch: RegExpMatchArray | null = null;
    let locationConfidence = 0;
    
    // First check for location in marked sections
    const headerLocationSection = text.match(/## LOCATION ##([\s\S]*?)## LOCATION ##/);
    if (headerLocationSection && headerLocationSection[1]) {
      for (const pattern of locationPatterns) {
        const match = headerLocationSection[1].match(pattern);
        if (match && match[1]) {
          bestLocationMatch = match;
          locationConfidence = 0.95;
          break;
        }
      }
    }
    
    // Try header section next
    if (!bestLocationMatch) {
      for (const pattern of locationPatterns) {
        const match = headerSection.match(pattern);
        if (match && match[1]) {
          bestLocationMatch = match;
          locationConfidence = 0.85;
          break;
        }
      }
    }
    
    // If no match in header, try full text
    if (!bestLocationMatch) {
      for (const pattern of locationPatterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
          bestLocationMatch = match;
          locationConfidence = 0.7;
          break;
        }
      }
    }
    
    // Process location match if found
    if (bestLocationMatch && bestLocationMatch[1]) {
      let location = bestLocationMatch[1].trim();
      
      // Clean up the location name
      location = location.replace(/COUNTY|COURTHOUSE|SUPREME COURT/gi, '').trim();
      
      // Map to standardized location if it's recognized
      const locationMap: Record<string, string> = {
        "KINGS": "Brooklyn",
        "NEW YORK": "Manhattan",
        "QUEENS": "Queens",
        "BRONX": "Bronx",
        "RICHMOND": "Staten Island",
        "MANHATTAN": "Manhattan",
        "BROOKLYN": "Brooklyn"
      };
      
      metadata.location = locationMap[location.toUpperCase()] || location;
      metadata.confidence!.location = locationConfidence;
      
      // Additional check for NYC boroughs in address
      if (!metadata.location || !Object.values(locationMap).includes(metadata.location)) {
        // Try to find borough names in the text
        for (const [key, value] of Object.entries(locationMap)) {
          const boroughRegex = new RegExp(`\\b${key}\\b`, 'i');
          if (boroughRegex.test(text.substring(0, 2000))) { // Check first 2000 chars
            metadata.location = value;
            metadata.confidence!.location = 0.6;
            break;
          }
        }
      }
    }
    
    // Calculate overall confidence
    const confidences = [
      metadata.confidence!.termName || 0,
      metadata.confidence!.termNumber || 0,
      metadata.confidence!.location || 0,
      metadata.confidence!.dates || 0
    ].filter(c => c > 0);
    
    if (confidences.length > 0) {
      metadata.confidence!.overall = confidences.reduce((a, b) => a + b, 0) / confidences.length;
    }
    
    // Get term year from startDate if available but term name doesn't have year
    if (metadata.startDate && metadata.termName && !/\d{4}/.test(metadata.termName)) {
      const year = metadata.startDate.getFullYear();
      if (year >= 2000 && year <= 2100) { // Sanity check for valid year
        metadata.termName = `${metadata.termName.trim()} ${year}`;
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
