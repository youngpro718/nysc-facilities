import { Room } from "@/components/spaces/rooms/types/RoomTypes";

export type TermPersonnelRole = 
  | 'administrative_judge'
  | 'chief_clerk'
  | 'deputy_chief_clerk'
  | 'court_clerk_specialist'
  | 'senior_court_reporter'
  | 'senior_law_librarian'
  | 'major'
  | 'captain';

export interface CourtTerm {
  id: string;
  term_number: string;
  term_name: string;
  description: string;
  start_date: string;
  end_date: string;
  location: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface CourtPart {
  id: string;
  part_code: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface TermPersonnel {
  id: string;
  term_id: string;
  role: TermPersonnelRole;
  name: string;
  phone?: string;
  extension?: string;
  room?: string;
  floor?: string;
  created_at: string;
  updated_at: string;
}

export interface TermAssignment {
  id: string;
  term_id: string;
  part_id?: string;
  part_code?: string; // Added for OCR import handling
  room_id: string;
  room_number?: string; // Added for OCR import handling
  justice_name: string;
  fax?: string;
  phone?: string;
  tel_extension?: string;
  sergeant_name?: string;
  clerk_names?: string[];
  start_date?: string; // Adding date fields for assignment periods
  end_date?: string; // Adding date fields for assignment periods
  term?: CourtTerm;
  part?: CourtPart;
  room?: Room;
  created_at: string;
  updated_at: string;
}

export interface CreateTermFormData {
  term_number: string;
  term_name: string;
  description: string;
  start_date: string;
  end_date: string;
  location: string;
  metadata?: Record<string, any>;
}

export interface CreateTermAssignmentFormData {
  term_id: string;
  part_code?: string;
  room_id: string;
  justice_name: string;
  fax?: string;
  phone?: string;
  tel_extension?: string;
  sergeant_name?: string;
  clerk_names?: string[];
}

export interface CreateTermPersonnelFormData {
  term_id: string;
  role: TermPersonnelRole;
  name: string;
  phone?: string;
  extension?: string;
  room?: string;
  floor?: string;
}

export interface TermImportData {
  term: Partial<CourtTerm>;
  assignments: Partial<TermAssignment>[];
  personnel: Partial<TermPersonnel>[];
}
