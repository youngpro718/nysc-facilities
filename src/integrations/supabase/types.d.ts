
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      // Define your tables here
      rooms: {
        Row: {
          id: string
          name: string
          room_number: string
          room_type: string
          floor_id: string
          // Add other fields as needed
        }
        Insert: {
          id?: string
          name: string
          room_number: string
          room_type?: string
          floor_id: string
          // Add other fields as needed
        }
        Update: {
          id?: string
          name?: string
          room_number?: string
          room_type?: string
          floor_id?: string
          // Add other fields as needed
        }
      }
      // Add other tables as needed
    }
    // Add other schemas as needed
  }
}

export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
export type TablesRow<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
