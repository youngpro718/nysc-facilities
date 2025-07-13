import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';

// Set up PDF.js worker - use a compatible version
GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.js',
  import.meta.url
).toString();

// Add polyfill for Promise.withResolvers if not available
declare global {
  interface PromiseConstructor {
    withResolvers?<T>(): {
      promise: Promise<T>;
      resolve: (value: T | PromiseLike<T>) => void;
      reject: (reason?: any) => void;
    };
  }
}

if (typeof Promise.withResolvers === 'undefined') {
  Promise.withResolvers = function<T>() {
    let resolve: (value: T | PromiseLike<T>) => void;
    let reject: (reason?: any) => void;
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve: resolve!, reject: reject! };
  };
}

export interface ParsedAssignment {
  partCode: string;
  justiceName: string;
  roomNumber?: string;
  clerkNames?: string[];
  sergeantName?: string;
  phone?: string;
  fax?: string;
  extension?: string;
  location?: string;
}

export interface ParsedTermData {
  termName?: string;
  termNumber?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  assignments: ParsedAssignment[];
}

export const parsePDF = async (file: File): Promise<ParsedTermData> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await getDocument({ data: arrayBuffer }).promise;
  
  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');
    fullText += pageText + '\n';
  }
  
  return parseTermSheetText(fullText);
};

const parseTermSheetText = (text: string): ParsedTermData => {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  // Extract header information
  const termData: ParsedTermData = {
    assignments: []
  };
  
  // Look for term name and dates in the header
  const termNameMatch = text.match(/SUPREME COURT.*?CRIMINAL TERM/i);
  if (termNameMatch) {
    termData.termName = termNameMatch[0].trim();
  }
  
  // Look for location information
  if (text.includes('100 Centre Street')) {
    termData.location = '100 Centre Street, New York, NY';
  } else if (text.includes('111 Centre Street')) {
    termData.location = '111 Centre Street, New York, NY';
  }
  
  // Parse assignment table
  const assignments = parseAssignmentTable(text);
  termData.assignments = assignments;
  
  return termData;
};

const parseAssignmentTable = (text: string): ParsedAssignment[] => {
  const assignments: ParsedAssignment[] = [];
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  // Find the start of the assignment table
  let tableStartIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('PART') && lines[i].includes('JUSTICE') && lines[i].includes('ROOM')) {
      tableStartIndex = i + 1;
      break;
    }
  }
  
  if (tableStartIndex === -1) return assignments;
  
  // Parse each assignment row
  for (let i = tableStartIndex; i < lines.length; i++) {
    const line = lines[i];
    
    // Skip header lines and empty lines
    if (line.includes('PART') || line.includes('JUSTICE') || line.length < 10) {
      continue;
    }
    
    // Stop if we hit the end of the table
    if (line.includes('Note:') || line.includes('*') || line.includes('Legend')) {
      break;
    }
    
    const assignment = parseAssignmentLine(line);
    if (assignment && assignment.partCode && assignment.justiceName) {
      assignments.push(assignment);
    }
  }
  
  return assignments;
};

const parseAssignmentLine = (line: string): ParsedAssignment | null => {
  // Split the line by multiple spaces or tabs
  const parts = line.split(/\s{2,}|\t/).map(p => p.trim()).filter(p => p.length > 0);
  
  if (parts.length < 3) return null;
  
  const assignment: ParsedAssignment = {
    partCode: '',
    justiceName: ''
  };
  
  // Part code is usually the first column
  assignment.partCode = parts[0];
  
  // Justice name is usually the second column
  assignment.justiceName = parts[1].replace(/\*/g, ''); // Remove asterisks
  
  // Room number is usually the third column
  if (parts[2] && parts[2] !== '-' && !isNaN(parseInt(parts[2]))) {
    assignment.roomNumber = parts[2];
  }
  
  // Look for clerks in the remaining parts
  for (let i = 3; i < parts.length; i++) {
    const part = parts[i];
    
    // If it looks like a name (contains letters and possibly commas)
    if (/^[A-Za-z\s,]+$/.test(part) && part.length > 2) {
      if (!assignment.clerkNames) assignment.clerkNames = [];
      assignment.clerkNames.push(...part.split(',').map(n => n.trim()).filter(n => n.length > 0));
    }
    
    // If it looks like a phone number or extension
    if (/^\d{3,4}$/.test(part)) {
      assignment.extension = part;
    }
    
    // If it contains "SGT" it's probably a sergeant
    if (part.toLowerCase().includes('sgt')) {
      assignment.sergeantName = part.replace(/sgt\.?/i, '').trim();
    }
  }
  
  return assignment;
};