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
      buildings: {
        Row: {
          id: string
          name: string
          address: string
          status: 'active' | 'inactive' | 'under_maintenance'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          address: string
          status?: 'active' | 'inactive' | 'under_maintenance'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          address?: string
          status?: 'active' | 'inactive' | 'under_maintenance'
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      doors: {
        Row: {
          id: string
          name: string
          room_id: string
          status: string
          hardware_status: {
            lock: boolean
            hinges: boolean
            doorknob: boolean
            frame: boolean
            wind_pressure: boolean
          }
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          room_id: string
          status?: string
          hardware_status?: {
            lock: boolean
            hinges: boolean
            doorknob: boolean
            frame: boolean
            wind_pressure: boolean
          }
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          room_id?: string
          status?: string
          hardware_status?: {
            lock: boolean
            hinges: boolean
            doorknob: boolean
            frame: boolean
            wind_pressure: boolean
          }
          created_at?: string
          updated_at?: string
        }
      }
      floors: {
        Row: {
          id: string
          building_id: string
          name: string
          floor_number: number
          height: number
          status: 'active' | 'inactive'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          building_id: string
          name: string
          floor_number: number
          height?: number
          status?: 'active' | 'inactive'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          building_id?: string
          name?: string
          floor_number?: number
          height?: number
          status?: 'active' | 'inactive'
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "floors_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          }
        ]
      }
      hallways: {
        Row: {
          id: string
          floor_id: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          floor_id: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          floor_id?: string
          name?: string
          created_at?: string
          updated_at?: string
        }
      }
      lighting_fixtures: {
        Row: {
          id: string
          room_id: string
          name: string
          type: string
          status: 'working' | 'not_working' | 'maintenance'
          bulb_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          room_id: string
          name: string
          type: string
          status?: 'working' | 'not_working' | 'maintenance'
          bulb_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          name?: string
          type?: string
          status?: 'working' | 'not_working' | 'maintenance'
          bulb_count?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lighting_fixtures_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          }
        ]
      }
      rooms: {
        Row: {
          id: string
          floor_id: string
          name: string
          room_number: string
          status: 'active' | 'inactive'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          floor_id: string
          name: string
          room_number: string
          status?: 'active' | 'inactive'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          floor_id?: string
          name?: string
          room_number?: string
          status?: 'active' | 'inactive'
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rooms_floor_id_fkey"
            columns: ["floor_id"]
            isOneToOne: false
            referencedRelation: "floors"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      problematic_doors: {
        Row: {
          id: string
          name: string
          room_number: string
          room_name: string
          floor_name: string
          building_name: string
          status: string
          hardware_status: {
            lock: boolean
            hinges: boolean
            doorknob: boolean
            frame: boolean
            wind_pressure: boolean
          }
          created_at: string
          updated_at: string
        }
      }
    }
    Functions: {
      update_updated_at_column: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
