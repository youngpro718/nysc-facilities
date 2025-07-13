import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';

// Configure PDF.js worker properly for browser environment
console.log('🔧 Configuring PDF.js worker for browser...');
GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

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
  console.log('🔄 Starting PDF parsing for file:', file.name, 'Size:', file.size, 'bytes');
  
  // Validate file
  if (!file || file.size === 0) {
    throw new Error('Invalid or empty PDF file');
  }
  
  if (file.size > 50 * 1024 * 1024) { // 50MB limit
    throw new Error('PDF file too large (max 50MB)');
  }

  let attemptCount = 0;
  const maxAttempts = 2;
  
  while (attemptCount < maxAttempts) {
    attemptCount++;
    console.log(`📄 PDF parsing attempt ${attemptCount}/${maxAttempts}`);
    
    try {
      // Ensure worker is properly configured on retry
      if (attemptCount > 1) {
        console.log('🔄 Preparing retry attempt...');
        GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      console.log('📖 Reading file as array buffer...');
      const arrayBuffer = await file.arrayBuffer();
      console.log('✅ File read successfully, size:', arrayBuffer.byteLength, 'bytes');
      
      if (arrayBuffer.byteLength === 0) {
        throw new Error('PDF file appears to be empty');
      }
      
      console.log('🔍 Loading PDF document...');
      const loadingTask = getDocument({ 
        data: arrayBuffer,
        verbosity: 0, // Reduce PDF.js internal logging
        stopAtErrors: false, // Allow partial loading
        disableAutoFetch: false,
        disableStream: false,
        isEvalSupported: false // Enhanced security
      });
      
      // Add timeout to prevent hanging
      const timeoutMs = 30000; // 30 seconds
      let timeoutId: NodeJS.Timeout;
      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error('PDF loading timeout')), timeoutMs);
      });
      
      const pdf = await Promise.race([
        loadingTask.promise,
        timeoutPromise
      ]) as any; // Cast to any to avoid complex type inference issues
      
      clearTimeout(timeoutId!);
      
      console.log('✅ PDF document loaded successfully, pages:', pdf.numPages);
      
      if (pdf.numPages === 0) {
        throw new Error('PDF contains no pages');
      }
      
      console.log('📝 Extracting text from all pages...');
      let fullText = '';
      let pagesProcessed = 0;
      
      for (let i = 1; i <= pdf.numPages; i++) {
        try {
          console.log(`📄 Processing page ${i}/${pdf.numPages}...`);
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .map((item: any) => item.str || '')
            .join(' ')
            .trim();
          
          if (pageText) {
            fullText += pageText + '\n';
            pagesProcessed++;
          }
          
          console.log(`✅ Page ${i} processed, text length: ${pageText.length}`);
        } catch (pageError) {
          console.warn(`⚠️ Failed to process page ${i}:`, pageError);
          // Continue with other pages
        }
      }
      
      console.log(`✅ Text extraction complete. Pages processed: ${pagesProcessed}/${pdf.numPages}`);
      console.log('📊 Total extracted text length:', fullText.length);
      
      if (fullText.length === 0) {
        throw new Error('No text could be extracted from the PDF');
      }
      
      if (fullText.length < 50) {
        console.warn('⚠️ Very little text extracted, PDF might be image-based or corrupted');
      }
      
      console.log('🔍 First 200 characters of extracted text:', fullText.substring(0, 200));
      
      console.log('🔧 Parsing extracted text...');
      const result = parseTermSheetText(fullText);
      console.log('✅ Parsing complete. Found assignments:', result.assignments.length);
      console.log('📋 Parsed data:', {
        termName: result.termName,
        location: result.location,
        assignmentCount: result.assignments.length
      });
      
      if (result.assignments.length === 0) {
        console.warn('⚠️ No assignments found in PDF - this might indicate parsing issues');
      }
      
      return result;
      
    } catch (error) {
      console.error(`❌ PDF parsing attempt ${attemptCount} failed:`, error);
      
      if (attemptCount >= maxAttempts) {
        // Provide more specific error messages
        let errorMessage = 'Failed to parse PDF file';
        if (error instanceof Error) {
          if (error.message.includes('timeout')) {
            errorMessage = 'PDF processing timed out - file might be too complex';
          } else if (error.message.includes('worker')) {
            errorMessage = 'PDF processing failed - worker initialization error';
          } else if (error.message.includes('Invalid PDF')) {
            errorMessage = 'Invalid or corrupted PDF file';
          } else {
            errorMessage = error.message;
          }
        }
        throw new Error(errorMessage);
      }
      
      // Wait before retry
      console.log(`⏳ Waiting before retry attempt ${attemptCount + 1}...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  throw new Error('PDF parsing failed after all retry attempts');
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