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
      [key: string]: {
        Row: Record<string, any>
        Insert: Record<string, any>
        Update: Record<string, any>
        Relationships: {
          foreignKeyName: string
          columns: string[]
          isOneToOne: boolean
          referencedRelation: string
          referencedColumns: string[]
        }[]
      }
    }
    Views: {
      [key: string]: {
        Row: Record<string, any>
      }
    }
    Functions: {
      [key: string]: {
        Args: Record<string, any>
        Returns: any
      }
    }
    Enums: {
      access_level_enum: 'none' | 'read' | 'write' | 'admin'
      verification_status: 'pending' | 'verified' | 'rejected'
    }
  }
}
