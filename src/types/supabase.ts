
export type Database = {
  public: {
    Tables: {
      rooms: {
        Row: {
          id: string;
          name: string;
          room_number: string | null;
          room_type: string;
          status: string;
          floor_id: string;
          description: string | null;
          phone_number: string | null;
          is_storage: boolean;
          storage_type: string | null;
          storage_capacity: number | null;
          parent_room_id: string | null;
          current_function: string | null;
          created_at: string;
          updated_at: string;
          position: { x: number; y: number } | null;
          size: { width: number; height: number } | null;
          rotation: number | null;
          courtroom_photos: {
            judge_view: string | null;
            audience_view: string | null;
          } | null;
        };
        Insert: {
          id?: string;
          name: string;
          room_number?: string | null;
          room_type: string;
          status?: string;
          floor_id: string;
          description?: string | null;
          phone_number?: string | null;
          is_storage?: boolean;
          storage_type?: string | null;
          storage_capacity?: number | null;
          parent_room_id?: string | null;
          current_function?: string | null;
          position?: { x: number; y: number } | null;
          size?: { width: number; height: number } | null;
          rotation?: number | null;
          courtroom_photos?: {
            judge_view: string | null;
            audience_view: string | null;
          } | null;
        };
        Update: {
          id?: string;
          name?: string;
          room_number?: string | null;
          room_type?: string;
          status?: string;
          floor_id?: string;
          description?: string | null;
          phone_number?: string | null;
          is_storage?: boolean;
          storage_type?: string | null;
          storage_capacity?: number | null;
          parent_room_id?: string | null;
          current_function?: string | null;
          position?: { x: number; y: number } | null;
          size?: { width: number; height: number } | null;
          rotation?: number | null;
          courtroom_photos?: {
            judge_view: string | null;
            audience_view: string | null;
          } | null;
        };
      };
      court_terms: {
        Row: {
          id: string;
          term_name: string;
          term_number: string;
          start_date: string;
          end_date: string;
          status: string;
          location: string;
          description: string | null;
          pdf_url: string | null;
          metadata: any;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          term_name: string;
          term_number: string;
          start_date: string;
          end_date: string;
          status?: string;
          location: string;
          description?: string | null;
          pdf_url?: string | null;
          metadata?: any;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          term_name?: string;
          term_number?: string;
          start_date?: string;
          end_date?: string;
          status?: string;
          location?: string;
          description?: string | null;
          pdf_url?: string | null;
          metadata?: any;
          created_by?: string | null;
        };
      };
    };
  };
};

export type CourtTerm = Database['public']['Tables']['court_terms']['Row'];
