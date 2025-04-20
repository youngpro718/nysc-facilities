
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
 * Extract text from a PDF document
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
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      extractedText += pageText + '\n';
    }
    
    return extractedText;
  } catch (error) {
    console.error("Error extracting text from PDF:", error);
    throw new Error("Failed to extract text from PDF");
  }
}

/**
 * Primary assignment extractor using regex pattern matching
 * @param text The extracted PDF text
 * @returns Array of parsed assignments
 */
export function extractAssignmentsByPattern(text: string): TermAssignment[] {
  try {
    const lines = text.split(/\n/).map(line => line.trim()).filter(Boolean);
    const assignmentPattern = /\b([A-Z0-9-]+)\s+([A-Za-z\s\.-]+)(?:\s+([Rr]oom\s+)?(\d+[A-Z]?))?(?:\s+\(?(\d[-\d]+)\)?)?/i;
    
    const assignments: TermAssignment[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const match = line.match(assignmentPattern);
      
      if (match) {
        const [_, part, justice, roomPrefix, room, phone] = match;
        
        let sgt = '';
        let clerks: string[] = [];
        
        // Check for SGT in next line
        if (i + 1 < lines.length && lines[i + 1].includes('SGT')) {
          sgt = lines[i + 1].replace('SGT', '').trim();
          i++;
        }
        
        // Collect clerk lines
        let clerkLine = '';
        while (i + 1 < lines.length && !lines[i + 1].match(assignmentPattern)) {
          clerkLine += ' ' + lines[i + 1];
          i++;
          
          if (lines[i].includes('PART') || lines[i].includes('JUDGE')) break;
        }
        
        if (clerkLine) {
          clerks = clerkLine.split(',').map(c => c.trim()).filter(Boolean);
          if (clerks.length === 0 && clerkLine.trim()) {
            clerks = [clerkLine.trim()];
          }
        }
        
        assignments.push({
          part,
          justice: justice.trim(),
          room,
          tel: phone,
          sgt,
          clerks
        });
      }
    }
    
    return assignments;
  } catch (error) {
    console.error("Error in extractAssignmentsByPattern:", error);
    return [];
  }
}

/**
 * Secondary extraction method using structural patterns
 * @param text The extracted PDF text
 * @returns Array of parsed assignments
 */
export function extractAssignmentsByStructure(text: string): TermAssignment[] {
  try {
    // Looking for structured patterns like tables or columns
    const tablePattern = /([A-Z0-9-]+)\s+([A-Za-z\s\.-]+)/g;
    let match;
    let tableAssignments: TermAssignment[] = [];
    
    while ((match = tablePattern.exec(text)) !== null) {
      const [_, part, justice] = match;
      if (part && justice && part.length < 10) {
        tableAssignments.push({
          part,
          justice: justice.trim(),
          room: null,
          tel: null,
          fax: null,
          sgt: "",
          clerks: []
        });
      }
    }
    
    return tableAssignments;
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
  try {
    // Try primary extraction method
    const patternAssignments = extractAssignmentsByPattern(text);
    
    // If few assignments found, try secondary method
    if (patternAssignments.length < 3) {
      console.info("Few assignments found with primary method, trying secondary approach");
      const structuralAssignments = extractAssignmentsByStructure(text);
      
      // Use results from secondary method if it found more assignments
      if (structuralAssignments.length > patternAssignments.length && structuralAssignments.length < 50) {
        return structuralAssignments;
      }
    }
    
    return patternAssignments;
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
  if (/^\(\d\)\d{4}$/.test(phone)) return phone;
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 5 && digits[0] === '6') {
    return `(6)${digits.slice(1)}`;
  }
  if (digits.length === 4) {
    return `(6)${digits}`;
  }
  return phone;
}

/**
 * Format sergeant name consistently
 */
export function formatSergeant(sgt: string | undefined): string {
  if (!sgt || typeof sgt !== 'string') return '—';
  const parts = sgt.trim().split(/\s+/);
  return parts.length > 0 ? parts[parts.length - 1].replace(/[^A-Z\-]/gi, '') : sgt;
}

/**
 * Format clerk names consistently
 */
export function formatClerks(clerks: string[] | string | undefined): string {
  if (!clerks) return '—';
  if (typeof clerks === 'string') clerks = clerks.split(',').map(c => c.trim()).filter(Boolean);
  if (!Array.isArray(clerks) || clerks.length === 0) return '—';
  return clerks.map(name => {
    if (/^[A-Z]\.\s+[A-Za-z\-']+$/.test(name)) return name;
    const parts = name.split(/\s+/);
    if (parts.length >= 2) {
      let initial = parts[0].replace(/[^A-Z.]/gi, '');
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
