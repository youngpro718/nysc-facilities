
export interface Term {
  id: string;
  term_name: string;
  term_number: string;
  start_date: string;
  end_date: string;
  status: string;
  pdf_url: string;
  location: string;
  description: string;
  created_at: string;
  created_by: string;
  updated_at: string;
  metadata: any;
}

export interface TermUploadResponse {
  success: boolean;
  message: string;
  term_id?: string;
  errors?: string[];
}
