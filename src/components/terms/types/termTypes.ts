
export interface Term {
  id: string;
  term_name: string;
  term_number: string;
  location?: string;
  start_date: string;
  end_date: string;
  status: string;
  description?: string;
  pdf_url: string | null;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  metadata?: any;
}

export interface TermAssignment {
  id: string;
  term_id: string;
  part_id: string;
  room_id: string | null;
  justice_name: string;
  sergeant_name?: string;
  clerk_names?: string[];
  phone?: string;
  tel_extension?: string;
  fax?: string;
  created_at?: string;
  updated_at?: string;
  
  // Related data that might be joined
  room?: {
    id: string;
    name: string;
    room_number?: string;
    room_type?: string;
    status?: string;
    description?: string;
  };
  part?: {
    id: string;
    part_code: string;
    description?: string;
  };
}

export interface TermUploadResponse {
  success: boolean;
  message: string;
  term_id?: string;
  errors?: string[];
}
