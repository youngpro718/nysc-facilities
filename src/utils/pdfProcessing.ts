
import { SupabaseClient } from '@supabase/supabase-js';

export interface CourtTermData {
  assignments: Array<{
    part: string;
    justice: string;
    room_number: string;
    fax?: string;
    tel?: string;
    sergeant?: string;
    clerks?: string[];
  }>;
}

export interface TermAssignment {
  part: string;
  justice: string;
  room: string;
  tel?: string;
  sgt?: string;
  clerks?: string[];
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

export function validatePDFFile(file: File): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }
  
  if (!file.type.includes('pdf')) {
    return { valid: false, error: 'File must be a PDF' };
  }
  
  if (file.size > 10 * 1024 * 1024) { // 10MB limit
    return { valid: false, error: 'File size must be less than 10MB' };
  }
  
  return { valid: true };
}

export async function extractTextFromPDF(arrayBuffer: ArrayBuffer): Promise<string> {
  // Mock implementation - in a real app you'd use a PDF parsing library
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(`Mock PDF text content from ${arrayBuffer.byteLength} bytes`);
    }, 500);
  });
}

export function parseAssignmentsFromText(text: string): { assignments: TermAssignment[], method: string } {
  // Mock implementation
  const mockAssignments: TermAssignment[] = [
    {
      part: 'Part 1A',
      justice: 'Hon. John Smith',
      room: '101',
      tel: '555-0123',
      sgt: 'Sgt. Johnson',
      clerks: ['Mary Wilson', 'Bob Davis']
    },
    {
      part: 'Part 2B',
      justice: 'Hon. Jane Doe', 
      room: '102',
      tel: '555-0124',
      sgt: 'Sgt. Williams',
      clerks: ['Alice Brown', 'Charlie Green']
    }
  ];
  
  return {
    assignments: mockAssignments,
    method: 'Pattern Recognition'
  };
}

export function formatPart(part: string, details?: string): string {
  return details ? `${part} (${details})` : part;
}

export function formatPhone(phone?: string): string {
  return phone || '—';
}

export function formatSergeant(sergeant?: string): string {
  return sergeant || '—';
}

export function formatClerks(clerks?: string[]): string {
  return clerks && clerks.length > 0 ? clerks.join(', ') : '—';
}

export function getReadableFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function extractTermMetadata(text: string): ExtractedTermMetadata {
  // Mock implementation
  return {
    termName: 'Fall 2025 Term',
    termNumber: 'Term IV',
    location: 'Manhattan',
    startDate: new Date('2025-09-01'),
    endDate: new Date('2025-12-31'),
    confidence: {
      overall: 0.85,
      termName: 0.90,
      termNumber: 0.80,
      location: 0.75,
      dates: 0.85
    }
  };
}

export async function processCourtTermPdf(file: File): Promise<CourtTermData> {
  // This is a simplified implementation
  // In a real implementation, you would use a PDF parsing library
  // to extract the actual court term data from the PDF
  
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Mock data for demonstration
      const mockData: CourtTermData = {
        assignments: [
          {
            part: 'Part 1A',
            justice: 'Hon. John Smith',
            room_number: '101',
            tel: '555-0123',
            sergeant: 'Sgt. Johnson',
            clerks: ['Mary Wilson', 'Bob Davis']
          },
          {
            part: 'Part 2B', 
            justice: 'Hon. Jane Doe',
            room_number: '102',
            tel: '555-0124',
            sergeant: 'Sgt. Williams',
            clerks: ['Alice Brown', 'Charlie Green']
          }
        ]
      };
      
      resolve(mockData);
    }, 1000);
  });
}

export async function importCourtTermData(
  data: CourtTermData,
  supabase: SupabaseClient
): Promise<void> {
  // Create a new court term
  const { data: termData, error: termError } = await supabase
    .from('court_terms')
    .insert({
      term_number: `TERM-${Date.now()}`,
      term_name: 'Imported Court Term',
      location: 'Main Courthouse',
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    })
    .select()
    .single();

  if (termError) {
    throw new Error(`Failed to create court term: ${termError.message}`);
  }

  // Insert assignments
  const assignments = data.assignments.map(assignment => ({
    term_id: termData.id,
    room_id: null, // Would need to look up actual room IDs
    part: assignment.part,
    justice: assignment.justice,
    room_number: assignment.room_number,
    fax: assignment.fax,
    tel: assignment.tel,
    sergeant: assignment.sergeant,
    clerks: assignment.clerks || []
  }));

  const { error: assignmentError } = await supabase
    .from('court_assignments')
    .insert(assignments);

  if (assignmentError) {
    throw new Error(`Failed to create assignments: ${assignmentError.message}`);
  }
}
