
export interface Term {
  id: string;
  term_name: string;
  term_number: string | null;
  location: string;
  status: string;
  start_date: string;
  end_date: string;
  pdf_url: string;
  created_at: string;
  assignment_count: number;
  metadata?: any;
  created_by?: string;
  description?: string;
  updated_at?: string;
}

export interface TermAssignment {
  id: string;
  term_id: string;
  justice_name: string;
  part_id: string | null;
  room_id: string | null;
  phone: string | null;
  tel_extension: string | null;
  sergeant_name: string | null;
  clerk_names: string[] | null;
  fax: string | null;
  created_at: string;
  updated_at: string;
}

export interface TermFilterState {
  status: string | null;
  location: string | null;
  search: string;
}
