export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      access_delegation: {
        Row: {
          access_type: string
          created_at: string | null
          delegate_id: string | null
          delegator_id: string | null
          id: string
          updated_at: string | null
          valid_from: string
          valid_until: string | null
        }
        Insert: {
          access_type: string
          created_at?: string | null
          delegate_id?: string | null
          delegator_id?: string | null
          id?: string
          updated_at?: string | null
          valid_from?: string
          valid_until?: string | null
        }
        Update: {
          access_type?: string
          created_at?: string | null
          delegate_id?: string | null
          delegator_id?: string | null
          id?: string
          updated_at?: string | null
          valid_from?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "access_delegation_delegate_id_fkey"
            columns: ["delegate_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_delegation_delegate_id_fkey"
            columns: ["delegate_id"]
            isOneToOne: false
            referencedRelation: "user_verification_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_delegation_delegate_id_fkey"
            columns: ["delegate_id"]
            isOneToOne: false
            referencedRelation: "user_verification_view"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "access_delegation_delegator_id_fkey"
            columns: ["delegator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_delegation_delegator_id_fkey"
            columns: ["delegator_id"]
            isOneToOne: false
            referencedRelation: "user_verification_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_delegation_delegator_id_fkey"
            columns: ["delegator_id"]
            isOneToOne: false
            referencedRelation: "user_verification_view"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      agency_affiliations: {
        Row: {
          created_at: string | null
          id: string
          name: string
          type: Database["public"]["Enums"]["agency_type"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          type: Database["public"]["Enums"]["agency_type"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          type?: Database["public"]["Enums"]["agency_type"]
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_history: {
        Row: {
          completed_at: string | null
          error_message: string | null
          id: string
          metadata: Json | null
          size_bytes: number | null
          started_at: string | null
          status: string
          type: string
        }
        Insert: {
          completed_at?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          size_bytes?: number | null
          started_at?: string | null
          status: string
          type: string
        }
        Update: {
          completed_at?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          size_bytes?: number | null
          started_at?: string | null
          status?: string
          type?: string
        }
        Relationships: []
      }
      backup_restorations: {
        Row: {
          backup_version_id: string | null
          completed_at: string | null
          error_message: string | null
          id: string
          metadata: Json | null
          restored_by: string | null
          restored_tables: string[] | null
          started_at: string | null
          status: string
        }
        Insert: {
          backup_version_id?: string | null
          completed_at?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          restored_by?: string | null
          restored_tables?: string[] | null
          started_at?: string | null
          status?: string
        }
        Update: {
          backup_version_id?: string | null
          completed_at?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          restored_by?: string | null
          restored_tables?: string[] | null
          started_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "backup_restorations_backup_version_id_fkey"
            columns: ["backup_version_id"]
            isOneToOne: false
            referencedRelation: "backup_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      backup_retention_policies: {
        Row: {
          compress_backups: boolean | null
          created_at: string | null
          created_by: string | null
          description: string | null
          encrypt_backups: boolean | null
          id: string
          is_active: boolean | null
          max_backups: number
          retention_days: number
          updated_at: string | null
        }
        Insert: {
          compress_backups?: boolean | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          encrypt_backups?: boolean | null
          id?: string
          is_active?: boolean | null
          max_backups?: number
          retention_days?: number
          updated_at?: string | null
        }
        Update: {
          compress_backups?: boolean | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          encrypt_backups?: boolean | null
          id?: string
          is_active?: boolean | null
          max_backups?: number
          retention_days?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_versions: {
        Row: {
          compressed: boolean | null
          compression_ratio: number | null
          created_at: string | null
          created_by: string | null
          description: string | null
          encrypted: boolean | null
          id: string
          metadata: Json | null
          name: string
          retention_policy_id: string | null
          size_bytes: number | null
          status: string | null
          tables: string[]
        }
        Insert: {
          compressed?: boolean | null
          compression_ratio?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          encrypted?: boolean | null
          id?: string
          metadata?: Json | null
          name: string
          retention_policy_id?: string | null
          size_bytes?: number | null
          status?: string | null
          tables: string[]
        }
        Update: {
          compressed?: boolean | null
          compression_ratio?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          encrypted?: boolean | null
          id?: string
          metadata?: Json | null
          name?: string
          retention_policy_id?: string | null
          size_bytes?: number | null
          status?: string | null
          tables?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "backup_versions_retention_policy_id_fkey"
            columns: ["retention_policy_id"]
            isOneToOne: false
            referencedRelation: "backup_retention_policies"
            referencedColumns: ["id"]
          },
        ]
      }
      building_activities: {
        Row: {
          building_id: string | null
          created_at: string | null
          description: string
          id: string
          performed_by: string | null
          type: string
        }
        Insert: {
          building_id?: string | null
          created_at?: string | null
          description: string
          id?: string
          performed_by?: string | null
          type: string
        }
        Update: {
          building_id?: string | null
          created_at?: string | null
          description?: string
          id?: string
          performed_by?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "building_activities_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "building_activities_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "key_door_locations"
            referencedColumns: ["building_id"]
          },
          {
            foreignKeyName: "building_activities_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "lighting_assignments"
            referencedColumns: ["building_id"]
          },
        ]
      }
      building_floors: {
        Row: {
          building_id: string
          created_at: string | null
          floor_number: number
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          building_id: string
          created_at?: string | null
          floor_number: number
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          building_id?: string
          created_at?: string | null
          floor_number?: number
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "building_floors_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "building_floors_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "key_door_locations"
            referencedColumns: ["building_id"]
          },
          {
            foreignKeyName: "building_floors_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "lighting_assignments"
            referencedColumns: ["building_id"]
          },
        ]
      }
      buildings: {
        Row: {
          address: string
          created_at: string | null
          id: string
          name: string
          status: Database["public"]["Enums"]["status_enum"] | null
          updated_at: string | null
        }
        Insert: {
          address: string
          created_at?: string | null
          id?: string
          name: string
          status?: Database["public"]["Enums"]["status_enum"] | null
          updated_at?: string | null
        }
        Update: {
          address?: string
          created_at?: string | null
          id?: string
          name?: string
          status?: Database["public"]["Enums"]["status_enum"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      court_assignments: {
        Row: {
          calendar_day: string | null
          clerks: string[] | null
          created_at: string | null
          fax: string | null
          id: string
          justice: string
          part: string
          part_details: Json | null
          room_id: string | null
          room_number: string
          sergeant: string | null
          tel: string | null
          term_id: string | null
          updated_at: string | null
        }
        Insert: {
          calendar_day?: string | null
          clerks?: string[] | null
          created_at?: string | null
          fax?: string | null
          id?: string
          justice: string
          part: string
          part_details?: Json | null
          room_id?: string | null
          room_number: string
          sergeant?: string | null
          tel?: string | null
          term_id?: string | null
          updated_at?: string | null
        }
        Update: {
          calendar_day?: string | null
          clerks?: string[] | null
          created_at?: string | null
          fax?: string | null
          id?: string
          justice?: string
          part?: string
          part_details?: Json | null
          room_id?: string | null
          room_number?: string
          sergeant?: string | null
          tel?: string | null
          term_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "court_assignments_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_health_overview"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "court_assignments_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_hierarchy_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "court_assignments_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_issue_analytics"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "court_assignments_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_occupancy_stats"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "court_assignments_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_selection_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "court_assignments_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "court_assignments_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "court_terms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "court_assignments_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "term_details"
            referencedColumns: ["id"]
          },
        ]
      }
      court_parts: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          part_code: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          part_code: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          part_code?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      court_rooms: {
        Row: {
          courtroom_number: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          notes: string | null
          room_id: string
          room_number: string
          updated_at: string | null
        }
        Insert: {
          courtroom_number?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          room_id: string
          room_number: string
          updated_at?: string | null
        }
        Update: {
          courtroom_number?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          room_id?: string
          room_number?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "court_rooms_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_health_overview"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "court_rooms_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_hierarchy_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "court_rooms_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_issue_analytics"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "court_rooms_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_occupancy_stats"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "court_rooms_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_selection_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "court_rooms_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      court_terms: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          end_date: string
          id: string
          location: string
          metadata: Json | null
          pdf_url: string | null
          start_date: string
          status: string | null
          term_name: string
          term_number: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date: string
          id?: string
          location: string
          metadata?: Json | null
          pdf_url?: string | null
          start_date: string
          status?: string | null
          term_name: string
          term_number: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string
          id?: string
          location?: string
          metadata?: Json | null
          pdf_url?: string | null
          start_date?: string
          status?: string | null
          term_name?: string
          term_number?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      department_access: {
        Row: {
          access_level: Database["public"]["Enums"]["access_level_enum"]
          created_at: string | null
          department: string
          id: string
          profile_id: string | null
          updated_at: string | null
        }
        Insert: {
          access_level?: Database["public"]["Enums"]["access_level_enum"]
          created_at?: string | null
          department: string
          id?: string
          profile_id?: string | null
          updated_at?: string | null
        }
        Update: {
          access_level?: Database["public"]["Enums"]["access_level_enum"]
          created_at?: string | null
          department?: string
          id?: string
          profile_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "department_access_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "department_access_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "user_verification_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "department_access_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "user_verification_view"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      departments: {
        Row: {
          access_level: Database["public"]["Enums"]["access_level_enum"] | null
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          access_level?: Database["public"]["Enums"]["access_level_enum"] | null
          created_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          access_level?: Database["public"]["Enums"]["access_level_enum"] | null
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      door_issues: {
        Row: {
          description: string | null
          door_id: string | null
          id: string
          issue_type: string
          maintenance_notes: string | null
          reported_at: string | null
          resolved_at: string | null
          status: string
        }
        Insert: {
          description?: string | null
          door_id?: string | null
          id?: string
          issue_type: string
          maintenance_notes?: string | null
          reported_at?: string | null
          resolved_at?: string | null
          status: string
        }
        Update: {
          description?: string | null
          door_id?: string | null
          id?: string
          issue_type?: string
          maintenance_notes?: string | null
          reported_at?: string | null
          resolved_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "door_issues_door_id_fkey"
            columns: ["door_id"]
            isOneToOne: false
            referencedRelation: "doors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "door_issues_door_id_fkey"
            columns: ["door_id"]
            isOneToOne: false
            referencedRelation: "key_door_locations"
            referencedColumns: ["door_id"]
          },
        ]
      }
      door_maintenance_log: {
        Row: {
          door_id: string | null
          id: string
          maintenance_date: string | null
          notes: string | null
          result: string
          work_performed: string
        }
        Insert: {
          door_id?: string | null
          id?: string
          maintenance_date?: string | null
          notes?: string | null
          result: string
          work_performed: string
        }
        Update: {
          door_id?: string | null
          id?: string
          maintenance_date?: string | null
          notes?: string | null
          result?: string
          work_performed?: string
        }
        Relationships: [
          {
            foreignKeyName: "door_maintenance_log_door_id_fkey"
            columns: ["door_id"]
            isOneToOne: false
            referencedRelation: "doors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "door_maintenance_log_door_id_fkey"
            columns: ["door_id"]
            isOneToOne: false
            referencedRelation: "key_door_locations"
            referencedColumns: ["door_id"]
          },
        ]
      }
      door_properties: {
        Row: {
          closer_status:
            | Database["public"]["Enums"]["door_closer_status_enum"]
            | null
          hardware_status: Json | null
          next_maintenance_date: string | null
          passkey_enabled: boolean | null
          security_config: Json | null
          security_level: string | null
          space_id: string
          wind_pressure_issues: boolean | null
        }
        Insert: {
          closer_status?:
            | Database["public"]["Enums"]["door_closer_status_enum"]
            | null
          hardware_status?: Json | null
          next_maintenance_date?: string | null
          passkey_enabled?: boolean | null
          security_config?: Json | null
          security_level?: string | null
          space_id: string
          wind_pressure_issues?: boolean | null
        }
        Update: {
          closer_status?:
            | Database["public"]["Enums"]["door_closer_status_enum"]
            | null
          hardware_status?: Json | null
          next_maintenance_date?: string | null
          passkey_enabled?: boolean | null
          security_config?: Json | null
          security_level?: string | null
          space_id?: string
          wind_pressure_issues?: boolean | null
        }
        Relationships: []
      }
      doors: {
        Row: {
          closer_status:
            | Database["public"]["Enums"]["door_closer_status_enum"]
            | null
          component_issues: Json | null
          created_at: string | null
          floor_id: string
          hardware_status: Json | null
          has_closing_issue: boolean | null
          has_handle_issue: boolean | null
          id: string
          is_transition_door: boolean | null
          issue_notes: string | null
          last_hardware_check: string | null
          last_maintenance_date: string | null
          maintenance_history: Json[] | null
          maintenance_schedule: Json[] | null
          name: string
          next_maintenance_date: string | null
          passkey_enabled: boolean | null
          position: Json | null
          security_level: string | null
          size: Json | null
          status: Database["public"]["Enums"]["status_enum"]
          status_history: Json[] | null
          type: Database["public"]["Enums"]["door_type_enum"]
          updated_at: string | null
        }
        Insert: {
          closer_status?:
            | Database["public"]["Enums"]["door_closer_status_enum"]
            | null
          component_issues?: Json | null
          created_at?: string | null
          floor_id: string
          hardware_status?: Json | null
          has_closing_issue?: boolean | null
          has_handle_issue?: boolean | null
          id?: string
          is_transition_door?: boolean | null
          issue_notes?: string | null
          last_hardware_check?: string | null
          last_maintenance_date?: string | null
          maintenance_history?: Json[] | null
          maintenance_schedule?: Json[] | null
          name: string
          next_maintenance_date?: string | null
          passkey_enabled?: boolean | null
          position?: Json | null
          security_level?: string | null
          size?: Json | null
          status?: Database["public"]["Enums"]["status_enum"]
          status_history?: Json[] | null
          type: Database["public"]["Enums"]["door_type_enum"]
          updated_at?: string | null
        }
        Update: {
          closer_status?:
            | Database["public"]["Enums"]["door_closer_status_enum"]
            | null
          component_issues?: Json | null
          created_at?: string | null
          floor_id?: string
          hardware_status?: Json | null
          has_closing_issue?: boolean | null
          has_handle_issue?: boolean | null
          id?: string
          is_transition_door?: boolean | null
          issue_notes?: string | null
          last_hardware_check?: string | null
          last_maintenance_date?: string | null
          maintenance_history?: Json[] | null
          maintenance_schedule?: Json[] | null
          name?: string
          next_maintenance_date?: string | null
          passkey_enabled?: boolean | null
          position?: Json | null
          security_level?: string | null
          size?: Json | null
          status?: Database["public"]["Enums"]["status_enum"]
          status_history?: Json[] | null
          type?: Database["public"]["Enums"]["door_type_enum"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "doors_floor_id_fkey"
            columns: ["floor_id"]
            isOneToOne: false
            referencedRelation: "floorplan_report_data"
            referencedColumns: ["floor_id"]
          },
          {
            foreignKeyName: "doors_floor_id_fkey"
            columns: ["floor_id"]
            isOneToOne: false
            referencedRelation: "floors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doors_floor_id_fkey"
            columns: ["floor_id"]
            isOneToOne: false
            referencedRelation: "key_door_locations"
            referencedColumns: ["floor_id"]
          },
        ]
      }
      emergency_lighting_routes: {
        Row: {
          created_at: string | null
          fixture_sequence: string[] | null
          floor_id: string
          id: string
          name: string
          route_type: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          fixture_sequence?: string[] | null
          floor_id: string
          id?: string
          name: string
          route_type: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          fixture_sequence?: string[] | null
          floor_id?: string
          id?: string
          name?: string
          route_type?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "emergency_lighting_routes_floor_id_fkey"
            columns: ["floor_id"]
            isOneToOne: false
            referencedRelation: "floorplan_report_data"
            referencedColumns: ["floor_id"]
          },
          {
            foreignKeyName: "emergency_lighting_routes_floor_id_fkey"
            columns: ["floor_id"]
            isOneToOne: false
            referencedRelation: "floors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emergency_lighting_routes_floor_id_fkey"
            columns: ["floor_id"]
            isOneToOne: false
            referencedRelation: "key_door_locations"
            referencedColumns: ["floor_id"]
          },
        ]
      }
      fixture_names: {
        Row: {
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      floor_layouts: {
        Row: {
          created_at: string | null
          floor_id: string
          grid_size: number | null
          id: string
          name: string
          scale_factor: number | null
          updated_at: string | null
          viewport_state: Json | null
        }
        Insert: {
          created_at?: string | null
          floor_id: string
          grid_size?: number | null
          id?: string
          name: string
          scale_factor?: number | null
          updated_at?: string | null
          viewport_state?: Json | null
        }
        Update: {
          created_at?: string | null
          floor_id?: string
          grid_size?: number | null
          id?: string
          name?: string
          scale_factor?: number | null
          updated_at?: string | null
          viewport_state?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "floor_layouts_floor_id_fkey"
            columns: ["floor_id"]
            isOneToOne: false
            referencedRelation: "floorplan_report_data"
            referencedColumns: ["floor_id"]
          },
          {
            foreignKeyName: "floor_layouts_floor_id_fkey"
            columns: ["floor_id"]
            isOneToOne: false
            referencedRelation: "floors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "floor_layouts_floor_id_fkey"
            columns: ["floor_id"]
            isOneToOne: false
            referencedRelation: "key_door_locations"
            referencedColumns: ["floor_id"]
          },
        ]
      }
      floor_plan_objects: {
        Row: {
          connection_data: Json | null
          created_at: string | null
          data: Json | null
          floor_id: string
          id: string
          label: string | null
          position: Json | null
          properties: Json | null
          rotation: number | null
          size: Json | null
          style: Json | null
          type: Database["public"]["Enums"]["floor_plan_object_type"]
          updated_at: string | null
          z_index: number | null
        }
        Insert: {
          connection_data?: Json | null
          created_at?: string | null
          data?: Json | null
          floor_id: string
          id?: string
          label?: string | null
          position?: Json | null
          properties?: Json | null
          rotation?: number | null
          size?: Json | null
          style?: Json | null
          type: Database["public"]["Enums"]["floor_plan_object_type"]
          updated_at?: string | null
          z_index?: number | null
        }
        Update: {
          connection_data?: Json | null
          created_at?: string | null
          data?: Json | null
          floor_id?: string
          id?: string
          label?: string | null
          position?: Json | null
          properties?: Json | null
          rotation?: number | null
          size?: Json | null
          style?: Json | null
          type?: Database["public"]["Enums"]["floor_plan_object_type"]
          updated_at?: string | null
          z_index?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "floor_plan_objects_floor_id_fkey"
            columns: ["floor_id"]
            isOneToOne: false
            referencedRelation: "floorplan_report_data"
            referencedColumns: ["floor_id"]
          },
          {
            foreignKeyName: "floor_plan_objects_floor_id_fkey"
            columns: ["floor_id"]
            isOneToOne: false
            referencedRelation: "floors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "floor_plan_objects_floor_id_fkey"
            columns: ["floor_id"]
            isOneToOne: false
            referencedRelation: "key_door_locations"
            referencedColumns: ["floor_id"]
          },
        ]
      }
      floorplan_annotations: {
        Row: {
          content: string | null
          created_at: string | null
          floorplan_id: string | null
          id: string
          position: Json
          style: Json | null
          type: string
          updated_at: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          floorplan_id?: string | null
          id?: string
          position: Json
          style?: Json | null
          type: string
          updated_at?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          floorplan_id?: string | null
          id?: string
          position?: Json
          style?: Json | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "floorplan_annotations_floorplan_id_fkey"
            columns: ["floorplan_id"]
            isOneToOne: false
            referencedRelation: "floorplans"
            referencedColumns: ["id"]
          },
        ]
      }
      floorplan_layers: {
        Row: {
          created_at: string | null
          data: Json | null
          floor_id: string
          id: string
          name: string
          order_index: number
          type: Database["public"]["Enums"]["layer_type_enum"]
          updated_at: string | null
          visible: boolean | null
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          floor_id: string
          id?: string
          name: string
          order_index: number
          type: Database["public"]["Enums"]["layer_type_enum"]
          updated_at?: string | null
          visible?: boolean | null
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          floor_id?: string
          id?: string
          name?: string
          order_index?: number
          type?: Database["public"]["Enums"]["layer_type_enum"]
          updated_at?: string | null
          visible?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "floorplan_layers_floor_id_fkey"
            columns: ["floor_id"]
            isOneToOne: false
            referencedRelation: "floorplan_report_data"
            referencedColumns: ["floor_id"]
          },
          {
            foreignKeyName: "floorplan_layers_floor_id_fkey"
            columns: ["floor_id"]
            isOneToOne: false
            referencedRelation: "floors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "floorplan_layers_floor_id_fkey"
            columns: ["floor_id"]
            isOneToOne: false
            referencedRelation: "key_door_locations"
            referencedColumns: ["floor_id"]
          },
        ]
      }
      floorplan_objects: {
        Row: {
          created_at: string | null
          floor_id: string
          height: number
          id: string
          metadata: Json | null
          object_id: string
          object_type: string
          position: Json | null
          position_x: number
          position_y: number
          rotation: number | null
          scale_x: number | null
          scale_y: number | null
          updated_at: string | null
          width: number
        }
        Insert: {
          created_at?: string | null
          floor_id: string
          height: number
          id?: string
          metadata?: Json | null
          object_id: string
          object_type: string
          position?: Json | null
          position_x: number
          position_y: number
          rotation?: number | null
          scale_x?: number | null
          scale_y?: number | null
          updated_at?: string | null
          width: number
        }
        Update: {
          created_at?: string | null
          floor_id?: string
          height?: number
          id?: string
          metadata?: Json | null
          object_id?: string
          object_type?: string
          position?: Json | null
          position_x?: number
          position_y?: number
          rotation?: number | null
          scale_x?: number | null
          scale_y?: number | null
          updated_at?: string | null
          width?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_floorplan_objects_rooms"
            columns: ["object_id"]
            isOneToOne: false
            referencedRelation: "room_health_overview"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "fk_floorplan_objects_rooms"
            columns: ["object_id"]
            isOneToOne: false
            referencedRelation: "room_hierarchy_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_floorplan_objects_rooms"
            columns: ["object_id"]
            isOneToOne: false
            referencedRelation: "room_issue_analytics"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "fk_floorplan_objects_rooms"
            columns: ["object_id"]
            isOneToOne: false
            referencedRelation: "room_occupancy_stats"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "fk_floorplan_objects_rooms"
            columns: ["object_id"]
            isOneToOne: false
            referencedRelation: "room_selection_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_floorplan_objects_rooms"
            columns: ["object_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "floorplan_objects_floor_id_fkey"
            columns: ["floor_id"]
            isOneToOne: false
            referencedRelation: "floorplan_report_data"
            referencedColumns: ["floor_id"]
          },
          {
            foreignKeyName: "floorplan_objects_floor_id_fkey"
            columns: ["floor_id"]
            isOneToOne: false
            referencedRelation: "floors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "floorplan_objects_floor_id_fkey"
            columns: ["floor_id"]
            isOneToOne: false
            referencedRelation: "key_door_locations"
            referencedColumns: ["floor_id"]
          },
        ]
      }
      floorplans: {
        Row: {
          background_image: string | null
          canvas_data: Json | null
          connections: Json | null
          created_at: string | null
          floor_id: string | null
          grid_size: number | null
          id: string
          last_modified_by: string | null
          model_data: Json
          scale_factor: number | null
          three_js_data: Json | null
          updated_at: string | null
          viewport_state: Json | null
        }
        Insert: {
          background_image?: string | null
          canvas_data?: Json | null
          connections?: Json | null
          created_at?: string | null
          floor_id?: string | null
          grid_size?: number | null
          id?: string
          last_modified_by?: string | null
          model_data?: Json
          scale_factor?: number | null
          three_js_data?: Json | null
          updated_at?: string | null
          viewport_state?: Json | null
        }
        Update: {
          background_image?: string | null
          canvas_data?: Json | null
          connections?: Json | null
          created_at?: string | null
          floor_id?: string | null
          grid_size?: number | null
          id?: string
          last_modified_by?: string | null
          model_data?: Json
          scale_factor?: number | null
          three_js_data?: Json | null
          updated_at?: string | null
          viewport_state?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "floorplans_floor_id_fkey"
            columns: ["floor_id"]
            isOneToOne: false
            referencedRelation: "floorplan_report_data"
            referencedColumns: ["floor_id"]
          },
          {
            foreignKeyName: "floorplans_floor_id_fkey"
            columns: ["floor_id"]
            isOneToOne: false
            referencedRelation: "floors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "floorplans_floor_id_fkey"
            columns: ["floor_id"]
            isOneToOne: false
            referencedRelation: "key_door_locations"
            referencedColumns: ["floor_id"]
          },
        ]
      }
      floors: {
        Row: {
          building_id: string
          created_at: string | null
          floor_number: number
          id: string
          name: string
          status: Database["public"]["Enums"]["status_enum"] | null
          updated_at: string | null
        }
        Insert: {
          building_id: string
          created_at?: string | null
          floor_number: number
          id?: string
          name: string
          status?: Database["public"]["Enums"]["status_enum"] | null
          updated_at?: string | null
        }
        Update: {
          building_id?: string
          created_at?: string | null
          floor_number?: number
          id?: string
          name?: string
          status?: Database["public"]["Enums"]["status_enum"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "floors_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "floors_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "key_door_locations"
            referencedColumns: ["building_id"]
          },
          {
            foreignKeyName: "floors_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "lighting_assignments"
            referencedColumns: ["building_id"]
          },
        ]
      }
      hallway_analytics: {
        Row: {
          busy_periods: Json | null
          created_at: string | null
          date: string | null
          hallway_id: string | null
          id: string
          notes: string | null
          peak_hours: Json | null
          total_traffic: number | null
          updated_at: string | null
        }
        Insert: {
          busy_periods?: Json | null
          created_at?: string | null
          date?: string | null
          hallway_id?: string | null
          id?: string
          notes?: string | null
          peak_hours?: Json | null
          total_traffic?: number | null
          updated_at?: string | null
        }
        Update: {
          busy_periods?: Json | null
          created_at?: string | null
          date?: string | null
          hallway_id?: string | null
          id?: string
          notes?: string | null
          peak_hours?: Json | null
          total_traffic?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hallway_analytics_hallway_id_fkey"
            columns: ["hallway_id"]
            isOneToOne: false
            referencedRelation: "hallways"
            referencedColumns: ["id"]
          },
        ]
      }
      hallway_maintenance_logs: {
        Row: {
          attachments: Json | null
          cost: number | null
          created_at: string | null
          description: string | null
          hallway_id: string | null
          id: string
          maintenance_date: string | null
          maintenance_type: string
          next_scheduled_date: string | null
          performed_by: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          attachments?: Json | null
          cost?: number | null
          created_at?: string | null
          description?: string | null
          hallway_id?: string | null
          id?: string
          maintenance_date?: string | null
          maintenance_type: string
          next_scheduled_date?: string | null
          performed_by?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          attachments?: Json | null
          cost?: number | null
          created_at?: string | null
          description?: string | null
          hallway_id?: string | null
          id?: string
          maintenance_date?: string | null
          maintenance_type?: string
          next_scheduled_date?: string | null
          performed_by?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hallway_maintenance_logs_hallway_id_fkey"
            columns: ["hallway_id"]
            isOneToOne: false
            referencedRelation: "hallways"
            referencedColumns: ["id"]
          },
        ]
      }
      hallway_properties: {
        Row: {
          accessibility:
            | Database["public"]["Enums"]["hallway_accessibility_enum"]
            | null
          capacity_limit: number | null
          emergency_exits: Json | null
          emergency_route:
            | Database["public"]["Enums"]["emergency_route_enum"]
            | null
          maintenance_priority: string | null
          section: string | null
          space_id: string
          traffic_flow:
            | Database["public"]["Enums"]["hallway_traffic_flow_enum"]
            | null
        }
        Insert: {
          accessibility?:
            | Database["public"]["Enums"]["hallway_accessibility_enum"]
            | null
          capacity_limit?: number | null
          emergency_exits?: Json | null
          emergency_route?:
            | Database["public"]["Enums"]["emergency_route_enum"]
            | null
          maintenance_priority?: string | null
          section?: string | null
          space_id: string
          traffic_flow?:
            | Database["public"]["Enums"]["hallway_traffic_flow_enum"]
            | null
        }
        Update: {
          accessibility?:
            | Database["public"]["Enums"]["hallway_accessibility_enum"]
            | null
          capacity_limit?: number | null
          emergency_exits?: Json | null
          emergency_route?:
            | Database["public"]["Enums"]["emergency_route_enum"]
            | null
          maintenance_priority?: string | null
          section?: string | null
          space_id?: string
          traffic_flow?:
            | Database["public"]["Enums"]["hallway_traffic_flow_enum"]
            | null
        }
        Relationships: []
      }
      hallways: {
        Row: {
          accessibility:
            | Database["public"]["Enums"]["hallway_accessibility_enum"]
            | null
          capacity_limit: number | null
          created_at: string | null
          description: string | null
          emergency_exits: Json | null
          emergency_route:
            | Database["public"]["Enums"]["emergency_route_enum"]
            | null
          floor_id: string
          id: string
          inspected_by: string | null
          inspection_history: Json[] | null
          last_inspection_date: string | null
          last_inspection_notes: string | null
          last_maintenance_date: string | null
          length_meters: number | null
          maintenance_history: Json[] | null
          maintenance_notes: string | null
          maintenance_priority: string | null
          maintenance_schedule: Json | null
          maintenance_status: string | null
          name: string
          next_inspection_date: string | null
          next_maintenance_date: string | null
          notes: string | null
          position: Json | null
          properties: Json | null
          rotation: number | null
          section: Database["public"]["Enums"]["hallway_section_enum"] | null
          security_level: string | null
          size: Json | null
          status: Database["public"]["Enums"]["status_enum"] | null
          traffic_flow:
            | Database["public"]["Enums"]["hallway_traffic_flow_enum"]
            | null
          type: Database["public"]["Enums"]["hallway_type_enum"]
          updated_at: string | null
          usage_statistics: Json | null
          width_meters: number | null
        }
        Insert: {
          accessibility?:
            | Database["public"]["Enums"]["hallway_accessibility_enum"]
            | null
          capacity_limit?: number | null
          created_at?: string | null
          description?: string | null
          emergency_exits?: Json | null
          emergency_route?:
            | Database["public"]["Enums"]["emergency_route_enum"]
            | null
          floor_id: string
          id?: string
          inspected_by?: string | null
          inspection_history?: Json[] | null
          last_inspection_date?: string | null
          last_inspection_notes?: string | null
          last_maintenance_date?: string | null
          length_meters?: number | null
          maintenance_history?: Json[] | null
          maintenance_notes?: string | null
          maintenance_priority?: string | null
          maintenance_schedule?: Json | null
          maintenance_status?: string | null
          name: string
          next_inspection_date?: string | null
          next_maintenance_date?: string | null
          notes?: string | null
          position?: Json | null
          properties?: Json | null
          rotation?: number | null
          section?: Database["public"]["Enums"]["hallway_section_enum"] | null
          security_level?: string | null
          size?: Json | null
          status?: Database["public"]["Enums"]["status_enum"] | null
          traffic_flow?:
            | Database["public"]["Enums"]["hallway_traffic_flow_enum"]
            | null
          type: Database["public"]["Enums"]["hallway_type_enum"]
          updated_at?: string | null
          usage_statistics?: Json | null
          width_meters?: number | null
        }
        Update: {
          accessibility?:
            | Database["public"]["Enums"]["hallway_accessibility_enum"]
            | null
          capacity_limit?: number | null
          created_at?: string | null
          description?: string | null
          emergency_exits?: Json | null
          emergency_route?:
            | Database["public"]["Enums"]["emergency_route_enum"]
            | null
          floor_id?: string
          id?: string
          inspected_by?: string | null
          inspection_history?: Json[] | null
          last_inspection_date?: string | null
          last_inspection_notes?: string | null
          last_maintenance_date?: string | null
          length_meters?: number | null
          maintenance_history?: Json[] | null
          maintenance_notes?: string | null
          maintenance_priority?: string | null
          maintenance_schedule?: Json | null
          maintenance_status?: string | null
          name?: string
          next_inspection_date?: string | null
          next_maintenance_date?: string | null
          notes?: string | null
          position?: Json | null
          properties?: Json | null
          rotation?: number | null
          section?: Database["public"]["Enums"]["hallway_section_enum"] | null
          security_level?: string | null
          size?: Json | null
          status?: Database["public"]["Enums"]["status_enum"] | null
          traffic_flow?:
            | Database["public"]["Enums"]["hallway_traffic_flow_enum"]
            | null
          type?: Database["public"]["Enums"]["hallway_type_enum"]
          updated_at?: string | null
          usage_statistics?: Json | null
          width_meters?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "hallways_floor_id_fkey"
            columns: ["floor_id"]
            isOneToOne: false
            referencedRelation: "floorplan_report_data"
            referencedColumns: ["floor_id"]
          },
          {
            foreignKeyName: "hallways_floor_id_fkey"
            columns: ["floor_id"]
            isOneToOne: false
            referencedRelation: "floors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hallways_floor_id_fkey"
            columns: ["floor_id"]
            isOneToOne: false
            referencedRelation: "key_door_locations"
            referencedColumns: ["floor_id"]
          },
          {
            foreignKeyName: "hallways_inspected_by_fkey"
            columns: ["inspected_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hallways_inspected_by_fkey"
            columns: ["inspected_by"]
            isOneToOne: false
            referencedRelation: "user_verification_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hallways_inspected_by_fkey"
            columns: ["inspected_by"]
            isOneToOne: false
            referencedRelation: "user_verification_view"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      import_history: {
        Row: {
          error_message: string | null
          file_name: string | null
          file_size: number | null
          id: string
          imported_at: string | null
          imported_by: string | null
          metadata: Json | null
          record_count: number | null
          status: string
          tables: string[] | null
        }
        Insert: {
          error_message?: string | null
          file_name?: string | null
          file_size?: number | null
          id?: string
          imported_at?: string | null
          imported_by?: string | null
          metadata?: Json | null
          record_count?: number | null
          status: string
          tables?: string[] | null
        }
        Update: {
          error_message?: string | null
          file_name?: string | null
          file_size?: number | null
          id?: string
          imported_at?: string | null
          imported_by?: string | null
          metadata?: Json | null
          record_count?: number | null
          status?: string
          tables?: string[] | null
        }
        Relationships: []
      }
      inventory_audits: {
        Row: {
          audit_date: string | null
          discrepancies: Json | null
          id: string
          notes: string | null
          performed_by: string | null
          status: string | null
          storage_room_id: string | null
        }
        Insert: {
          audit_date?: string | null
          discrepancies?: Json | null
          id?: string
          notes?: string | null
          performed_by?: string | null
          status?: string | null
          storage_room_id?: string | null
        }
        Update: {
          audit_date?: string | null
          discrepancies?: Json | null
          id?: string
          notes?: string | null
          performed_by?: string | null
          status?: string | null
          storage_room_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_audits_storage_room_id_fkey"
            columns: ["storage_room_id"]
            isOneToOne: false
            referencedRelation: "room_health_overview"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "inventory_audits_storage_room_id_fkey"
            columns: ["storage_room_id"]
            isOneToOne: false
            referencedRelation: "room_hierarchy_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_audits_storage_room_id_fkey"
            columns: ["storage_room_id"]
            isOneToOne: false
            referencedRelation: "room_issue_analytics"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "inventory_audits_storage_room_id_fkey"
            columns: ["storage_room_id"]
            isOneToOne: false
            referencedRelation: "room_occupancy_stats"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "inventory_audits_storage_room_id_fkey"
            columns: ["storage_room_id"]
            isOneToOne: false
            referencedRelation: "room_selection_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_audits_storage_room_id_fkey"
            columns: ["storage_room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_categories: {
        Row: {
          color: Database["public"]["Enums"]["category_color_enum"]
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
          parent_category_id: string | null
          updated_at: string | null
        }
        Insert: {
          color?: Database["public"]["Enums"]["category_color_enum"]
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          parent_category_id?: string | null
          updated_at?: string | null
        }
        Update: {
          color?: Database["public"]["Enums"]["category_color_enum"]
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          parent_category_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_categories_parent_category_id_fkey"
            columns: ["parent_category_id"]
            isOneToOne: false
            referencedRelation: "inventory_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_item_transactions: {
        Row: {
          created_at: string | null
          id: string
          item_id: string
          new_quantity: number
          notes: string | null
          performed_by: string | null
          previous_quantity: number
          quantity: number
          transaction_type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          item_id: string
          new_quantity: number
          notes?: string | null
          performed_by?: string | null
          previous_quantity: number
          quantity: number
          transaction_type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          item_id?: string
          new_quantity?: number
          notes?: string | null
          performed_by?: string | null
          previous_quantity?: number
          quantity?: number
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_item_transactions_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_item_transactions_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_item_transactions_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "low_stock_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_item_transactions_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "storage_room_inventory"
            referencedColumns: ["item_id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          category_id: string | null
          created_at: string | null
          description: string | null
          id: string
          last_inventory_date: string | null
          location_details: string | null
          minimum_quantity: number | null
          name: string
          notes: string | null
          photo_url: string | null
          preferred_vendor: string | null
          quantity: number
          reorder_point: number | null
          status: string | null
          storage_room_id: string | null
          unit: string | null
          updated_at: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          last_inventory_date?: string | null
          location_details?: string | null
          minimum_quantity?: number | null
          name: string
          notes?: string | null
          photo_url?: string | null
          preferred_vendor?: string | null
          quantity?: number
          reorder_point?: number | null
          status?: string | null
          storage_room_id?: string | null
          unit?: string | null
          updated_at?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          last_inventory_date?: string | null
          location_details?: string | null
          minimum_quantity?: number | null
          name?: string
          notes?: string | null
          photo_url?: string | null
          preferred_vendor?: string | null
          quantity?: number
          reorder_point?: number | null
          status?: string | null
          storage_room_id?: string | null
          unit?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "inventory_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      issue_comments: {
        Row: {
          attachments: string[] | null
          author_id: string
          content: string
          created_at: string | null
          id: string
          issue_id: string | null
          mentions: string[] | null
          updated_at: string | null
        }
        Insert: {
          attachments?: string[] | null
          author_id: string
          content: string
          created_at?: string | null
          id?: string
          issue_id?: string | null
          mentions?: string[] | null
          updated_at?: string | null
        }
        Update: {
          attachments?: string[] | null
          author_id?: string
          content?: string
          created_at?: string | null
          id?: string
          issue_id?: string | null
          mentions?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      issue_history: {
        Row: {
          action_details: Json | null
          action_type: string
          id: string
          issue_id: string | null
          new_status: Database["public"]["Enums"]["issue_status_enum"] | null
          notes: string | null
          performed_at: string | null
          performed_by: string | null
          previous_status:
            | Database["public"]["Enums"]["issue_status_enum"]
            | null
        }
        Insert: {
          action_details?: Json | null
          action_type: string
          id?: string
          issue_id?: string | null
          new_status?: Database["public"]["Enums"]["issue_status_enum"] | null
          notes?: string | null
          performed_at?: string | null
          performed_by?: string | null
          previous_status?:
            | Database["public"]["Enums"]["issue_status_enum"]
            | null
        }
        Update: {
          action_details?: Json | null
          action_type?: string
          id?: string
          issue_id?: string | null
          new_status?: Database["public"]["Enums"]["issue_status_enum"] | null
          notes?: string | null
          performed_at?: string | null
          performed_by?: string | null
          previous_status?:
            | Database["public"]["Enums"]["issue_status_enum"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "issue_history_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issue_report_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issue_history_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
        ]
      }
      issue_priority_rules: {
        Row: {
          conditions: Json
          created_at: string | null
          id: string
          priority: string
          subcategory: string | null
          updated_at: string | null
        }
        Insert: {
          conditions: Json
          created_at?: string | null
          id?: string
          priority: string
          subcategory?: string | null
          updated_at?: string | null
        }
        Update: {
          conditions?: Json
          created_at?: string | null
          id?: string
          priority?: string
          subcategory?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      issue_routing_rules: {
        Row: {
          conditions: Json
          created_at: string | null
          id: string
          subcategory: string | null
          updated_at: string | null
        }
        Insert: {
          conditions: Json
          created_at?: string | null
          id?: string
          subcategory?: string | null
          updated_at?: string | null
        }
        Update: {
          conditions?: Json
          created_at?: string | null
          id?: string
          subcategory?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      issue_templates: {
        Row: {
          created_at: string | null
          description: string | null
          fields: Json
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          fields?: Json
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          fields?: Json
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      issue_type_templates: {
        Row: {
          created_at: string | null
          default_priority: string | null
          icon_name: string | null
          id: string
          max_photos: number | null
          min_photos: number | null
          optional_fields: Json | null
          photos_required: boolean | null
          required_fields: Json | null
          subcategory: string | null
          template_order: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          default_priority?: string | null
          icon_name?: string | null
          id?: string
          max_photos?: number | null
          min_photos?: number | null
          optional_fields?: Json | null
          photos_required?: boolean | null
          required_fields?: Json | null
          subcategory?: string | null
          template_order?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          default_priority?: string | null
          icon_name?: string | null
          id?: string
          max_photos?: number | null
          min_photos?: number | null
          optional_fields?: Json | null
          photos_required?: boolean | null
          required_fields?: Json | null
          subcategory?: string | null
          template_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      issues: {
        Row: {
          assignee_id: string | null
          building_id: string | null
          created_at: string | null
          created_by: string | null
          date_info: string | null
          description: string | null
          due_date: string | null
          fixture_id: string | null
          floor_id: string | null
          id: string
          impact_level: string | null
          last_status_change: string | null
          last_updated_by: string | null
          lighting_details: Json | null
          maintenance_requirements: Json | null
          photos: string[] | null
          priority: Database["public"]["Enums"]["issue_priority_enum"] | null
          recurring_pattern: Json | null
          resolution_date: string | null
          resolution_notes: string | null
          resolution_type:
            | Database["public"]["Enums"]["issue_resolution_type"]
            | null
          resolved_by: string | null
          room_id: string | null
          seen: boolean | null
          space_id: string | null
          status: Database["public"]["Enums"]["issue_status_enum"] | null
          tags: string[] | null
          title: string
          type: Database["public"]["Enums"]["standardized_issue_type"]
          updated_at: string | null
        }
        Insert: {
          assignee_id?: string | null
          building_id?: string | null
          created_at?: string | null
          created_by?: string | null
          date_info?: string | null
          description?: string | null
          due_date?: string | null
          fixture_id?: string | null
          floor_id?: string | null
          id?: string
          impact_level?: string | null
          last_status_change?: string | null
          last_updated_by?: string | null
          lighting_details?: Json | null
          maintenance_requirements?: Json | null
          photos?: string[] | null
          priority?: Database["public"]["Enums"]["issue_priority_enum"] | null
          recurring_pattern?: Json | null
          resolution_date?: string | null
          resolution_notes?: string | null
          resolution_type?:
            | Database["public"]["Enums"]["issue_resolution_type"]
            | null
          resolved_by?: string | null
          room_id?: string | null
          seen?: boolean | null
          space_id?: string | null
          status?: Database["public"]["Enums"]["issue_status_enum"] | null
          tags?: string[] | null
          title: string
          type?: Database["public"]["Enums"]["standardized_issue_type"]
          updated_at?: string | null
        }
        Update: {
          assignee_id?: string | null
          building_id?: string | null
          created_at?: string | null
          created_by?: string | null
          date_info?: string | null
          description?: string | null
          due_date?: string | null
          fixture_id?: string | null
          floor_id?: string | null
          id?: string
          impact_level?: string | null
          last_status_change?: string | null
          last_updated_by?: string | null
          lighting_details?: Json | null
          maintenance_requirements?: Json | null
          photos?: string[] | null
          priority?: Database["public"]["Enums"]["issue_priority_enum"] | null
          recurring_pattern?: Json | null
          resolution_date?: string | null
          resolution_notes?: string | null
          resolution_type?:
            | Database["public"]["Enums"]["issue_resolution_type"]
            | null
          resolved_by?: string | null
          room_id?: string | null
          seen?: boolean | null
          space_id?: string | null
          status?: Database["public"]["Enums"]["issue_status_enum"] | null
          tags?: string[] | null
          title?: string
          type?: Database["public"]["Enums"]["standardized_issue_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "issues_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issues_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "user_verification_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issues_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "user_verification_view"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "issues_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issues_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "key_door_locations"
            referencedColumns: ["building_id"]
          },
          {
            foreignKeyName: "issues_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "lighting_assignments"
            referencedColumns: ["building_id"]
          },
          {
            foreignKeyName: "issues_fixture_id_fkey"
            columns: ["fixture_id"]
            isOneToOne: false
            referencedRelation: "lighting_assignments"
            referencedColumns: ["fixture_id"]
          },
          {
            foreignKeyName: "issues_fixture_id_fkey"
            columns: ["fixture_id"]
            isOneToOne: false
            referencedRelation: "lighting_fixtures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issues_floor_id_fkey"
            columns: ["floor_id"]
            isOneToOne: false
            referencedRelation: "floorplan_report_data"
            referencedColumns: ["floor_id"]
          },
          {
            foreignKeyName: "issues_floor_id_fkey"
            columns: ["floor_id"]
            isOneToOne: false
            referencedRelation: "floors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issues_floor_id_fkey"
            columns: ["floor_id"]
            isOneToOne: false
            referencedRelation: "key_door_locations"
            referencedColumns: ["floor_id"]
          },
          {
            foreignKeyName: "issues_last_updated_by_fkey"
            columns: ["last_updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issues_last_updated_by_fkey"
            columns: ["last_updated_by"]
            isOneToOne: false
            referencedRelation: "user_verification_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issues_last_updated_by_fkey"
            columns: ["last_updated_by"]
            isOneToOne: false
            referencedRelation: "user_verification_view"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "issues_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_health_overview"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "issues_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_hierarchy_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issues_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_issue_analytics"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "issues_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_occupancy_stats"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "issues_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_selection_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issues_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      key_assignments: {
        Row: {
          assigned_at: string
          assignment_meta: Json | null
          created_at: string | null
          id: string
          is_spare: boolean | null
          key_id: string | null
          occupant_id: string | null
          return_reason: string | null
          returned_at: string | null
          spare_key_reason: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_at?: string
          assignment_meta?: Json | null
          created_at?: string | null
          id?: string
          is_spare?: boolean | null
          key_id?: string | null
          occupant_id?: string | null
          return_reason?: string | null
          returned_at?: string | null
          spare_key_reason?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_at?: string
          assignment_meta?: Json | null
          created_at?: string | null
          id?: string
          is_spare?: boolean | null
          key_id?: string | null
          occupant_id?: string | null
          return_reason?: string | null
          returned_at?: string | null
          spare_key_reason?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "key_assignments_key_id_fkey"
            columns: ["key_id"]
            isOneToOne: false
            referencedRelation: "key_assignment_stats"
            referencedColumns: ["key_id"]
          },
          {
            foreignKeyName: "key_assignments_key_id_fkey"
            columns: ["key_id"]
            isOneToOne: false
            referencedRelation: "key_assignments_view"
            referencedColumns: ["key_id"]
          },
          {
            foreignKeyName: "key_assignments_key_id_fkey"
            columns: ["key_id"]
            isOneToOne: false
            referencedRelation: "key_door_locations"
            referencedColumns: ["key_id"]
          },
          {
            foreignKeyName: "key_assignments_key_id_fkey"
            columns: ["key_id"]
            isOneToOne: false
            referencedRelation: "key_inventory_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "key_assignments_key_id_fkey"
            columns: ["key_id"]
            isOneToOne: false
            referencedRelation: "keys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "key_assignments_occupant_id_fkey"
            columns: ["occupant_id"]
            isOneToOne: false
            referencedRelation: "occupant_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "key_assignments_occupant_id_fkey"
            columns: ["occupant_id"]
            isOneToOne: false
            referencedRelation: "occupants"
            referencedColumns: ["id"]
          },
        ]
      }
      key_audit_logs: {
        Row: {
          action_type: string
          changes: Json
          created_at: string | null
          details: Json | null
          id: string
          key_id: string | null
          metadata: Json | null
          performed_by: string | null
        }
        Insert: {
          action_type: string
          changes?: Json
          created_at?: string | null
          details?: Json | null
          id?: string
          key_id?: string | null
          metadata?: Json | null
          performed_by?: string | null
        }
        Update: {
          action_type?: string
          changes?: Json
          created_at?: string | null
          details?: Json | null
          id?: string
          key_id?: string | null
          metadata?: Json | null
          performed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "key_audit_logs_key_id_fkey"
            columns: ["key_id"]
            isOneToOne: false
            referencedRelation: "key_assignment_stats"
            referencedColumns: ["key_id"]
          },
          {
            foreignKeyName: "key_audit_logs_key_id_fkey"
            columns: ["key_id"]
            isOneToOne: false
            referencedRelation: "key_assignments_view"
            referencedColumns: ["key_id"]
          },
          {
            foreignKeyName: "key_audit_logs_key_id_fkey"
            columns: ["key_id"]
            isOneToOne: false
            referencedRelation: "key_door_locations"
            referencedColumns: ["key_id"]
          },
          {
            foreignKeyName: "key_audit_logs_key_id_fkey"
            columns: ["key_id"]
            isOneToOne: false
            referencedRelation: "key_inventory_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "key_audit_logs_key_id_fkey"
            columns: ["key_id"]
            isOneToOne: false
            referencedRelation: "keys"
            referencedColumns: ["id"]
          },
        ]
      }
      key_door_locations_table: {
        Row: {
          created_at: string | null
          door_id: string
          id: string
          key_id: string
        }
        Insert: {
          created_at?: string | null
          door_id: string
          id?: string
          key_id: string
        }
        Update: {
          created_at?: string | null
          door_id?: string
          id?: string
          key_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "key_door_locations_table_door_id_fkey"
            columns: ["door_id"]
            isOneToOne: false
            referencedRelation: "doors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "key_door_locations_table_door_id_fkey"
            columns: ["door_id"]
            isOneToOne: false
            referencedRelation: "key_door_locations"
            referencedColumns: ["door_id"]
          },
          {
            foreignKeyName: "key_door_locations_table_key_id_fkey"
            columns: ["key_id"]
            isOneToOne: false
            referencedRelation: "key_assignment_stats"
            referencedColumns: ["key_id"]
          },
          {
            foreignKeyName: "key_door_locations_table_key_id_fkey"
            columns: ["key_id"]
            isOneToOne: false
            referencedRelation: "key_assignments_view"
            referencedColumns: ["key_id"]
          },
          {
            foreignKeyName: "key_door_locations_table_key_id_fkey"
            columns: ["key_id"]
            isOneToOne: false
            referencedRelation: "key_door_locations"
            referencedColumns: ["key_id"]
          },
          {
            foreignKeyName: "key_door_locations_table_key_id_fkey"
            columns: ["key_id"]
            isOneToOne: false
            referencedRelation: "key_inventory_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "key_door_locations_table_key_id_fkey"
            columns: ["key_id"]
            isOneToOne: false
            referencedRelation: "keys"
            referencedColumns: ["id"]
          },
        ]
      }
      key_management_roles: {
        Row: {
          can_assign: boolean | null
          can_create: boolean | null
          can_decommission: boolean | null
          created_at: string | null
          id: string
          profile_id: string | null
          updated_at: string | null
        }
        Insert: {
          can_assign?: boolean | null
          can_create?: boolean | null
          can_decommission?: boolean | null
          created_at?: string | null
          id?: string
          profile_id?: string | null
          updated_at?: string | null
        }
        Update: {
          can_assign?: boolean | null
          can_create?: boolean | null
          can_decommission?: boolean | null
          created_at?: string | null
          id?: string
          profile_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "key_management_roles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "key_management_roles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "user_verification_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "key_management_roles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "user_verification_view"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      key_order_items: {
        Row: {
          created_at: string | null
          id: string
          order_id: string
          quantity_ordered: number
          quantity_received: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          order_id: string
          quantity_ordered: number
          quantity_received?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          order_id?: string
          quantity_ordered?: number
          quantity_received?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "key_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "key_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "key_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "key_orders_view"
            referencedColumns: ["id"]
          },
        ]
      }
      key_orders: {
        Row: {
          created_at: string | null
          expected_delivery_date: string | null
          id: string
          key_id: string
          notes: string | null
          ordered_at: string | null
          quantity: number
          received_at: string | null
          recipient_id: string | null
          requestor_id: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          expected_delivery_date?: string | null
          id?: string
          key_id: string
          notes?: string | null
          ordered_at?: string | null
          quantity: number
          received_at?: string | null
          recipient_id?: string | null
          requestor_id?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          expected_delivery_date?: string | null
          id?: string
          key_id?: string
          notes?: string | null
          ordered_at?: string | null
          quantity?: number
          received_at?: string | null
          recipient_id?: string | null
          requestor_id?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "key_orders_key_id_fkey"
            columns: ["key_id"]
            isOneToOne: false
            referencedRelation: "key_assignment_stats"
            referencedColumns: ["key_id"]
          },
          {
            foreignKeyName: "key_orders_key_id_fkey"
            columns: ["key_id"]
            isOneToOne: false
            referencedRelation: "key_assignments_view"
            referencedColumns: ["key_id"]
          },
          {
            foreignKeyName: "key_orders_key_id_fkey"
            columns: ["key_id"]
            isOneToOne: false
            referencedRelation: "key_door_locations"
            referencedColumns: ["key_id"]
          },
          {
            foreignKeyName: "key_orders_key_id_fkey"
            columns: ["key_id"]
            isOneToOne: false
            referencedRelation: "key_inventory_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "key_orders_key_id_fkey"
            columns: ["key_id"]
            isOneToOne: false
            referencedRelation: "keys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "key_orders_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "occupant_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "key_orders_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "occupants"
            referencedColumns: ["id"]
          },
        ]
      }
      key_requests: {
        Row: {
          created_at: string | null
          id: string
          key_id: string | null
          reason: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          key_id?: string | null
          reason?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          key_id?: string | null
          reason?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "key_requests_key_id_fkey"
            columns: ["key_id"]
            isOneToOne: false
            referencedRelation: "key_assignment_stats"
            referencedColumns: ["key_id"]
          },
          {
            foreignKeyName: "key_requests_key_id_fkey"
            columns: ["key_id"]
            isOneToOne: false
            referencedRelation: "key_assignments_view"
            referencedColumns: ["key_id"]
          },
          {
            foreignKeyName: "key_requests_key_id_fkey"
            columns: ["key_id"]
            isOneToOne: false
            referencedRelation: "key_door_locations"
            referencedColumns: ["key_id"]
          },
          {
            foreignKeyName: "key_requests_key_id_fkey"
            columns: ["key_id"]
            isOneToOne: false
            referencedRelation: "key_inventory_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "key_requests_key_id_fkey"
            columns: ["key_id"]
            isOneToOne: false
            referencedRelation: "keys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "key_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "key_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_verification_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "key_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_verification_view"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      key_stock_transactions: {
        Row: {
          created_at: string | null
          id: string
          key_id: string | null
          notes: string | null
          order_id: string | null
          performed_by: string | null
          quantity: number
          reason: string | null
          transaction_type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          key_id?: string | null
          notes?: string | null
          order_id?: string | null
          performed_by?: string | null
          quantity: number
          reason?: string | null
          transaction_type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          key_id?: string | null
          notes?: string | null
          order_id?: string | null
          performed_by?: string | null
          quantity?: number
          reason?: string | null
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "key_stock_transactions_key_id_fkey"
            columns: ["key_id"]
            isOneToOne: false
            referencedRelation: "key_assignment_stats"
            referencedColumns: ["key_id"]
          },
          {
            foreignKeyName: "key_stock_transactions_key_id_fkey"
            columns: ["key_id"]
            isOneToOne: false
            referencedRelation: "key_assignments_view"
            referencedColumns: ["key_id"]
          },
          {
            foreignKeyName: "key_stock_transactions_key_id_fkey"
            columns: ["key_id"]
            isOneToOne: false
            referencedRelation: "key_door_locations"
            referencedColumns: ["key_id"]
          },
          {
            foreignKeyName: "key_stock_transactions_key_id_fkey"
            columns: ["key_id"]
            isOneToOne: false
            referencedRelation: "key_inventory_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "key_stock_transactions_key_id_fkey"
            columns: ["key_id"]
            isOneToOne: false
            referencedRelation: "keys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "key_stock_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "key_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "key_stock_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "key_orders_view"
            referencedColumns: ["id"]
          },
        ]
      }
      keys: {
        Row: {
          available_quantity: number
          created_at: string | null
          id: string
          is_passkey: boolean | null
          key_scope: string | null
          location_data: Json | null
          name: string
          properties: Json | null
          status: Database["public"]["Enums"]["key_status_enum"] | null
          total_quantity: number
          type: Database["public"]["Enums"]["key_type_enum"]
          updated_at: string | null
        }
        Insert: {
          available_quantity?: number
          created_at?: string | null
          id?: string
          is_passkey?: boolean | null
          key_scope?: string | null
          location_data?: Json | null
          name: string
          properties?: Json | null
          status?: Database["public"]["Enums"]["key_status_enum"] | null
          total_quantity?: number
          type: Database["public"]["Enums"]["key_type_enum"]
          updated_at?: string | null
        }
        Update: {
          available_quantity?: number
          created_at?: string | null
          id?: string
          is_passkey?: boolean | null
          key_scope?: string | null
          location_data?: Json | null
          name?: string
          properties?: Json | null
          status?: Database["public"]["Enums"]["key_status_enum"] | null
          total_quantity?: number
          type?: Database["public"]["Enums"]["key_type_enum"]
          updated_at?: string | null
        }
        Relationships: []
      }
      lighting_fixtures: {
        Row: {
          balance_check_date: string | null
          ballast_check_notes: string | null
          ballast_issue: boolean | null
          bulb_count: number | null
          created_at: string | null
          electrical_issues: Json | null
          floor_id: string | null
          id: string
          inspection_history: Json[] | null
          installation_date: string | null
          last_inspection_date: string | null
          last_maintenance_date: string | null
          last_scheduled_by: string | null
          maintenance_frequency_days: number | null
          maintenance_history: Json[] | null
          maintenance_notes: string | null
          maintenance_priority: string | null
          name: string
          next_inspection_date: string | null
          next_maintenance_date: string | null
          position: Database["public"]["Enums"]["lighting_position_enum"] | null
          room_id: string | null
          room_number: string | null
          scheduled_maintenance_date: string | null
          sequence_number: number | null
          space_id: string | null
          space_type: string | null
          status: Database["public"]["Enums"]["light_status_enum"] | null
          technology:
            | Database["public"]["Enums"]["lighting_technology_enum"]
            | null
          type: Database["public"]["Enums"]["light_fixture_type_enum"]
          updated_at: string | null
          zone_id: string | null
        }
        Insert: {
          balance_check_date?: string | null
          ballast_check_notes?: string | null
          ballast_issue?: boolean | null
          bulb_count?: number | null
          created_at?: string | null
          electrical_issues?: Json | null
          floor_id?: string | null
          id?: string
          inspection_history?: Json[] | null
          installation_date?: string | null
          last_inspection_date?: string | null
          last_maintenance_date?: string | null
          last_scheduled_by?: string | null
          maintenance_frequency_days?: number | null
          maintenance_history?: Json[] | null
          maintenance_notes?: string | null
          maintenance_priority?: string | null
          name: string
          next_inspection_date?: string | null
          next_maintenance_date?: string | null
          position?:
            | Database["public"]["Enums"]["lighting_position_enum"]
            | null
          room_id?: string | null
          room_number?: string | null
          scheduled_maintenance_date?: string | null
          sequence_number?: number | null
          space_id?: string | null
          space_type?: string | null
          status?: Database["public"]["Enums"]["light_status_enum"] | null
          technology?:
            | Database["public"]["Enums"]["lighting_technology_enum"]
            | null
          type: Database["public"]["Enums"]["light_fixture_type_enum"]
          updated_at?: string | null
          zone_id?: string | null
        }
        Update: {
          balance_check_date?: string | null
          ballast_check_notes?: string | null
          ballast_issue?: boolean | null
          bulb_count?: number | null
          created_at?: string | null
          electrical_issues?: Json | null
          floor_id?: string | null
          id?: string
          inspection_history?: Json[] | null
          installation_date?: string | null
          last_inspection_date?: string | null
          last_maintenance_date?: string | null
          last_scheduled_by?: string | null
          maintenance_frequency_days?: number | null
          maintenance_history?: Json[] | null
          maintenance_notes?: string | null
          maintenance_priority?: string | null
          name?: string
          next_inspection_date?: string | null
          next_maintenance_date?: string | null
          position?:
            | Database["public"]["Enums"]["lighting_position_enum"]
            | null
          room_id?: string | null
          room_number?: string | null
          scheduled_maintenance_date?: string | null
          sequence_number?: number | null
          space_id?: string | null
          space_type?: string | null
          status?: Database["public"]["Enums"]["light_status_enum"] | null
          technology?:
            | Database["public"]["Enums"]["lighting_technology_enum"]
            | null
          type?: Database["public"]["Enums"]["light_fixture_type_enum"]
          updated_at?: string | null
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lighting_fixtures_floor_id_fkey"
            columns: ["floor_id"]
            isOneToOne: false
            referencedRelation: "floorplan_report_data"
            referencedColumns: ["floor_id"]
          },
          {
            foreignKeyName: "lighting_fixtures_floor_id_fkey"
            columns: ["floor_id"]
            isOneToOne: false
            referencedRelation: "floors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lighting_fixtures_floor_id_fkey"
            columns: ["floor_id"]
            isOneToOne: false
            referencedRelation: "key_door_locations"
            referencedColumns: ["floor_id"]
          },
          {
            foreignKeyName: "lighting_fixtures_last_scheduled_by_fkey"
            columns: ["last_scheduled_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lighting_fixtures_last_scheduled_by_fkey"
            columns: ["last_scheduled_by"]
            isOneToOne: false
            referencedRelation: "user_verification_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lighting_fixtures_last_scheduled_by_fkey"
            columns: ["last_scheduled_by"]
            isOneToOne: false
            referencedRelation: "user_verification_view"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "lighting_fixtures_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_health_overview"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "lighting_fixtures_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_hierarchy_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lighting_fixtures_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_issue_analytics"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "lighting_fixtures_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_occupancy_stats"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "lighting_fixtures_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_selection_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lighting_fixtures_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lighting_fixtures_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "lighting_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      lighting_issues: {
        Row: {
          bulb_type: string
          form_factor: string | null
          id: string
          issue_type: string
          location: string
          notes: string | null
          reported_at: string
          resolved_at: string | null
          status: string
        }
        Insert: {
          bulb_type: string
          form_factor?: string | null
          id?: string
          issue_type: string
          location: string
          notes?: string | null
          reported_at?: string
          resolved_at?: string | null
          status?: string
        }
        Update: {
          bulb_type?: string
          form_factor?: string | null
          id?: string
          issue_type?: string
          location?: string
          notes?: string | null
          reported_at?: string
          resolved_at?: string | null
          status?: string
        }
        Relationships: []
      }
      lighting_maintenance: {
        Row: {
          assigned_technician: string | null
          created_at: string | null
          estimated_duration: unknown | null
          fixture_id: string | null
          id: string
          notes: string | null
          parts_required: Json | null
          priority_level: string | null
          scheduled_date: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_technician?: string | null
          created_at?: string | null
          estimated_duration?: unknown | null
          fixture_id?: string | null
          id?: string
          notes?: string | null
          parts_required?: Json | null
          priority_level?: string | null
          scheduled_date: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_technician?: string | null
          created_at?: string | null
          estimated_duration?: unknown | null
          fixture_id?: string | null
          id?: string
          notes?: string | null
          parts_required?: Json | null
          priority_level?: string | null
          scheduled_date?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lighting_maintenance_assigned_technician_fkey"
            columns: ["assigned_technician"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lighting_maintenance_assigned_technician_fkey"
            columns: ["assigned_technician"]
            isOneToOne: false
            referencedRelation: "user_verification_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lighting_maintenance_assigned_technician_fkey"
            columns: ["assigned_technician"]
            isOneToOne: false
            referencedRelation: "user_verification_view"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "lighting_maintenance_fixture_id_fkey"
            columns: ["fixture_id"]
            isOneToOne: false
            referencedRelation: "lighting_assignments"
            referencedColumns: ["fixture_id"]
          },
          {
            foreignKeyName: "lighting_maintenance_fixture_id_fkey"
            columns: ["fixture_id"]
            isOneToOne: false
            referencedRelation: "lighting_fixtures"
            referencedColumns: ["id"]
          },
        ]
      }
      lighting_maintenance_schedules: {
        Row: {
          assigned_technician: string | null
          completed_by: string | null
          completed_date: string | null
          completion_notes: string | null
          created_at: string | null
          estimated_duration: unknown | null
          fixture_id: string | null
          id: string
          maintenance_type: string
          notes: string | null
          parts_required: Json | null
          priority_level: string | null
          reminder_sent: boolean | null
          scheduled_date: string
          status: string
          updated_at: string | null
        }
        Insert: {
          assigned_technician?: string | null
          completed_by?: string | null
          completed_date?: string | null
          completion_notes?: string | null
          created_at?: string | null
          estimated_duration?: unknown | null
          fixture_id?: string | null
          id?: string
          maintenance_type: string
          notes?: string | null
          parts_required?: Json | null
          priority_level?: string | null
          reminder_sent?: boolean | null
          scheduled_date: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          assigned_technician?: string | null
          completed_by?: string | null
          completed_date?: string | null
          completion_notes?: string | null
          created_at?: string | null
          estimated_duration?: unknown | null
          fixture_id?: string | null
          id?: string
          maintenance_type?: string
          notes?: string | null
          parts_required?: Json | null
          priority_level?: string | null
          reminder_sent?: boolean | null
          scheduled_date?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lighting_maintenance_schedules_assigned_technician_fkey"
            columns: ["assigned_technician"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lighting_maintenance_schedules_assigned_technician_fkey"
            columns: ["assigned_technician"]
            isOneToOne: false
            referencedRelation: "user_verification_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lighting_maintenance_schedules_assigned_technician_fkey"
            columns: ["assigned_technician"]
            isOneToOne: false
            referencedRelation: "user_verification_view"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "lighting_maintenance_schedules_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lighting_maintenance_schedules_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "user_verification_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lighting_maintenance_schedules_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "user_verification_view"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "lighting_maintenance_schedules_fixture_id_fkey"
            columns: ["fixture_id"]
            isOneToOne: false
            referencedRelation: "lighting_assignments"
            referencedColumns: ["fixture_id"]
          },
          {
            foreignKeyName: "lighting_maintenance_schedules_fixture_id_fkey"
            columns: ["fixture_id"]
            isOneToOne: false
            referencedRelation: "lighting_fixtures"
            referencedColumns: ["id"]
          },
        ]
      }
      lighting_notifications: {
        Row: {
          created_at: string | null
          fixture_id: string | null
          id: string
          message: string
          notification_type: string
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          fixture_id?: string | null
          id?: string
          message: string
          notification_type: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          fixture_id?: string | null
          id?: string
          message?: string
          notification_type?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lighting_notifications_fixture_id_fkey"
            columns: ["fixture_id"]
            isOneToOne: false
            referencedRelation: "lighting_assignments"
            referencedColumns: ["fixture_id"]
          },
          {
            foreignKeyName: "lighting_notifications_fixture_id_fkey"
            columns: ["fixture_id"]
            isOneToOne: false
            referencedRelation: "lighting_fixtures"
            referencedColumns: ["id"]
          },
        ]
      }
      lighting_zones: {
        Row: {
          created_at: string | null
          floor_coverage: Json | null
          floor_id: string | null
          id: string
          name: string
          parent_zone_id: string | null
          type: string
          updated_at: string | null
          zone_path: string[] | null
        }
        Insert: {
          created_at?: string | null
          floor_coverage?: Json | null
          floor_id?: string | null
          id?: string
          name: string
          parent_zone_id?: string | null
          type: string
          updated_at?: string | null
          zone_path?: string[] | null
        }
        Update: {
          created_at?: string | null
          floor_coverage?: Json | null
          floor_id?: string | null
          id?: string
          name?: string
          parent_zone_id?: string | null
          type?: string
          updated_at?: string | null
          zone_path?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "lighting_zones_floor_id_fkey"
            columns: ["floor_id"]
            isOneToOne: false
            referencedRelation: "floorplan_report_data"
            referencedColumns: ["floor_id"]
          },
          {
            foreignKeyName: "lighting_zones_floor_id_fkey"
            columns: ["floor_id"]
            isOneToOne: false
            referencedRelation: "floors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lighting_zones_floor_id_fkey"
            columns: ["floor_id"]
            isOneToOne: false
            referencedRelation: "key_door_locations"
            referencedColumns: ["floor_id"]
          },
          {
            foreignKeyName: "lighting_zones_parent_zone_id_fkey"
            columns: ["parent_zone_id"]
            isOneToOne: false
            referencedRelation: "lighting_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      location_access: {
        Row: {
          access_level: Database["public"]["Enums"]["access_level_enum"]
          building_id: string | null
          created_at: string | null
          floor_id: string | null
          id: string
          profile_id: string | null
          updated_at: string | null
        }
        Insert: {
          access_level?: Database["public"]["Enums"]["access_level_enum"]
          building_id?: string | null
          created_at?: string | null
          floor_id?: string | null
          id?: string
          profile_id?: string | null
          updated_at?: string | null
        }
        Update: {
          access_level?: Database["public"]["Enums"]["access_level_enum"]
          building_id?: string | null
          created_at?: string | null
          floor_id?: string | null
          id?: string
          profile_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "location_access_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "location_access_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "key_door_locations"
            referencedColumns: ["building_id"]
          },
          {
            foreignKeyName: "location_access_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "lighting_assignments"
            referencedColumns: ["building_id"]
          },
          {
            foreignKeyName: "location_access_floor_id_fkey"
            columns: ["floor_id"]
            isOneToOne: false
            referencedRelation: "floorplan_report_data"
            referencedColumns: ["floor_id"]
          },
          {
            foreignKeyName: "location_access_floor_id_fkey"
            columns: ["floor_id"]
            isOneToOne: false
            referencedRelation: "floors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "location_access_floor_id_fkey"
            columns: ["floor_id"]
            isOneToOne: false
            referencedRelation: "key_door_locations"
            referencedColumns: ["floor_id"]
          },
          {
            foreignKeyName: "location_access_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "location_access_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "user_verification_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "location_access_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "user_verification_view"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      maintenance_projects: {
        Row: {
          actual_end_date: string | null
          contractor: string | null
          created_at: string | null
          description: string | null
          expected_end_date: string
          id: string
          name: string
          priority: string
          project_manager: string | null
          start_date: string
          status: string
          updated_at: string | null
        }
        Insert: {
          actual_end_date?: string | null
          contractor?: string | null
          created_at?: string | null
          description?: string | null
          expected_end_date: string
          id?: string
          name: string
          priority: string
          project_manager?: string | null
          start_date: string
          status: string
          updated_at?: string | null
        }
        Update: {
          actual_end_date?: string | null
          contractor?: string | null
          created_at?: string | null
          description?: string | null
          expected_end_date?: string
          id?: string
          name?: string
          priority?: string
          project_manager?: string | null
          start_date?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_projects_project_manager_fkey"
            columns: ["project_manager"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_projects_project_manager_fkey"
            columns: ["project_manager"]
            isOneToOne: false
            referencedRelation: "user_verification_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_projects_project_manager_fkey"
            columns: ["project_manager"]
            isOneToOne: false
            referencedRelation: "user_verification_view"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      maintenance_records: {
        Row: {
          created_at: string | null
          date: string | null
          fixture_id: string | null
          id: string
          notes: string | null
          type: string | null
        }
        Insert: {
          created_at?: string | null
          date?: string | null
          fixture_id?: string | null
          id?: string
          notes?: string | null
          type?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string | null
          fixture_id?: string | null
          id?: string
          notes?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_records_fixture_id_fkey"
            columns: ["fixture_id"]
            isOneToOne: false
            referencedRelation: "lighting_assignments"
            referencedColumns: ["fixture_id"]
          },
          {
            foreignKeyName: "maintenance_records_fixture_id_fkey"
            columns: ["fixture_id"]
            isOneToOne: false
            referencedRelation: "lighting_fixtures"
            referencedColumns: ["id"]
          },
        ]
      }
      occupant_position_history: {
        Row: {
          created_at: string | null
          department: string
          end_date: string | null
          id: string
          notes: string | null
          occupant_id: string | null
          start_date: string
          supervisor_id: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          department: string
          end_date?: string | null
          id?: string
          notes?: string | null
          occupant_id?: string | null
          start_date: string
          supervisor_id?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          department?: string
          end_date?: string | null
          id?: string
          notes?: string | null
          occupant_id?: string | null
          start_date?: string
          supervisor_id?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "occupant_position_history_occupant_id_fkey"
            columns: ["occupant_id"]
            isOneToOne: false
            referencedRelation: "occupant_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "occupant_position_history_occupant_id_fkey"
            columns: ["occupant_id"]
            isOneToOne: false
            referencedRelation: "occupants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "occupant_position_history_supervisor_id_fkey"
            columns: ["supervisor_id"]
            isOneToOne: false
            referencedRelation: "occupant_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "occupant_position_history_supervisor_id_fkey"
            columns: ["supervisor_id"]
            isOneToOne: false
            referencedRelation: "occupants"
            referencedColumns: ["id"]
          },
        ]
      }
      occupant_room_assignments: {
        Row: {
          assigned_at: string | null
          assignment_type: string
          created_at: string | null
          id: string
          is_primary: boolean | null
          notes: string | null
          occupant_id: string | null
          room_id: string | null
          schedule: Json | null
          updated_at: string | null
        }
        Insert: {
          assigned_at?: string | null
          assignment_type?: string
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          notes?: string | null
          occupant_id?: string | null
          room_id?: string | null
          schedule?: Json | null
          updated_at?: string | null
        }
        Update: {
          assigned_at?: string | null
          assignment_type?: string
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          notes?: string | null
          occupant_id?: string | null
          room_id?: string | null
          schedule?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_occupant"
            columns: ["occupant_id"]
            isOneToOne: false
            referencedRelation: "occupant_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_occupant"
            columns: ["occupant_id"]
            isOneToOne: false
            referencedRelation: "occupants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_occupant_room_assignments_occupant"
            columns: ["occupant_id"]
            isOneToOne: false
            referencedRelation: "occupant_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_occupant_room_assignments_occupant"
            columns: ["occupant_id"]
            isOneToOne: false
            referencedRelation: "occupants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_occupant_room_assignments_room"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_health_overview"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "fk_occupant_room_assignments_room"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_hierarchy_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_occupant_room_assignments_room"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_issue_analytics"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "fk_occupant_room_assignments_room"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_occupancy_stats"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "fk_occupant_room_assignments_room"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_selection_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_occupant_room_assignments_room"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_room"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_health_overview"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "fk_room"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_hierarchy_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_room"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_issue_analytics"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "fk_room"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_occupancy_stats"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "fk_room"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_selection_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_room"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "occupant_room_assignments_new_occupant_id_fkey"
            columns: ["occupant_id"]
            isOneToOne: false
            referencedRelation: "occupant_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "occupant_room_assignments_new_occupant_id_fkey"
            columns: ["occupant_id"]
            isOneToOne: false
            referencedRelation: "occupants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "occupant_room_assignments_new_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_health_overview"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "occupant_room_assignments_new_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_hierarchy_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "occupant_room_assignments_new_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_issue_analytics"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "occupant_room_assignments_new_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_occupancy_stats"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "occupant_room_assignments_new_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_selection_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "occupant_room_assignments_new_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "occupant_room_assignments_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_health_overview"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "occupant_room_assignments_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_hierarchy_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "occupant_room_assignments_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_issue_analytics"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "occupant_room_assignments_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_occupancy_stats"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "occupant_room_assignments_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_selection_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "occupant_room_assignments_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      occupant_room_assignments_backup: {
        Row: {
          approval_status: string | null
          approved_at: string | null
          approved_by: string | null
          assigned_at: string | null
          created_at: string | null
          end_date: string | null
          id: string | null
          is_primary: boolean | null
          occupant_id: string | null
          room_id: string | null
          start_date: string | null
          updated_at: string | null
        }
        Insert: {
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          assigned_at?: string | null
          created_at?: string | null
          end_date?: string | null
          id?: string | null
          is_primary?: boolean | null
          occupant_id?: string | null
          room_id?: string | null
          start_date?: string | null
          updated_at?: string | null
        }
        Update: {
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          assigned_at?: string | null
          created_at?: string | null
          end_date?: string | null
          id?: string | null
          is_primary?: boolean | null
          occupant_id?: string | null
          room_id?: string | null
          start_date?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      occupant_status_history: {
        Row: {
          change_date: string
          change_reason: Database["public"]["Enums"]["occupant_status_change_reason_enum"]
          changed_by: string | null
          created_at: string | null
          id: string
          new_status: Database["public"]["Enums"]["occupant_status_enum"]
          notes: string | null
          occupant_id: string | null
          previous_status:
            | Database["public"]["Enums"]["occupant_status_enum"]
            | null
        }
        Insert: {
          change_date?: string
          change_reason: Database["public"]["Enums"]["occupant_status_change_reason_enum"]
          changed_by?: string | null
          created_at?: string | null
          id?: string
          new_status: Database["public"]["Enums"]["occupant_status_enum"]
          notes?: string | null
          occupant_id?: string | null
          previous_status?:
            | Database["public"]["Enums"]["occupant_status_enum"]
            | null
        }
        Update: {
          change_date?: string
          change_reason?: Database["public"]["Enums"]["occupant_status_change_reason_enum"]
          changed_by?: string | null
          created_at?: string | null
          id?: string
          new_status?: Database["public"]["Enums"]["occupant_status_enum"]
          notes?: string | null
          occupant_id?: string | null
          previous_status?:
            | Database["public"]["Enums"]["occupant_status_enum"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "occupant_status_history_occupant_id_fkey"
            columns: ["occupant_id"]
            isOneToOne: false
            referencedRelation: "occupant_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "occupant_status_history_occupant_id_fkey"
            columns: ["occupant_id"]
            isOneToOne: false
            referencedRelation: "occupants"
            referencedColumns: ["id"]
          },
        ]
      }
      occupants: {
        Row: {
          access_level: string | null
          assigned_resources: Json | null
          created_at: string | null
          department: string | null
          email: string | null
          emergency_contact: Json | null
          employment_type: string | null
          end_date: string | null
          first_name: string
          hire_date: string | null
          id: string
          last_name: string
          notes: string | null
          phone: string | null
          room_id: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["occupant_status_enum"]
          supervisor_id: string | null
          termination_date: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          access_level?: string | null
          assigned_resources?: Json | null
          created_at?: string | null
          department?: string | null
          email?: string | null
          emergency_contact?: Json | null
          employment_type?: string | null
          end_date?: string | null
          first_name: string
          hire_date?: string | null
          id?: string
          last_name: string
          notes?: string | null
          phone?: string | null
          room_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["occupant_status_enum"]
          supervisor_id?: string | null
          termination_date?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          access_level?: string | null
          assigned_resources?: Json | null
          created_at?: string | null
          department?: string | null
          email?: string | null
          emergency_contact?: Json | null
          employment_type?: string | null
          end_date?: string | null
          first_name?: string
          hire_date?: string | null
          id?: string
          last_name?: string
          notes?: string | null
          phone?: string | null
          room_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["occupant_status_enum"]
          supervisor_id?: string | null
          termination_date?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "occupants_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_health_overview"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "occupants_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_hierarchy_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "occupants_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_issue_analytics"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "occupants_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_occupancy_stats"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "occupants_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_selection_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "occupants_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "occupants_supervisor_id_fkey"
            columns: ["supervisor_id"]
            isOneToOne: false
            referencedRelation: "occupant_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "occupants_supervisor_id_fkey"
            columns: ["supervisor_id"]
            isOneToOne: false
            referencedRelation: "occupants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          access_level: Database["public"]["Enums"]["access_level_enum"] | null
          accessibility_preferences: Json | null
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          department: string | null
          department_id: string | null
          email: string | null
          emergency_contact: Json | null
          feature_flags: Json | null
          first_name: string | null
          id: string
          interface_preferences: Json | null
          is_approved: boolean | null
          job_title_validated: boolean | null
          language: string | null
          last_login: string | null
          last_login_at: string | null
          last_name: string | null
          metadata: Json | null
          notification_preferences: Json | null
          phone: string | null
          security_settings: Json | null
          system_preferences: Json | null
          theme: string | null
          time_zone: string | null
          title: string | null
          updated_at: string | null
          username: string | null
          verification_status:
            | Database["public"]["Enums"]["verification_status_enum"]
            | null
        }
        Insert: {
          access_level?: Database["public"]["Enums"]["access_level_enum"] | null
          accessibility_preferences?: Json | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          department?: string | null
          department_id?: string | null
          email?: string | null
          emergency_contact?: Json | null
          feature_flags?: Json | null
          first_name?: string | null
          id: string
          interface_preferences?: Json | null
          is_approved?: boolean | null
          job_title_validated?: boolean | null
          language?: string | null
          last_login?: string | null
          last_login_at?: string | null
          last_name?: string | null
          metadata?: Json | null
          notification_preferences?: Json | null
          phone?: string | null
          security_settings?: Json | null
          system_preferences?: Json | null
          theme?: string | null
          time_zone?: string | null
          title?: string | null
          updated_at?: string | null
          username?: string | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status_enum"]
            | null
        }
        Update: {
          access_level?: Database["public"]["Enums"]["access_level_enum"] | null
          accessibility_preferences?: Json | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          department?: string | null
          department_id?: string | null
          email?: string | null
          emergency_contact?: Json | null
          feature_flags?: Json | null
          first_name?: string | null
          id?: string
          interface_preferences?: Json | null
          is_approved?: boolean | null
          job_title_validated?: boolean | null
          language?: string | null
          last_login?: string | null
          last_login_at?: string | null
          last_name?: string | null
          metadata?: Json | null
          notification_preferences?: Json | null
          phone?: string | null
          security_settings?: Json | null
          system_preferences?: Json | null
          theme?: string | null
          time_zone?: string | null
          title?: string | null
          updated_at?: string | null
          username?: string | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status_enum"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      project_notifications: {
        Row: {
          created_at: string | null
          id: string
          message: string
          project_id: string
          recipient_list: Json | null
          recipient_type: string
          scheduled_date: string
          sent_date: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          project_id: string
          recipient_list?: Json | null
          recipient_type: string
          scheduled_date: string
          sent_date?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          project_id?: string
          recipient_list?: Json | null
          recipient_type?: string
          scheduled_date?: string
          sent_date?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_notifications_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "maintenance_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_phases: {
        Row: {
          actual_end_date: string | null
          created_at: string | null
          description: string | null
          expected_duration_days: number
          id: string
          name: string
          project_id: string
          sequence_number: number
          start_date: string
          status: string
          updated_at: string | null
        }
        Insert: {
          actual_end_date?: string | null
          created_at?: string | null
          description?: string | null
          expected_duration_days: number
          id?: string
          name: string
          project_id: string
          sequence_number: number
          start_date: string
          status: string
          updated_at?: string | null
        }
        Update: {
          actual_end_date?: string | null
          created_at?: string | null
          description?: string | null
          expected_duration_days?: number
          id?: string
          name?: string
          project_id?: string
          sequence_number?: number
          start_date?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_phases_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "maintenance_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      relocation_notification_preferences: {
        Row: {
          created_at: string | null
          email_enabled: boolean | null
          id: string
          in_app_enabled: boolean | null
          notification_level:
            | Database["public"]["Enums"]["notification_preference"]
            | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email_enabled?: boolean | null
          id?: string
          in_app_enabled?: boolean | null
          notification_level?:
            | Database["public"]["Enums"]["notification_preference"]
            | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email_enabled?: boolean | null
          id?: string
          in_app_enabled?: boolean | null
          notification_level?:
            | Database["public"]["Enums"]["notification_preference"]
            | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      relocation_notifications: {
        Row: {
          created_at: string | null
          id: string
          message: string
          notification_type: string
          recipients: Json | null
          relocation_id: string | null
          scheduled_for: string | null
          sent_at: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          notification_type: string
          recipients?: Json | null
          relocation_id?: string | null
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          notification_type?: string
          recipients?: Json | null
          relocation_id?: string | null
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "relocation_notifications_relocation_id_fkey"
            columns: ["relocation_id"]
            isOneToOne: false
            referencedRelation: "active_relocations_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "relocation_notifications_relocation_id_fkey"
            columns: ["relocation_id"]
            isOneToOne: false
            referencedRelation: "room_relocations"
            referencedColumns: ["id"]
          },
        ]
      }
      relocation_schedule_changes: {
        Row: {
          affected_dates: unknown
          created_at: string | null
          created_by: string | null
          id: string
          modified_schedule: Json
          notes: string | null
          original_schedule: Json
          relocation_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          affected_dates: unknown
          created_at?: string | null
          created_by?: string | null
          id?: string
          modified_schedule: Json
          notes?: string | null
          original_schedule: Json
          relocation_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          affected_dates?: unknown
          created_at?: string | null
          created_by?: string | null
          id?: string
          modified_schedule?: Json
          notes?: string | null
          original_schedule?: Json
          relocation_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "relocation_schedule_changes_relocation_id_fkey"
            columns: ["relocation_id"]
            isOneToOne: false
            referencedRelation: "active_relocations_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "relocation_schedule_changes_relocation_id_fkey"
            columns: ["relocation_id"]
            isOneToOne: false
            referencedRelation: "room_relocations"
            referencedColumns: ["id"]
          },
        ]
      }
      relocations: {
        Row: {
          cancelled_at: string | null
          completed_at: string | null
          created_at: string | null
          end_date: string | null
          id: string
          notes: string | null
          reason: string | null
          source_courtroom_id: string
          start_date: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["relocation_status_enum"] | null
          target_courtroom_id: string
          updated_at: string | null
        }
        Insert: {
          cancelled_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          notes?: string | null
          reason?: string | null
          source_courtroom_id: string
          start_date?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["relocation_status_enum"] | null
          target_courtroom_id: string
          updated_at?: string | null
        }
        Update: {
          cancelled_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          notes?: string | null
          reason?: string | null
          source_courtroom_id?: string
          start_date?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["relocation_status_enum"] | null
          target_courtroom_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "relocations_source_courtroom_id_fkey"
            columns: ["source_courtroom_id"]
            isOneToOne: false
            referencedRelation: "room_health_overview"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "relocations_source_courtroom_id_fkey"
            columns: ["source_courtroom_id"]
            isOneToOne: false
            referencedRelation: "room_hierarchy_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "relocations_source_courtroom_id_fkey"
            columns: ["source_courtroom_id"]
            isOneToOne: false
            referencedRelation: "room_issue_analytics"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "relocations_source_courtroom_id_fkey"
            columns: ["source_courtroom_id"]
            isOneToOne: false
            referencedRelation: "room_occupancy_stats"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "relocations_source_courtroom_id_fkey"
            columns: ["source_courtroom_id"]
            isOneToOne: false
            referencedRelation: "room_selection_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "relocations_source_courtroom_id_fkey"
            columns: ["source_courtroom_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "relocations_target_courtroom_id_fkey"
            columns: ["target_courtroom_id"]
            isOneToOne: false
            referencedRelation: "room_health_overview"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "relocations_target_courtroom_id_fkey"
            columns: ["target_courtroom_id"]
            isOneToOne: false
            referencedRelation: "room_hierarchy_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "relocations_target_courtroom_id_fkey"
            columns: ["target_courtroom_id"]
            isOneToOne: false
            referencedRelation: "room_issue_analytics"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "relocations_target_courtroom_id_fkey"
            columns: ["target_courtroom_id"]
            isOneToOne: false
            referencedRelation: "room_occupancy_stats"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "relocations_target_courtroom_id_fkey"
            columns: ["target_courtroom_id"]
            isOneToOne: false
            referencedRelation: "room_selection_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "relocations_target_courtroom_id_fkey"
            columns: ["target_courtroom_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      renovations: {
        Row: {
          contractor: string | null
          courtroom_id: string
          created_at: string | null
          end_date: string | null
          id: string
          notes: string | null
          start_date: string | null
          status: string | null
          updated_at: string | null
          work_type: string | null
        }
        Insert: {
          contractor?: string | null
          courtroom_id: string
          created_at?: string | null
          end_date?: string | null
          id?: string
          notes?: string | null
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
          work_type?: string | null
        }
        Update: {
          contractor?: string | null
          courtroom_id?: string
          created_at?: string | null
          end_date?: string | null
          id?: string
          notes?: string | null
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
          work_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "renovations_courtroom_id_fkey"
            columns: ["courtroom_id"]
            isOneToOne: false
            referencedRelation: "room_health_overview"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "renovations_courtroom_id_fkey"
            columns: ["courtroom_id"]
            isOneToOne: false
            referencedRelation: "room_hierarchy_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "renovations_courtroom_id_fkey"
            columns: ["courtroom_id"]
            isOneToOne: false
            referencedRelation: "room_issue_analytics"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "renovations_courtroom_id_fkey"
            columns: ["courtroom_id"]
            isOneToOne: false
            referencedRelation: "room_occupancy_stats"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "renovations_courtroom_id_fkey"
            columns: ["courtroom_id"]
            isOneToOne: false
            referencedRelation: "room_selection_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "renovations_courtroom_id_fkey"
            columns: ["courtroom_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      report_templates: {
        Row: {
          config: Json
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_public: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          config?: Json
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          config?: Json
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      role_assignments: {
        Row: {
          assigned_by: string | null
          created_at: string | null
          id: string
          profile_id: string | null
          role: string
        }
        Insert: {
          assigned_by?: string | null
          created_at?: string | null
          id?: string
          profile_id?: string | null
          role: string
        }
        Update: {
          assigned_by?: string | null
          created_at?: string | null
          id?: string
          profile_id?: string | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_assignments_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_assignments_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "user_verification_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_assignments_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "user_verification_view"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      room_health_metrics: {
        Row: {
          avg_resolution_time: unknown | null
          created_at: string | null
          critical_issues_count: number | null
          health_score: number | null
          id: string
          last_assessment_date: string | null
          last_maintenance_date: string | null
          maintenance_compliance_score: number | null
          metrics_data: Json | null
          next_maintenance_due: string | null
          open_issues_count: number | null
          recurring_issues_count: number | null
          room_id: string
          total_issues_count: number | null
          updated_at: string | null
        }
        Insert: {
          avg_resolution_time?: unknown | null
          created_at?: string | null
          critical_issues_count?: number | null
          health_score?: number | null
          id?: string
          last_assessment_date?: string | null
          last_maintenance_date?: string | null
          maintenance_compliance_score?: number | null
          metrics_data?: Json | null
          next_maintenance_due?: string | null
          open_issues_count?: number | null
          recurring_issues_count?: number | null
          room_id: string
          total_issues_count?: number | null
          updated_at?: string | null
        }
        Update: {
          avg_resolution_time?: unknown | null
          created_at?: string | null
          critical_issues_count?: number | null
          health_score?: number | null
          id?: string
          last_assessment_date?: string | null
          last_maintenance_date?: string | null
          maintenance_compliance_score?: number | null
          metrics_data?: Json | null
          next_maintenance_due?: string | null
          open_issues_count?: number | null
          recurring_issues_count?: number | null
          room_id?: string
          total_issues_count?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "room_health_metrics_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_health_overview"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "room_health_metrics_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_hierarchy_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_health_metrics_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_issue_analytics"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "room_health_metrics_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_occupancy_stats"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "room_health_metrics_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_selection_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_health_metrics_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      room_history: {
        Row: {
          change_type: string
          changed_by: string | null
          created_at: string | null
          id: string
          new_values: Json | null
          previous_values: Json | null
          room_id: string
        }
        Insert: {
          change_type: string
          changed_by?: string | null
          created_at?: string | null
          id?: string
          new_values?: Json | null
          previous_values?: Json | null
          room_id: string
        }
        Update: {
          change_type?: string
          changed_by?: string | null
          created_at?: string | null
          id?: string
          new_values?: Json | null
          previous_values?: Json | null
          room_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_history_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_health_overview"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "room_history_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_hierarchy_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_history_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_issue_analytics"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "room_history_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_occupancy_stats"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "room_history_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_selection_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_history_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      room_inventory: {
        Row: {
          category: string | null
          condition: string | null
          created_at: string | null
          description: string | null
          id: string
          last_updated: string | null
          name: string
          quantity: number
          room_id: string
        }
        Insert: {
          category?: string | null
          condition?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          last_updated?: string | null
          name: string
          quantity?: number
          room_id: string
        }
        Update: {
          category?: string | null
          condition?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          last_updated?: string | null
          name?: string
          quantity?: number
          room_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_inventory_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_health_overview"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "room_inventory_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_hierarchy_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_inventory_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_issue_analytics"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "room_inventory_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_occupancy_stats"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "room_inventory_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_selection_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_inventory_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      room_issue_categories: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
          parent_category_id: string | null
          requires_immediate_action: boolean | null
          severity_threshold: number | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          parent_category_id?: string | null
          requires_immediate_action?: boolean | null
          severity_threshold?: number | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          parent_category_id?: string | null
          requires_immediate_action?: boolean | null
          severity_threshold?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "room_issue_categories_parent_category_id_fkey"
            columns: ["parent_category_id"]
            isOneToOne: false
            referencedRelation: "room_issue_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      room_lighting_status: {
        Row: {
          created_at: string | null
          id: string
          non_working_fixtures: number | null
          room_id: string | null
          room_name: string | null
          room_number: string | null
          total_fixtures: number | null
          updated_at: string | null
          working_fixtures: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          non_working_fixtures?: number | null
          room_id?: string | null
          room_name?: string | null
          room_number?: string | null
          total_fixtures?: number | null
          updated_at?: string | null
          working_fixtures?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          non_working_fixtures?: number | null
          room_id?: string | null
          room_name?: string | null
          room_number?: string | null
          total_fixtures?: number | null
          updated_at?: string | null
          working_fixtures?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "room_lighting_status_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_health_overview"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "room_lighting_status_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_hierarchy_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_lighting_status_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_issue_analytics"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "room_lighting_status_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_occupancy_stats"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "room_lighting_status_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_selection_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_lighting_status_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      room_maintenance_schedule: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          frequency: string | null
          id: string
          last_completed_at: string | null
          next_due_at: string | null
          notes: string | null
          priority: string | null
          room_id: string
          schedule_config: Json | null
          schedule_type: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          frequency?: string | null
          id?: string
          last_completed_at?: string | null
          next_due_at?: string | null
          notes?: string | null
          priority?: string | null
          room_id: string
          schedule_config?: Json | null
          schedule_type?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          frequency?: string | null
          id?: string
          last_completed_at?: string | null
          next_due_at?: string | null
          notes?: string | null
          priority?: string | null
          room_id?: string
          schedule_config?: Json | null
          schedule_type?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "room_maintenance_schedule_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_health_overview"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "room_maintenance_schedule_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_hierarchy_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_maintenance_schedule_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_issue_analytics"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "room_maintenance_schedule_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_occupancy_stats"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "room_maintenance_schedule_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_selection_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_maintenance_schedule_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      room_properties: {
        Row: {
          current_function: string | null
          current_occupancy: number | null
          function_change_date: string | null
          is_storage: boolean | null
          parent_room_id: string | null
          phone_number: string | null
          previous_functions: Json[] | null
          room_type: Database["public"]["Enums"]["room_type_enum"]
          space_id: string
          storage_capacity: number | null
          storage_type: string | null
        }
        Insert: {
          current_function?: string | null
          current_occupancy?: number | null
          function_change_date?: string | null
          is_storage?: boolean | null
          parent_room_id?: string | null
          phone_number?: string | null
          previous_functions?: Json[] | null
          room_type?: Database["public"]["Enums"]["room_type_enum"]
          space_id: string
          storage_capacity?: number | null
          storage_type?: string | null
        }
        Update: {
          current_function?: string | null
          current_occupancy?: number | null
          function_change_date?: string | null
          is_storage?: boolean | null
          parent_room_id?: string | null
          phone_number?: string | null
          previous_functions?: Json[] | null
          room_type?: Database["public"]["Enums"]["room_type_enum"]
          space_id?: string
          storage_capacity?: number | null
          storage_type?: string | null
        }
        Relationships: []
      }
      room_relationships: {
        Row: {
          created_at: string | null
          id: string
          primary_room_id: string | null
          related_room_id: string | null
          relationship_type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          primary_room_id?: string | null
          related_room_id?: string | null
          relationship_type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          primary_room_id?: string | null
          related_room_id?: string | null
          relationship_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "room_relationships_primary_room_id_fkey"
            columns: ["primary_room_id"]
            isOneToOne: false
            referencedRelation: "room_health_overview"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "room_relationships_primary_room_id_fkey"
            columns: ["primary_room_id"]
            isOneToOne: false
            referencedRelation: "room_hierarchy_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_relationships_primary_room_id_fkey"
            columns: ["primary_room_id"]
            isOneToOne: false
            referencedRelation: "room_issue_analytics"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "room_relationships_primary_room_id_fkey"
            columns: ["primary_room_id"]
            isOneToOne: false
            referencedRelation: "room_occupancy_stats"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "room_relationships_primary_room_id_fkey"
            columns: ["primary_room_id"]
            isOneToOne: false
            referencedRelation: "room_selection_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_relationships_primary_room_id_fkey"
            columns: ["primary_room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_relationships_related_room_id_fkey"
            columns: ["related_room_id"]
            isOneToOne: false
            referencedRelation: "room_health_overview"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "room_relationships_related_room_id_fkey"
            columns: ["related_room_id"]
            isOneToOne: false
            referencedRelation: "room_hierarchy_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_relationships_related_room_id_fkey"
            columns: ["related_room_id"]
            isOneToOne: false
            referencedRelation: "room_issue_analytics"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "room_relationships_related_room_id_fkey"
            columns: ["related_room_id"]
            isOneToOne: false
            referencedRelation: "room_occupancy_stats"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "room_relationships_related_room_id_fkey"
            columns: ["related_room_id"]
            isOneToOne: false
            referencedRelation: "room_selection_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_relationships_related_room_id_fkey"
            columns: ["related_room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      room_relocations: {
        Row: {
          created_at: string | null
          created_by: string | null
          end_date: string
          id: string
          metadata: Json | null
          notes: string | null
          original_room_id: string | null
          reason: string
          relocation_type: Database["public"]["Enums"]["relocation_type_enum"]
          respect_term_assignments: boolean | null
          special_instructions: string | null
          start_date: string
          status: Database["public"]["Enums"]["relocation_status_enum"] | null
          temporary_room_id: string | null
          term_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          end_date: string
          id?: string
          metadata?: Json | null
          notes?: string | null
          original_room_id?: string | null
          reason: string
          relocation_type: Database["public"]["Enums"]["relocation_type_enum"]
          respect_term_assignments?: boolean | null
          special_instructions?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["relocation_status_enum"] | null
          temporary_room_id?: string | null
          term_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          end_date?: string
          id?: string
          metadata?: Json | null
          notes?: string | null
          original_room_id?: string | null
          reason?: string
          relocation_type?: Database["public"]["Enums"]["relocation_type_enum"]
          respect_term_assignments?: boolean | null
          special_instructions?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["relocation_status_enum"] | null
          temporary_room_id?: string | null
          term_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "room_relocations_original_room_id_fkey"
            columns: ["original_room_id"]
            isOneToOne: false
            referencedRelation: "room_health_overview"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "room_relocations_original_room_id_fkey"
            columns: ["original_room_id"]
            isOneToOne: false
            referencedRelation: "room_hierarchy_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_relocations_original_room_id_fkey"
            columns: ["original_room_id"]
            isOneToOne: false
            referencedRelation: "room_issue_analytics"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "room_relocations_original_room_id_fkey"
            columns: ["original_room_id"]
            isOneToOne: false
            referencedRelation: "room_occupancy_stats"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "room_relocations_original_room_id_fkey"
            columns: ["original_room_id"]
            isOneToOne: false
            referencedRelation: "room_selection_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_relocations_original_room_id_fkey"
            columns: ["original_room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_relocations_temporary_room_id_fkey"
            columns: ["temporary_room_id"]
            isOneToOne: false
            referencedRelation: "room_health_overview"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "room_relocations_temporary_room_id_fkey"
            columns: ["temporary_room_id"]
            isOneToOne: false
            referencedRelation: "room_hierarchy_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_relocations_temporary_room_id_fkey"
            columns: ["temporary_room_id"]
            isOneToOne: false
            referencedRelation: "room_issue_analytics"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "room_relocations_temporary_room_id_fkey"
            columns: ["temporary_room_id"]
            isOneToOne: false
            referencedRelation: "room_occupancy_stats"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "room_relocations_temporary_room_id_fkey"
            columns: ["temporary_room_id"]
            isOneToOne: false
            referencedRelation: "room_selection_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_relocations_temporary_room_id_fkey"
            columns: ["temporary_room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_relocations_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "court_terms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_relocations_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "term_details"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          capacity: number | null
          courtroom_photos: Json | null
          created_at: string | null
          current_function: string | null
          current_occupancy: number | null
          description: string | null
          floor_id: string
          function_change_date: string | null
          id: string
          is_parent: boolean
          is_storage: boolean | null
          last_inventory_check: string | null
          maintenance_history: Json[] | null
          name: string
          next_maintenance_date: string | null
          parent_room_id: string | null
          phone_number: string | null
          position: Json | null
          previous_functions: Json[] | null
          room_number: string | null
          room_type: Database["public"]["Enums"]["room_type_enum"]
          rotation: number | null
          size: Json | null
          status: Database["public"]["Enums"]["status_enum"] | null
          storage_capacity: number | null
          storage_notes: string | null
          storage_type: string | null
          updated_at: string | null
        }
        Insert: {
          capacity?: number | null
          courtroom_photos?: Json | null
          created_at?: string | null
          current_function?: string | null
          current_occupancy?: number | null
          description?: string | null
          floor_id: string
          function_change_date?: string | null
          id?: string
          is_parent?: boolean
          is_storage?: boolean | null
          last_inventory_check?: string | null
          maintenance_history?: Json[] | null
          name: string
          next_maintenance_date?: string | null
          parent_room_id?: string | null
          phone_number?: string | null
          position?: Json | null
          previous_functions?: Json[] | null
          room_number?: string | null
          room_type?: Database["public"]["Enums"]["room_type_enum"]
          rotation?: number | null
          size?: Json | null
          status?: Database["public"]["Enums"]["status_enum"] | null
          storage_capacity?: number | null
          storage_notes?: string | null
          storage_type?: string | null
          updated_at?: string | null
        }
        Update: {
          capacity?: number | null
          courtroom_photos?: Json | null
          created_at?: string | null
          current_function?: string | null
          current_occupancy?: number | null
          description?: string | null
          floor_id?: string
          function_change_date?: string | null
          id?: string
          is_parent?: boolean
          is_storage?: boolean | null
          last_inventory_check?: string | null
          maintenance_history?: Json[] | null
          name?: string
          next_maintenance_date?: string | null
          parent_room_id?: string | null
          phone_number?: string | null
          position?: Json | null
          previous_functions?: Json[] | null
          room_number?: string | null
          room_type?: Database["public"]["Enums"]["room_type_enum"]
          rotation?: number | null
          size?: Json | null
          status?: Database["public"]["Enums"]["status_enum"] | null
          storage_capacity?: number | null
          storage_notes?: string | null
          storage_type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rooms_floor_id_fkey"
            columns: ["floor_id"]
            isOneToOne: false
            referencedRelation: "floorplan_report_data"
            referencedColumns: ["floor_id"]
          },
          {
            foreignKeyName: "rooms_floor_id_fkey"
            columns: ["floor_id"]
            isOneToOne: false
            referencedRelation: "floors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rooms_floor_id_fkey"
            columns: ["floor_id"]
            isOneToOne: false
            referencedRelation: "key_door_locations"
            referencedColumns: ["floor_id"]
          },
          {
            foreignKeyName: "rooms_parent_room_id_fkey"
            columns: ["parent_room_id"]
            isOneToOne: false
            referencedRelation: "room_health_overview"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "rooms_parent_room_id_fkey"
            columns: ["parent_room_id"]
            isOneToOne: false
            referencedRelation: "room_hierarchy_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rooms_parent_room_id_fkey"
            columns: ["parent_room_id"]
            isOneToOne: false
            referencedRelation: "room_issue_analytics"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "rooms_parent_room_id_fkey"
            columns: ["parent_room_id"]
            isOneToOne: false
            referencedRelation: "room_occupancy_stats"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "rooms_parent_room_id_fkey"
            columns: ["parent_room_id"]
            isOneToOne: false
            referencedRelation: "room_selection_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rooms_parent_room_id_fkey"
            columns: ["parent_room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_filters: {
        Row: {
          created_at: string | null
          filters: Json
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          filters: Json
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          filters?: Json
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      schedule_changes: {
        Row: {
          created_at: string | null
          created_by: string | null
          end_date: string | null
          id: string
          original_court_part: string
          relocation_id: string | null
          special_instructions: string | null
          start_date: string
          status: Database["public"]["Enums"]["relocation_status_enum"] | null
          temporary_assignment: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          end_date?: string | null
          id?: string
          original_court_part: string
          relocation_id?: string | null
          special_instructions?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["relocation_status_enum"] | null
          temporary_assignment: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          end_date?: string | null
          id?: string
          original_court_part?: string
          relocation_id?: string | null
          special_instructions?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["relocation_status_enum"] | null
          temporary_assignment?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "schedule_changes_relocation_id_fkey"
            columns: ["relocation_id"]
            isOneToOne: false
            referencedRelation: "active_relocations_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_changes_relocation_id_fkey"
            columns: ["relocation_id"]
            isOneToOne: false
            referencedRelation: "room_relocations"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_reports: {
        Row: {
          config: Json
          created_at: string | null
          created_by: string | null
          id: string
          last_run_at: string | null
          name: string
          next_run_at: string | null
          recipients: Json | null
          schedule: string
          status: string | null
          template_id: string | null
          updated_at: string | null
        }
        Insert: {
          config?: Json
          created_at?: string | null
          created_by?: string | null
          id?: string
          last_run_at?: string | null
          name: string
          next_run_at?: string | null
          recipients?: Json | null
          schedule: string
          status?: string | null
          template_id?: string | null
          updated_at?: string | null
        }
        Update: {
          config?: Json
          created_at?: string | null
          created_by?: string | null
          id?: string
          last_run_at?: string | null
          name?: string
          next_run_at?: string | null
          recipients?: Json | null
          schedule?: string
          status?: string | null
          template_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_reports_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "report_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      security_logs: {
        Row: {
          created_at: string | null
          description: string
          event_type: string
          id: string
          metadata: Json | null
          severity: string
        }
        Insert: {
          created_at?: string | null
          description: string
          event_type: string
          id?: string
          metadata?: Json | null
          severity: string
        }
        Update: {
          created_at?: string | null
          description?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          severity?: string
        }
        Relationships: []
      }
      service_impacts: {
        Row: {
          alternative_arrangements: string | null
          contact_person: string | null
          created_at: string | null
          department: string
          id: string
          impact_description: string
          project_id: string
          updated_at: string | null
        }
        Insert: {
          alternative_arrangements?: string | null
          contact_person?: string | null
          created_at?: string | null
          department: string
          id?: string
          impact_description: string
          project_id: string
          updated_at?: string | null
        }
        Update: {
          alternative_arrangements?: string | null
          contact_person?: string | null
          created_at?: string | null
          department?: string
          id?: string
          impact_description?: string
          project_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_impacts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "maintenance_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      space_impacts: {
        Row: {
          created_at: string | null
          end_date: string
          id: string
          impact_type: string
          notes: string | null
          phase_id: string | null
          project_id: string
          space_id: string
          start_date: string
          temporary_relocation_space_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          end_date: string
          id?: string
          impact_type: string
          notes?: string | null
          phase_id?: string | null
          project_id: string
          space_id: string
          start_date: string
          temporary_relocation_space_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          end_date?: string
          id?: string
          impact_type?: string
          notes?: string | null
          phase_id?: string | null
          project_id?: string
          space_id?: string
          start_date?: string
          temporary_relocation_space_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "space_impacts_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "project_phases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "space_impacts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "maintenance_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      spatial_assignments: {
        Row: {
          created_at: string | null
          fixture_id: string
          id: string
          position: string
          sequence_number: number
          space_id: string
          space_type: string
          updated_at: string | null
          zone_id: string | null
        }
        Insert: {
          created_at?: string | null
          fixture_id: string
          id?: string
          position: string
          sequence_number: number
          space_id: string
          space_type: string
          updated_at?: string | null
          zone_id?: string | null
        }
        Update: {
          created_at?: string | null
          fixture_id?: string
          id?: string
          position?: string
          sequence_number?: number
          space_id?: string
          space_type?: string
          updated_at?: string | null
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "spatial_assignments_fixture_id_fkey"
            columns: ["fixture_id"]
            isOneToOne: true
            referencedRelation: "lighting_assignments"
            referencedColumns: ["fixture_id"]
          },
          {
            foreignKeyName: "spatial_assignments_fixture_id_fkey"
            columns: ["fixture_id"]
            isOneToOne: true
            referencedRelation: "lighting_fixtures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spatial_assignments_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "lighting_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      storage_analytics: {
        Row: {
          bucket_name: string
          created_at: string | null
          file_count: number
          file_types: Json | null
          id: string
          last_backup_at: string | null
          last_cleanup_at: string | null
          total_size_bytes: number
          unused_files: Json | null
          updated_at: string | null
        }
        Insert: {
          bucket_name: string
          created_at?: string | null
          file_count?: number
          file_types?: Json | null
          id?: string
          last_backup_at?: string | null
          last_cleanup_at?: string | null
          total_size_bytes?: number
          unused_files?: Json | null
          updated_at?: string | null
        }
        Update: {
          bucket_name?: string
          created_at?: string | null
          file_count?: number
          file_types?: Json | null
          id?: string
          last_backup_at?: string | null
          last_cleanup_at?: string | null
          total_size_bytes?: number
          unused_files?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      system_config: {
        Row: {
          created_at: string | null
          id: string
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          created_at?: string | null
          id?: string
          key: string
          updated_at?: string | null
          value: Json
        }
        Update: {
          created_at?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          created_at: string | null
          id: string
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          created_at?: string | null
          id?: string
          key: string
          updated_at?: string | null
          value?: Json
        }
        Update: {
          created_at?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
      term_assignments: {
        Row: {
          clerk_names: string[] | null
          created_at: string | null
          fax: string | null
          id: string
          justice_name: string
          part_id: string | null
          phone: string | null
          room_id: string | null
          sergeant_name: string | null
          tel_extension: string | null
          term_id: string | null
          updated_at: string | null
        }
        Insert: {
          clerk_names?: string[] | null
          created_at?: string | null
          fax?: string | null
          id?: string
          justice_name: string
          part_id?: string | null
          phone?: string | null
          room_id?: string | null
          sergeant_name?: string | null
          tel_extension?: string | null
          term_id?: string | null
          updated_at?: string | null
        }
        Update: {
          clerk_names?: string[] | null
          created_at?: string | null
          fax?: string | null
          id?: string
          justice_name?: string
          part_id?: string | null
          phone?: string | null
          room_id?: string | null
          sergeant_name?: string | null
          tel_extension?: string | null
          term_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_term_assignments_part"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "court_parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_term_assignments_room"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_health_overview"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "fk_term_assignments_room"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_hierarchy_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_term_assignments_room"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_issue_analytics"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "fk_term_assignments_room"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_occupancy_stats"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "fk_term_assignments_room"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_selection_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_term_assignments_room"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_term_assignments_term"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "court_terms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_term_assignments_term"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "term_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "term_assignments_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "court_parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "term_assignments_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_health_overview"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "term_assignments_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_hierarchy_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "term_assignments_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_issue_analytics"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "term_assignments_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_occupancy_stats"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "term_assignments_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_selection_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "term_assignments_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "term_assignments_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "court_terms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "term_assignments_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "term_details"
            referencedColumns: ["id"]
          },
        ]
      }
      term_personnel: {
        Row: {
          created_at: string | null
          extension: string | null
          floor: string | null
          id: string
          name: string
          phone: string | null
          role: string
          room: string | null
          term_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          extension?: string | null
          floor?: string | null
          id?: string
          name: string
          phone?: string | null
          role: string
          room?: string | null
          term_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          extension?: string | null
          floor?: string | null
          id?: string
          name?: string
          phone?: string | null
          role?: string
          room?: string | null
          term_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "term_personnel_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "court_terms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "term_personnel_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "term_details"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          created_at: string | null
          device_info: Json | null
          id: string
          ip_address: string | null
          last_active_at: string | null
          location: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          device_info?: Json | null
          id?: string
          ip_address?: string | null
          last_active_at?: string | null
          location?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          device_info?: Json | null
          id?: string
          ip_address?: string | null
          last_active_at?: string | null
          location?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      users_metadata: {
        Row: {
          created_at: string | null
          department: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          department?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          department?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      verification_requests: {
        Row: {
          department: string | null
          id: string
          status: string
          submitted_at: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          department?: string | null
          id?: string
          status?: string
          submitted_at?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          department?: string | null
          id?: string
          status?: string
          submitted_at?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      active_relocations_view: {
        Row: {
          building_name: string | null
          created_at: string | null
          created_by: string | null
          end_date: string | null
          floor_name: string | null
          id: string | null
          metadata: Json | null
          notes: string | null
          original_room_id: string | null
          original_room_name: string | null
          original_room_number: string | null
          reason: string | null
          relocation_type:
            | Database["public"]["Enums"]["relocation_type_enum"]
            | null
          schedule_changes: Json | null
          special_instructions: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["relocation_status_enum"] | null
          temporary_room_id: string | null
          temporary_room_name: string | null
          temporary_room_number: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "room_relocations_original_room_id_fkey"
            columns: ["original_room_id"]
            isOneToOne: false
            referencedRelation: "room_health_overview"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "room_relocations_original_room_id_fkey"
            columns: ["original_room_id"]
            isOneToOne: false
            referencedRelation: "room_hierarchy_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_relocations_original_room_id_fkey"
            columns: ["original_room_id"]
            isOneToOne: false
            referencedRelation: "room_issue_analytics"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "room_relocations_original_room_id_fkey"
            columns: ["original_room_id"]
            isOneToOne: false
            referencedRelation: "room_occupancy_stats"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "room_relocations_original_room_id_fkey"
            columns: ["original_room_id"]
            isOneToOne: false
            referencedRelation: "room_selection_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_relocations_original_room_id_fkey"
            columns: ["original_room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_relocations_temporary_room_id_fkey"
            columns: ["temporary_room_id"]
            isOneToOne: false
            referencedRelation: "room_health_overview"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "room_relocations_temporary_room_id_fkey"
            columns: ["temporary_room_id"]
            isOneToOne: false
            referencedRelation: "room_hierarchy_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_relocations_temporary_room_id_fkey"
            columns: ["temporary_room_id"]
            isOneToOne: false
            referencedRelation: "room_issue_analytics"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "room_relocations_temporary_room_id_fkey"
            columns: ["temporary_room_id"]
            isOneToOne: false
            referencedRelation: "room_occupancy_stats"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "room_relocations_temporary_room_id_fkey"
            columns: ["temporary_room_id"]
            isOneToOne: false
            referencedRelation: "room_selection_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_relocations_temporary_room_id_fkey"
            columns: ["temporary_room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      floorplan_report_data: {
        Row: {
          building_name: string | null
          floor_id: string | null
          floor_name: string | null
          floor_number: number | null
          floorplan_data: Json | null
        }
        Relationships: []
      }
      inventory_items_view: {
        Row: {
          category_color:
            | Database["public"]["Enums"]["category_color_enum"]
            | null
          category_description: string | null
          category_icon: string | null
          category_id: string | null
          category_name: string | null
          created_at: string | null
          description: string | null
          id: string | null
          last_inventory_date: string | null
          location_details: string | null
          minimum_quantity: number | null
          name: string | null
          notes: string | null
          preferred_vendor: string | null
          quantity: number | null
          reorder_point: number | null
          status: string | null
          storage_room_id: string | null
          unit: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "inventory_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      issue_report_details: {
        Row: {
          assignee_email: string | null
          assignee_first_name: string | null
          assignee_last_name: string | null
          building_name: string | null
          created_at: string | null
          creator_email: string | null
          creator_first_name: string | null
          creator_last_name: string | null
          description: string | null
          due_date: string | null
          floor_name: string | null
          id: string | null
          impact_level: string | null
          lighting_details: Json | null
          maintenance_requirements: Json | null
          photos: string[] | null
          priority: Database["public"]["Enums"]["issue_priority_enum"] | null
          recurring_pattern: Json | null
          resolution_date: string | null
          resolution_notes: string | null
          resolution_type:
            | Database["public"]["Enums"]["issue_resolution_type"]
            | null
          resolved_by: string | null
          resolver_email: string | null
          resolver_first_name: string | null
          resolver_last_name: string | null
          room_name: string | null
          room_number: string | null
          status: Database["public"]["Enums"]["issue_status_enum"] | null
          tags: string[] | null
          timeline_events: Json | null
          title: string | null
          type: Database["public"]["Enums"]["standardized_issue_type"] | null
          updated_at: string | null
        }
        Relationships: []
      }
      key_assignment_stats: {
        Row: {
          current_assignments: number | null
          current_holders: Json | null
          current_spare_assignments: number | null
          key_id: string | null
          key_name: string | null
          status: Database["public"]["Enums"]["key_status_enum"] | null
          type: Database["public"]["Enums"]["key_type_enum"] | null
        }
        Relationships: []
      }
      key_assignments_view: {
        Row: {
          active_assignments: number | null
          key_id: string | null
          lost_count: number | null
          returned_assignments: number | null
        }
        Relationships: []
      }
      key_audit_logs_view: {
        Row: {
          action_type: string | null
          changes: Json | null
          created_at: string | null
          details: Json | null
          email: string | null
          id: string | null
          key_id: string | null
          metadata: Json | null
          performed_by: string | null
          username: string | null
        }
        Relationships: [
          {
            foreignKeyName: "key_audit_logs_key_id_fkey"
            columns: ["key_id"]
            isOneToOne: false
            referencedRelation: "key_assignment_stats"
            referencedColumns: ["key_id"]
          },
          {
            foreignKeyName: "key_audit_logs_key_id_fkey"
            columns: ["key_id"]
            isOneToOne: false
            referencedRelation: "key_assignments_view"
            referencedColumns: ["key_id"]
          },
          {
            foreignKeyName: "key_audit_logs_key_id_fkey"
            columns: ["key_id"]
            isOneToOne: false
            referencedRelation: "key_door_locations"
            referencedColumns: ["key_id"]
          },
          {
            foreignKeyName: "key_audit_logs_key_id_fkey"
            columns: ["key_id"]
            isOneToOne: false
            referencedRelation: "key_inventory_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "key_audit_logs_key_id_fkey"
            columns: ["key_id"]
            isOneToOne: false
            referencedRelation: "keys"
            referencedColumns: ["id"]
          },
        ]
      }
      key_door_locations: {
        Row: {
          building_id: string | null
          building_name: string | null
          door_id: string | null
          door_name: string | null
          floor_id: string | null
          floor_name: string | null
          id: string | null
          key_id: string | null
          key_name: string | null
        }
        Relationships: []
      }
      key_inventory_stats: {
        Row: {
          assigned_keys: number | null
          available_stock: number | null
          lost_keys: number | null
          total_keys: number | null
          total_stock: number | null
          type: Database["public"]["Enums"]["key_type_enum"] | null
        }
        Relationships: []
      }
      key_inventory_view: {
        Row: {
          active_assignments: number | null
          available_quantity: number | null
          created_at: string | null
          id: string | null
          is_passkey: boolean | null
          key_scope: string | null
          location_data: Json | null
          lost_count: number | null
          name: string | null
          properties: Json | null
          returned_assignments: number | null
          status: Database["public"]["Enums"]["key_status_enum"] | null
          total_quantity: number | null
          type: Database["public"]["Enums"]["key_type_enum"] | null
          updated_at: string | null
        }
        Relationships: []
      }
      key_orders_view: {
        Row: {
          expected_delivery_date: string | null
          id: string | null
          key_id: string | null
          key_name: string | null
          key_type: Database["public"]["Enums"]["key_type_enum"] | null
          notes: string | null
          ordered_at: string | null
          quantity: number | null
          received_at: string | null
          recipient_department: string | null
          recipient_id: string | null
          recipient_name: string | null
          requestor_email: string | null
          requestor_id: string | null
          requestor_name: string | null
          status: string | null
        }
        Relationships: [
          {
            foreignKeyName: "key_orders_key_id_fkey"
            columns: ["key_id"]
            isOneToOne: false
            referencedRelation: "key_assignment_stats"
            referencedColumns: ["key_id"]
          },
          {
            foreignKeyName: "key_orders_key_id_fkey"
            columns: ["key_id"]
            isOneToOne: false
            referencedRelation: "key_assignments_view"
            referencedColumns: ["key_id"]
          },
          {
            foreignKeyName: "key_orders_key_id_fkey"
            columns: ["key_id"]
            isOneToOne: false
            referencedRelation: "key_door_locations"
            referencedColumns: ["key_id"]
          },
          {
            foreignKeyName: "key_orders_key_id_fkey"
            columns: ["key_id"]
            isOneToOne: false
            referencedRelation: "key_inventory_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "key_orders_key_id_fkey"
            columns: ["key_id"]
            isOneToOne: false
            referencedRelation: "keys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "key_orders_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "occupant_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "key_orders_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "occupants"
            referencedColumns: ["id"]
          },
        ]
      }
      lighting_assignments: {
        Row: {
          building_id: string | null
          building_name: string | null
          fixture_id: string | null
          fixture_name: string | null
          fixture_type:
            | Database["public"]["Enums"]["light_fixture_type_enum"]
            | null
          floor_id: string | null
          floor_name: string | null
          location_id: string | null
          location_name: string | null
          location_type: string | null
          notes: string | null
          position: Database["public"]["Enums"]["lighting_position_enum"] | null
          sequence_number: number | null
          status: Database["public"]["Enums"]["light_status_enum"] | null
        }
        Relationships: [
          {
            foreignKeyName: "lighting_fixtures_floor_id_fkey"
            columns: ["floor_id"]
            isOneToOne: false
            referencedRelation: "floorplan_report_data"
            referencedColumns: ["floor_id"]
          },
          {
            foreignKeyName: "lighting_fixtures_floor_id_fkey"
            columns: ["floor_id"]
            isOneToOne: false
            referencedRelation: "floors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lighting_fixtures_floor_id_fkey"
            columns: ["floor_id"]
            isOneToOne: false
            referencedRelation: "key_door_locations"
            referencedColumns: ["floor_id"]
          },
        ]
      }
      lighting_fixture_stats: {
        Row: {
          functional_count: number | null
          needs_maintenance: number | null
          needs_replacement: number | null
          non_functional: number | null
          total: number | null
          type: Database["public"]["Enums"]["light_fixture_type_enum"] | null
        }
        Relationships: []
      }
      lighting_maintenance_view: {
        Row: {
          assigned_technician: string | null
          completed_by: string | null
          completed_by_name: string | null
          completed_date: string | null
          completion_notes: string | null
          created_at: string | null
          estimated_duration: unknown | null
          fixture_id: string | null
          fixture_name: string | null
          fixture_status:
            | Database["public"]["Enums"]["light_status_enum"]
            | null
          fixture_type:
            | Database["public"]["Enums"]["light_fixture_type_enum"]
            | null
          id: string | null
          maintenance_type: string | null
          notes: string | null
          parts_required: Json | null
          priority_level: string | null
          reminder_sent: boolean | null
          scheduled_date: string | null
          status: string | null
          technician_name: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lighting_maintenance_schedules_assigned_technician_fkey"
            columns: ["assigned_technician"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lighting_maintenance_schedules_assigned_technician_fkey"
            columns: ["assigned_technician"]
            isOneToOne: false
            referencedRelation: "user_verification_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lighting_maintenance_schedules_assigned_technician_fkey"
            columns: ["assigned_technician"]
            isOneToOne: false
            referencedRelation: "user_verification_view"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "lighting_maintenance_schedules_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lighting_maintenance_schedules_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "user_verification_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lighting_maintenance_schedules_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "user_verification_view"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "lighting_maintenance_schedules_fixture_id_fkey"
            columns: ["fixture_id"]
            isOneToOne: false
            referencedRelation: "lighting_assignments"
            referencedColumns: ["fixture_id"]
          },
          {
            foreignKeyName: "lighting_maintenance_schedules_fixture_id_fkey"
            columns: ["fixture_id"]
            isOneToOne: false
            referencedRelation: "lighting_fixtures"
            referencedColumns: ["id"]
          },
        ]
      }
      low_stock_items: {
        Row: {
          category_id: string | null
          category_name: string | null
          id: string | null
          minimum_quantity: number | null
          name: string | null
          quantity: number | null
          room_id: string | null
          room_name: string | null
          storage_location: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "inventory_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_summary: {
        Row: {
          fixtures_needing_maintenance: number | null
          hallways_under_maintenance: number | null
          next_maintenance_due: string | null
          non_functional_fixtures: number | null
          rooms_under_maintenance: number | null
        }
        Relationships: []
      }
      new_spaces: {
        Row: {
          floor_id: string | null
          id: string | null
          name: string | null
          room_number: string | null
          status: Database["public"]["Enums"]["status_enum"] | null
          type: string | null
        }
        Relationships: []
      }
      occupant_details: {
        Row: {
          access_level: string | null
          assigned_resources: Json | null
          created_at: string | null
          department: string | null
          email: string | null
          emergency_contact: Json | null
          employment_type: string | null
          end_date: string | null
          first_name: string | null
          hire_date: string | null
          id: string | null
          last_name: string | null
          notes: string | null
          phone: string | null
          room_id: string | null
          rooms: Json | null
          start_date: string | null
          status: Database["public"]["Enums"]["occupant_status_enum"] | null
          supervisor_id: string | null
          termination_date: string | null
          title: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "occupants_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_health_overview"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "occupants_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_hierarchy_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "occupants_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_issue_analytics"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "occupants_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_occupancy_stats"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "occupants_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_selection_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "occupants_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "occupants_supervisor_id_fkey"
            columns: ["supervisor_id"]
            isOneToOne: false
            referencedRelation: "occupant_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "occupants_supervisor_id_fkey"
            columns: ["supervisor_id"]
            isOneToOne: false
            referencedRelation: "occupants"
            referencedColumns: ["id"]
          },
        ]
      }
      room_assignments_view: {
        Row: {
          assignment_type: string | null
          building_name: string | null
          floor_name: string | null
          id: string | null
          is_primary: boolean | null
          occupant_id: string | null
          related_rooms: Json | null
          room_id: string | null
          room_name: string | null
          room_type: Database["public"]["Enums"]["room_type_enum"] | null
          schedule: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_occupant"
            columns: ["occupant_id"]
            isOneToOne: false
            referencedRelation: "occupant_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_occupant"
            columns: ["occupant_id"]
            isOneToOne: false
            referencedRelation: "occupants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_occupant_room_assignments_occupant"
            columns: ["occupant_id"]
            isOneToOne: false
            referencedRelation: "occupant_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_occupant_room_assignments_occupant"
            columns: ["occupant_id"]
            isOneToOne: false
            referencedRelation: "occupants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_occupant_room_assignments_room"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_health_overview"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "fk_occupant_room_assignments_room"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_hierarchy_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_occupant_room_assignments_room"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_issue_analytics"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "fk_occupant_room_assignments_room"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_occupancy_stats"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "fk_occupant_room_assignments_room"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_selection_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_occupant_room_assignments_room"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_room"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_health_overview"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "fk_room"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_hierarchy_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_room"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_issue_analytics"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "fk_room"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_occupancy_stats"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "fk_room"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_selection_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_room"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "occupant_room_assignments_new_occupant_id_fkey"
            columns: ["occupant_id"]
            isOneToOne: false
            referencedRelation: "occupant_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "occupant_room_assignments_new_occupant_id_fkey"
            columns: ["occupant_id"]
            isOneToOne: false
            referencedRelation: "occupants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "occupant_room_assignments_new_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_health_overview"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "occupant_room_assignments_new_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_hierarchy_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "occupant_room_assignments_new_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_issue_analytics"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "occupant_room_assignments_new_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_occupancy_stats"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "occupant_room_assignments_new_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_selection_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "occupant_room_assignments_new_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "occupant_room_assignments_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_health_overview"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "occupant_room_assignments_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_hierarchy_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "occupant_room_assignments_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_issue_analytics"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "occupant_room_assignments_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_occupancy_stats"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "occupant_room_assignments_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_selection_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "occupant_room_assignments_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      room_health_overview: {
        Row: {
          active_critical_issues: number | null
          active_recurring_issues: number | null
          critical_issues_count: number | null
          health_score: number | null
          maintenance_compliance_score: number | null
          next_maintenance_due: string | null
          open_issues_count: number | null
          room_id: string | null
          room_name: string | null
          room_number: string | null
        }
        Relationships: []
      }
      room_hierarchy_view: {
        Row: {
          child_count: number | null
          floor_id: string | null
          id: string | null
          name: string | null
          parent_name: string | null
          parent_room_id: string | null
          parent_room_number: string | null
          room_number: string | null
          room_role: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rooms_floor_id_fkey"
            columns: ["floor_id"]
            isOneToOne: false
            referencedRelation: "floorplan_report_data"
            referencedColumns: ["floor_id"]
          },
          {
            foreignKeyName: "rooms_floor_id_fkey"
            columns: ["floor_id"]
            isOneToOne: false
            referencedRelation: "floors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rooms_floor_id_fkey"
            columns: ["floor_id"]
            isOneToOne: false
            referencedRelation: "key_door_locations"
            referencedColumns: ["floor_id"]
          },
          {
            foreignKeyName: "rooms_parent_room_id_fkey"
            columns: ["parent_room_id"]
            isOneToOne: false
            referencedRelation: "room_health_overview"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "rooms_parent_room_id_fkey"
            columns: ["parent_room_id"]
            isOneToOne: false
            referencedRelation: "room_hierarchy_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rooms_parent_room_id_fkey"
            columns: ["parent_room_id"]
            isOneToOne: false
            referencedRelation: "room_issue_analytics"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "rooms_parent_room_id_fkey"
            columns: ["parent_room_id"]
            isOneToOne: false
            referencedRelation: "room_occupancy_stats"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "rooms_parent_room_id_fkey"
            columns: ["parent_room_id"]
            isOneToOne: false
            referencedRelation: "room_selection_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rooms_parent_room_id_fkey"
            columns: ["parent_room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      room_issue_analytics: {
        Row: {
          avg_resolution_hours: number | null
          issue_types: Json | null
          last_issue_date: string | null
          most_common_issue:
            | Database["public"]["Enums"]["standardized_issue_type"]
            | null
          open_issues: number | null
          resolved_issues: number | null
          room_id: string | null
          room_name: string | null
          room_number: string | null
          total_issues: number | null
        }
        Relationships: []
      }
      room_occupancy_stats: {
        Row: {
          current_occupants: number | null
          departments: string | null
          floor_id: string | null
          occupancy_status: string | null
          room_id: string | null
          room_name: string | null
          room_number: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rooms_floor_id_fkey"
            columns: ["floor_id"]
            isOneToOne: false
            referencedRelation: "floorplan_report_data"
            referencedColumns: ["floor_id"]
          },
          {
            foreignKeyName: "rooms_floor_id_fkey"
            columns: ["floor_id"]
            isOneToOne: false
            referencedRelation: "floors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rooms_floor_id_fkey"
            columns: ["floor_id"]
            isOneToOne: false
            referencedRelation: "key_door_locations"
            referencedColumns: ["floor_id"]
          },
        ]
      }
      room_selection_details: {
        Row: {
          building_name: string | null
          current_assignments: number | null
          current_function: string | null
          current_occupancy: number | null
          floor_name: string | null
          has_upcoming_relocations: boolean | null
          id: string | null
          name: string | null
          room_number: string | null
          room_type: Database["public"]["Enums"]["room_type_enum"] | null
        }
        Relationships: []
      }
      storage_room_inventory: {
        Row: {
          category_name: string | null
          item_id: string | null
          item_name: string | null
          minimum_quantity: number | null
          quantity: number | null
          room_id: string | null
          room_name: string | null
          room_number: string | null
          status: string | null
        }
        Relationships: []
      }
      term_details: {
        Row: {
          assignment_count: number | null
          assignments: Json | null
          created_at: string | null
          created_by: string | null
          description: string | null
          end_date: string | null
          id: string | null
          location: string | null
          metadata: Json | null
          pdf_url: string | null
          start_date: string | null
          status: string | null
          term_name: string | null
          term_number: string | null
          updated_at: string | null
        }
        Insert: {
          assignment_count?: never
          assignments?: never
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string | null
          location?: string | null
          metadata?: Json | null
          pdf_url?: string | null
          start_date?: string | null
          status?: string | null
          term_name?: string | null
          term_number?: string | null
          updated_at?: string | null
        }
        Update: {
          assignment_count?: never
          assignments?: never
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string | null
          location?: string | null
          metadata?: Json | null
          pdf_url?: string | null
          start_date?: string | null
          status?: string | null
          term_name?: string | null
          term_number?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_activity_history: {
        Row: {
          action: string | null
          activity_type: string | null
          created_at: string | null
          id: string | null
          metadata: Json | null
          performed_by: string | null
        }
        Relationships: []
      }
      user_verification_view: {
        Row: {
          created_at: string | null
          department_id: string | null
          department_name: string | null
          email: string | null
          first_name: string | null
          id: string | null
          last_name: string | null
          profile_id: string | null
          updated_at: string | null
          user_role: Database["public"]["Enums"]["user_role"] | null
          verification_status:
            | Database["public"]["Enums"]["verification_status_enum"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      add_admin_user: {
        Args: { email_to_promote: string }
        Returns: undefined
      }
      approve_user: {
        Args: { user_id: string }
        Returns: undefined
      }
      assign_key_if_available: {
        Args:
          | { key_id: string; occupant_id: string }
          | { key_id: string; occupant_id: string; is_spare?: boolean }
        Returns: Json
      }
      begin_transaction: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      check_admin_status: {
        Args: { user_id: string }
        Returns: boolean
      }
      check_relocation_conflicts: {
        Args: { p_room_id: string; p_start_date: string; p_end_date: string }
        Returns: {
          conflicting_relocation_id: string
          conflict_type: string
          conflict_start_date: string
          conflict_end_date: string
        }[]
      }
      cleanup_old_backups: {
        Args: { policy_id: string }
        Returns: undefined
      }
      commit_transaction: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      complete_backup_restoration: {
        Args: { restoration_id: string; success: boolean; error_msg?: string }
        Returns: undefined
      }
      create_assignment_batch: {
        Args: { creator_id: string; batch_metadata: Json }
        Returns: string
      }
      create_key_order: {
        Args: {
          p_key_id: string
          p_quantity: number
          p_requestor_id: string
          p_recipient_id?: string
          p_expected_delivery_date?: string
          p_notes?: string
        }
        Returns: string
      }
      find_doors_by_room_number: {
        Args: { p_room_number: string }
        Returns: {
          id: string
          label: string
          status: string
          room_type: string
        }[]
      }
      get_child_rooms: {
        Args: { parent_room_id: string }
        Returns: {
          child_id: string
          child_name: string
          child_room_number: string
          depth: number
        }[]
      }
      get_connected_objects: {
        Args: { p_object_id: string }
        Returns: {
          id: string
          type: Database["public"]["Enums"]["floor_plan_object_type"]
          label: string
          connection_type: string
        }[]
      }
      get_door_room_details: {
        Args: { door_id: string }
        Returns: {
          room_type: string
          room_number: string
          status: string
        }[]
      }
      get_door_status: {
        Args: { door_id: string }
        Returns: string
      }
      get_next_lighting_sequence: {
        Args: { p_space_id: string }
        Returns: number
      }
      get_parent_chain: {
        Args: { child_room_id: string }
        Returns: {
          parent_id: string
          parent_name: string
          parent_room_number: string
          level: number
        }[]
      }
      get_user_role: {
        Args: { user_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      increment_key_quantity: {
        Args: { key_id: string }
        Returns: number
      }
      initialize_door_properties: {
        Args: {
          p_room_number?: string
          p_room_type?: string
          p_status?: string
        }
        Returns: Json
      }
      is_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
      is_courtroom: {
        Args: { room_type: string }
        Returns: boolean
      }
      migrate_spaces_data: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      process_key_order_receipt: {
        Args: {
          p_order_id: string
          p_quantity_received: number
          p_performed_by: string
        }
        Returns: undefined
      }
      rollback_transaction: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      safely_delete_key: {
        Args: { key_id_to_delete: string }
        Returns: undefined
      }
      safely_delete_relocation: {
        Args: { relocation_id_param: string }
        Returns: undefined
      }
      safely_update_inventory_quantity: {
        Args: {
          p_item_id: string
          p_new_quantity: number
          p_performed_by?: string
          p_notes?: string
          p_status?: string
        }
        Returns: undefined
      }
      update_door_properties: {
        Args: {
          p_door_id: string
          p_room_number?: string
          p_room_type?: string
          p_status?: string
        }
        Returns: undefined
      }
      validate_floor_plan_connection: {
        Args: { source_id: string; target_id: string }
        Returns: boolean
      }
    }
    Enums: {
      access_level_enum: "none" | "read" | "write" | "admin"
      agency_type: "DCAS" | "OCA" | "EMPLOYEE"
      category_color_enum:
        | "red"
        | "blue"
        | "green"
        | "yellow"
        | "purple"
        | "orange"
        | "pink"
        | "gray"
      connection_direction_enum:
        | "north"
        | "south"
        | "east"
        | "west"
        | "adjacent"
        | "left_of_hallway"
        | "right_of_hallway"
      connection_position_enum: "start" | "middle" | "end" | "adjacent"
      connection_status_enum: "active" | "inactive" | "under_maintenance"
      connection_type_enum: "door" | "direct" | "secured"
      department_enum:
        | "Administration"
        | "Court Operations"
        | "Facilities Management"
        | "Information Technology"
        | "Security"
        | "Legal Services"
        | "Human Resources"
        | "Finance"
      direction_enum: "north" | "south" | "east" | "west" | "adjacent"
      door_closer_status_enum:
        | "functioning"
        | "needs_adjustment"
        | "not_working"
      door_hardware_status_enum:
        | "functional"
        | "needs_repair"
        | "needs_replacement"
      door_type_enum: "standard" | "emergency" | "secure" | "maintenance"
      emergency_route_enum: "primary" | "secondary" | "not_designated"
      floor_plan_mode_enum: "edit" | "view"
      floor_plan_object_type: "room" | "door" | "hallway"
      hallway_accessibility_enum:
        | "fully_accessible"
        | "limited_access"
        | "stairs_only"
        | "restricted"
      hallway_section_enum: "left_wing" | "right_wing" | "connector"
      hallway_traffic_flow_enum: "one_way" | "two_way" | "restricted"
      hallway_type_enum: "public_main" | "private" | "private_main"
      issue_priority_enum: "low" | "medium" | "high"
      issue_resolution_type:
        | "fixed"
        | "replaced"
        | "maintenance_performed"
        | "no_action_needed"
        | "deferred"
        | "other"
      issue_status_enum: "open" | "in_progress" | "resolved"
      key_status_enum: "available" | "assigned" | "lost" | "decommissioned"
      key_type_enum: "physical_key" | "elevator_pass" | "room_key"
      layer_type_enum: "rooms" | "doors" | "grid" | "hallways" | "annotations"
      light_fixture_type_enum: "standard" | "emergency" | "motion_sensor"
      light_position_enum:
        | "front"
        | "middle"
        | "back"
        | "left"
        | "right"
        | "center"
      light_status_enum:
        | "functional"
        | "maintenance_needed"
        | "non_functional"
        | "pending_maintenance"
        | "scheduled_replacement"
      lighting_fixture_type_enum: "standard" | "emergency" | "motion_sensor"
      lighting_issue_type_enum:
        | "Lighting_Ballast"
        | "Lighting_Replacement"
        | "Lighting_Emergency"
        | "Lighting_Sensor"
        | "Lighting_Control"
      lighting_position_enum: "ceiling" | "wall" | "floor" | "desk" | "recessed"
      lighting_status:
        | "functional"
        | "maintenance_needed"
        | "non_functional"
        | "pending_maintenance"
        | "scheduled_replacement"
      lighting_status_enum:
        | "functional"
        | "maintenance_needed"
        | "non_functional"
        | "pending_maintenance"
        | "scheduled_replacement"
      lighting_technology: "LED" | "Fluorescent" | "Bulb"
      lighting_technology_enum: "LED" | "Fluorescent" | "Bulb"
      notification_preference: "all" | "important_only" | "none"
      occupant_status_change_reason_enum:
        | "new_hire"
        | "voluntary_leave"
        | "involuntary_leave"
        | "temporary_leave"
        | "returned_from_leave"
        | "retirement"
        | "other"
      occupant_status_enum: "active" | "inactive" | "on_leave" | "terminated"
      relocation_status_enum: "scheduled" | "active" | "completed" | "cancelled"
      relocation_type_enum:
        | "construction"
        | "maintenance"
        | "emergency"
        | "other"
      return_reason_enum: "normal_return" | "lost" | "damaged" | "other"
      room_type_enum:
        | "courtroom"
        | "judges_chambers"
        | "jury_room"
        | "conference_room"
        | "office"
        | "filing_room"
        | "male_locker_room"
        | "female_locker_room"
        | "robing_room"
        | "stake_holder"
        | "records_room"
        | "administrative_office"
        | "break_room"
        | "it_room"
        | "utility_room"
        | "laboratory"
        | "conference"
        | "chamber"
      security_level_enum: "standard" | "restricted" | "high_security"
      standardized_issue_type:
        | "ACCESS_REQUEST"
        | "BUILDING_SYSTEMS"
        | "CEILING"
        | "CLEANING_REQUEST"
        | "CLIMATE_CONTROL"
        | "DOOR"
        | "ELECTRICAL_NEEDS"
        | "EMERGENCY"
        | "EXTERIOR_FACADE"
        | "FLAGPOLE_FLAG"
        | "FLOORING"
        | "GENERAL_REQUESTS"
        | "LEAK"
        | "LIGHTING"
        | "LOCK"
        | "PLUMBING_NEEDS"
        | "RESTROOM_REPAIR"
        | "SIGNAGE"
        | "WINDOW"
      status_enum: "active" | "inactive" | "under_maintenance"
      term_status_enum: "active" | "upcoming" | "expired"
      user_role: "admin" | "standard"
      verification_status_enum: "pending" | "verified" | "rejected"
      zone_type_enum: "general" | "emergency" | "restricted"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      access_level_enum: ["none", "read", "write", "admin"],
      agency_type: ["DCAS", "OCA", "EMPLOYEE"],
      category_color_enum: [
        "red",
        "blue",
        "green",
        "yellow",
        "purple",
        "orange",
        "pink",
        "gray",
      ],
      connection_direction_enum: [
        "north",
        "south",
        "east",
        "west",
        "adjacent",
        "left_of_hallway",
        "right_of_hallway",
      ],
      connection_position_enum: ["start", "middle", "end", "adjacent"],
      connection_status_enum: ["active", "inactive", "under_maintenance"],
      connection_type_enum: ["door", "direct", "secured"],
      department_enum: [
        "Administration",
        "Court Operations",
        "Facilities Management",
        "Information Technology",
        "Security",
        "Legal Services",
        "Human Resources",
        "Finance",
      ],
      direction_enum: ["north", "south", "east", "west", "adjacent"],
      door_closer_status_enum: [
        "functioning",
        "needs_adjustment",
        "not_working",
      ],
      door_hardware_status_enum: [
        "functional",
        "needs_repair",
        "needs_replacement",
      ],
      door_type_enum: ["standard", "emergency", "secure", "maintenance"],
      emergency_route_enum: ["primary", "secondary", "not_designated"],
      floor_plan_mode_enum: ["edit", "view"],
      floor_plan_object_type: ["room", "door", "hallway"],
      hallway_accessibility_enum: [
        "fully_accessible",
        "limited_access",
        "stairs_only",
        "restricted",
      ],
      hallway_section_enum: ["left_wing", "right_wing", "connector"],
      hallway_traffic_flow_enum: ["one_way", "two_way", "restricted"],
      hallway_type_enum: ["public_main", "private", "private_main"],
      issue_priority_enum: ["low", "medium", "high"],
      issue_resolution_type: [
        "fixed",
        "replaced",
        "maintenance_performed",
        "no_action_needed",
        "deferred",
        "other",
      ],
      issue_status_enum: ["open", "in_progress", "resolved"],
      key_status_enum: ["available", "assigned", "lost", "decommissioned"],
      key_type_enum: ["physical_key", "elevator_pass", "room_key"],
      layer_type_enum: ["rooms", "doors", "grid", "hallways", "annotations"],
      light_fixture_type_enum: ["standard", "emergency", "motion_sensor"],
      light_position_enum: [
        "front",
        "middle",
        "back",
        "left",
        "right",
        "center",
      ],
      light_status_enum: [
        "functional",
        "maintenance_needed",
        "non_functional",
        "pending_maintenance",
        "scheduled_replacement",
      ],
      lighting_fixture_type_enum: ["standard", "emergency", "motion_sensor"],
      lighting_issue_type_enum: [
        "Lighting_Ballast",
        "Lighting_Replacement",
        "Lighting_Emergency",
        "Lighting_Sensor",
        "Lighting_Control",
      ],
      lighting_position_enum: ["ceiling", "wall", "floor", "desk", "recessed"],
      lighting_status: [
        "functional",
        "maintenance_needed",
        "non_functional",
        "pending_maintenance",
        "scheduled_replacement",
      ],
      lighting_status_enum: [
        "functional",
        "maintenance_needed",
        "non_functional",
        "pending_maintenance",
        "scheduled_replacement",
      ],
      lighting_technology: ["LED", "Fluorescent", "Bulb"],
      lighting_technology_enum: ["LED", "Fluorescent", "Bulb"],
      notification_preference: ["all", "important_only", "none"],
      occupant_status_change_reason_enum: [
        "new_hire",
        "voluntary_leave",
        "involuntary_leave",
        "temporary_leave",
        "returned_from_leave",
        "retirement",
        "other",
      ],
      occupant_status_enum: ["active", "inactive", "on_leave", "terminated"],
      relocation_status_enum: ["scheduled", "active", "completed", "cancelled"],
      relocation_type_enum: [
        "construction",
        "maintenance",
        "emergency",
        "other",
      ],
      return_reason_enum: ["normal_return", "lost", "damaged", "other"],
      room_type_enum: [
        "courtroom",
        "judges_chambers",
        "jury_room",
        "conference_room",
        "office",
        "filing_room",
        "male_locker_room",
        "female_locker_room",
        "robing_room",
        "stake_holder",
        "records_room",
        "administrative_office",
        "break_room",
        "it_room",
        "utility_room",
        "laboratory",
        "conference",
        "chamber",
      ],
      security_level_enum: ["standard", "restricted", "high_security"],
      standardized_issue_type: [
        "ACCESS_REQUEST",
        "BUILDING_SYSTEMS",
        "CEILING",
        "CLEANING_REQUEST",
        "CLIMATE_CONTROL",
        "DOOR",
        "ELECTRICAL_NEEDS",
        "EMERGENCY",
        "EXTERIOR_FACADE",
        "FLAGPOLE_FLAG",
        "FLOORING",
        "GENERAL_REQUESTS",
        "LEAK",
        "LIGHTING",
        "LOCK",
        "PLUMBING_NEEDS",
        "RESTROOM_REPAIR",
        "SIGNAGE",
        "WINDOW",
      ],
      status_enum: ["active", "inactive", "under_maintenance"],
      term_status_enum: ["active", "upcoming", "expired"],
      user_role: ["admin", "standard"],
      verification_status_enum: ["pending", "verified", "rejected"],
      zone_type_enum: ["general", "emergency", "restricted"],
    },
  },
} as const
