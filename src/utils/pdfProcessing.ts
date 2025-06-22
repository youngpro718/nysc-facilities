
export interface TermAssignment {
  part: string;
  justice: string;
  room?: string;
  tel?: string;
  sgt?: string;
  clerks?: string;
  extension?: string;
  fax?: string;
}

export interface ExtractedTermMetadata {
  termName?: string;
  termNumber?: string;
  location?: string;
  startDate?: Date;
  endDate?: Date;
  confidence?: {
    overall?: number;
    termName?: number;
    termNumber?: number;
    location?: number;
    dates?: number;
  };
}

export function getReadableFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function validatePDFFile(file: File): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: "No file provided" };
  }
  
  if (file.type !== 'application/pdf') {
    return { valid: false, error: "File must be a PDF" };
  }
  
  if (file.size > 10 * 1024 * 1024) { // 10MB limit
    return { valid: false, error: "File size must be less than 10MB" };
  }
  
  return { valid: true };
}

export async function extractTextFromPDF(arrayBuffer: ArrayBuffer): Promise<string> {
  try {
    // This is a placeholder implementation
    // In a real application, you would use a PDF parsing library like pdf-parse or pdfjs-dist
    return "Extracted PDF text would go here";
  } catch (error) {
    console.error("Error extracting text from PDF:", error);
    throw new Error("Failed to extract text from PDF");
  }
}

export function parseAssignmentsFromText(text: string): { assignments: TermAssignment[]; method: string } {
  // This is a placeholder implementation
  // In a real application, you would parse the actual PDF text
  const mockAssignments: TermAssignment[] = [
    {
      part: "Part 1",
      justice: "Justice Smith",
      room: "Room 101",
      tel: "555-0123",
      sgt: "Sgt. Johnson",
      clerks: "Clerk A, Clerk B"
    }
  ];
  
  return {
    assignments: mockAssignments,
    method: "Mock Parser"
  };
}

export function extractTermMetadata(text: string): ExtractedTermMetadata {
  // This is a placeholder implementation
  // In a real application, you would extract metadata from the actual PDF text
  return {
    termName: "Sample Term",
    termNumber: "Term 1",
    location: "Manhattan",
    startDate: new Date(),
    endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
    confidence: {
      overall: 0.8,
      termName: 0.9,
      termNumber: 0.7,
      location: 0.8,
      dates: 0.6
    }
  };
}

export function formatPart(part: string, prefix?: string): string {
  if (!part) return '';
  return prefix ? `${prefix} ${part}` : part;
}

export function formatPhone(phone?: string): string {
  if (!phone) return '';
  return phone;
}

export function formatSergeant(sergeant?: string): string {
  if (!sergeant) return '';
  return sergeant;
}

export function formatClerks(clerks?: string): string {
  if (!clerks) return '';
  return clerks;
}
