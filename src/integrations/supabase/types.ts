export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
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
            foreignKeyName: "access_delegation_delegator_id_fkey"
            columns: ["delegator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_notifications: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          message: string
          metadata: Json | null
          notification_type: string
          read_by: string[] | null
          related_id: string | null
          related_table: string | null
          title: string
          urgency: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          message: string
          metadata?: Json | null
          notification_type: string
          read_by?: string[] | null
          related_id?: string | null
          related_table?: string | null
          title: string
          urgency?: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          notification_type?: string
          read_by?: string[] | null
          related_id?: string | null
          related_table?: string | null
          title?: string
          urgency?: string
        }
        Relationships: []
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
      audit_sensitive_access: {
        Row: {
          action: string
          actor_id: string | null
          actor_role: string | null
          context: Json | null
          headers: Json | null
          id: number
          occurred_at: string
          request_ip: string | null
          target_id_text: string | null
          target_id_uuid: string | null
          target_table: string
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_role?: string | null
          context?: Json | null
          headers?: Json | null
          id?: number
          occurred_at?: string
          request_ip?: string | null
          target_id_text?: string | null
          target_id_uuid?: string | null
          target_table: string
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_role?: string | null
          context?: Json | null
          headers?: Json | null
          id?: number
          occurred_at?: string
          request_ip?: string | null
          target_id_text?: string | null
          target_id_uuid?: string | null
          target_table?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      auth_rate_limits: {
        Row: {
          attempt_type: string
          attempts: number | null
          blocked_until: string | null
          created_at: string | null
          first_attempt: string | null
          id: string
          identifier: string
          last_attempt: string | null
        }
        Insert: {
          attempt_type: string
          attempts?: number | null
          blocked_until?: string | null
          created_at?: string | null
          first_attempt?: string | null
          id?: string
          identifier: string
          last_attempt?: string | null
        }
        Update: {
          attempt_type?: string
          attempts?: number | null
          blocked_until?: string | null
          created_at?: string | null
          first_attempt?: string | null
          id?: string
          identifier?: string
          last_attempt?: string | null
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
          created_by: string
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
          created_by: string
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
          created_by?: string
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
          created_by: string
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
          created_by: string
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
          created_by?: string
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
      clerk_assignments: {
        Row: {
          clerk_id: string
          room_id: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          clerk_id: string
          room_id: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          clerk_id?: string
          room_id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clerk_assignments_clerk_id_fkey"
            columns: ["clerk_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clerk_assignments_clerk_id_fkey"
            columns: ["clerk_id"]
            isOneToOne: false
            referencedRelation: "staff_out_today"
            referencedColumns: ["staff_id"]
          },
        ]
      }
      court_activity_log: {
        Row: {
          actor_id: string | null
          created_at: string | null
          from_room_id: string | null
          id: string
          payload: Json | null
          to_room_id: string | null
          type: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string | null
          from_room_id?: string | null
          id?: string
          payload?: Json | null
          to_room_id?: string | null
          type: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string | null
          from_room_id?: string | null
          id?: string
          payload?: Json | null
          to_room_id?: string | null
          type?: string
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
          justice: string | null
          part: string | null
          part_details: Json | null
          room_id: string | null
          room_number: string
          sergeant: string | null
          sort_order: number | null
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
          justice?: string | null
          part?: string | null
          part_details?: Json | null
          room_id?: string | null
          room_number: string
          sergeant?: string | null
          sort_order?: number | null
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
          justice?: string | null
          part?: string | null
          part_details?: Json | null
          room_id?: string | null
          room_number?: string
          sergeant?: string | null
          sort_order?: number | null
          tel?: string | null
          term_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
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
      court_attendance: {
        Row: {
          clerks_present_count: number
          clerks_present_names: string[] | null
          judge_present: boolean
          last_update_by: string | null
          room_id: string
          updated_at: string | null
        }
        Insert: {
          clerks_present_count?: number
          clerks_present_names?: string[] | null
          judge_present?: boolean
          last_update_by?: string | null
          room_id: string
          updated_at?: string | null
        }
        Update: {
          clerks_present_count?: number
          clerks_present_names?: string[] | null
          judge_present?: boolean
          last_update_by?: string | null
          room_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "court_attendance_room_fkey"
            columns: ["room_id"]
            isOneToOne: true
            referencedRelation: "court_rooms"
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
      court_room_status: {
        Row: {
          note: string | null
          room_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          note?: string | null
          room_id: string
          status: string
          updated_at?: string | null
        }
        Update: {
          note?: string | null
          room_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "court_room_status_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: true
            referencedRelation: "court_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      court_rooms: {
        Row: {
          accessibility_features: Json | null
          courtroom_number: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          juror_capacity: number | null
          maintenance_end_date: string | null
          maintenance_notes: string | null
          maintenance_start_date: string | null
          maintenance_status: string | null
          notes: string | null
          operational_status: string | null
          room_id: string
          room_number: string
          spectator_capacity: number | null
          temporary_location: string | null
          updated_at: string | null
        }
        Insert: {
          accessibility_features?: Json | null
          courtroom_number?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          juror_capacity?: number | null
          maintenance_end_date?: string | null
          maintenance_notes?: string | null
          maintenance_start_date?: string | null
          maintenance_status?: string | null
          notes?: string | null
          operational_status?: string | null
          room_id: string
          room_number: string
          spectator_capacity?: number | null
          temporary_location?: string | null
          updated_at?: string | null
        }
        Update: {
          accessibility_features?: Json | null
          courtroom_number?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          juror_capacity?: number | null
          maintenance_end_date?: string | null
          maintenance_notes?: string | null
          maintenance_start_date?: string | null
          maintenance_status?: string | null
          notes?: string | null
          operational_status?: string | null
          room_id?: string
          room_number?: string
          spectator_capacity?: number | null
          temporary_location?: string | null
          updated_at?: string | null
        }
        Relationships: [
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
          courtroom_assignments: Json | null
          created_at: string | null
          created_by: string | null
          description: string | null
          end_date: string
          extracted_data: Json | null
          id: string
          location: string
          metadata: Json | null
          notes: string | null
          pdf_url: string | null
          start_date: string
          status: string | null
          term_name: string
          term_number: string
          term_status: string | null
          updated_at: string | null
          uploaded_pdf_path: string | null
        }
        Insert: {
          courtroom_assignments?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date: string
          extracted_data?: Json | null
          id?: string
          location: string
          metadata?: Json | null
          notes?: string | null
          pdf_url?: string | null
          start_date: string
          status?: string | null
          term_name: string
          term_number: string
          term_status?: string | null
          updated_at?: string | null
          uploaded_pdf_path?: string | null
        }
        Update: {
          courtroom_assignments?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string
          extracted_data?: Json | null
          id?: string
          location?: string
          metadata?: Json | null
          notes?: string | null
          pdf_url?: string | null
          start_date?: string
          status?: string | null
          term_name?: string
          term_number?: string
          term_status?: string | null
          updated_at?: string | null
          uploaded_pdf_path?: string | null
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
            referencedRelation: "floors"
            referencedColumns: ["id"]
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
            referencedRelation: "floors"
            referencedColumns: ["id"]
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
            referencedRelation: "floors"
            referencedColumns: ["id"]
          },
        ]
      }
      floor_lighting_metadata: {
        Row: {
          created_at: string | null
          elevator_bank_count: number | null
          floor_id: string
          has_special_north_config: boolean | null
          id: string
          special_config_details: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          elevator_bank_count?: number | null
          floor_id: string
          has_special_north_config?: boolean | null
          id?: string
          special_config_details?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          elevator_bank_count?: number | null
          floor_id?: string
          has_special_north_config?: boolean | null
          id?: string
          special_config_details?: Json | null
          updated_at?: string | null
        }
        Relationships: []
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
            referencedRelation: "floors"
            referencedColumns: ["id"]
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
            referencedRelation: "floors"
            referencedColumns: ["id"]
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
            referencedRelation: "floors"
            referencedColumns: ["id"]
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
            referencedRelation: "floors"
            referencedColumns: ["id"]
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
      hallway_connections: {
        Row: {
          connected_hallway_id: string
          connection_point: Json | null
          created_at: string | null
          id: string
          main_hallway_id: string
          updated_at: string | null
        }
        Insert: {
          connected_hallway_id: string
          connection_point?: Json | null
          created_at?: string | null
          id?: string
          main_hallway_id: string
          updated_at?: string | null
        }
        Update: {
          connected_hallway_id?: string
          connection_point?: Json | null
          created_at?: string | null
          id?: string
          main_hallway_id?: string
          updated_at?: string | null
        }
        Relationships: []
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
            referencedRelation: "floors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hallways_inspected_by_fkey"
            columns: ["inspected_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
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
          sku: string | null
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
          sku?: string | null
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
          sku?: string | null
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
        Relationships: []
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
          assigned_to: string | null
          attachments: string[] | null
          building_id: string | null
          created_at: string
          created_by: string | null
          date_info: string | null
          description: string
          due_date: string | null
          floor_id: string | null
          id: string
          issue_type: string
          location_description: string | null
          notes: string | null
          photos: string[] | null
          priority: Database["public"]["Enums"]["issue_priority_enum"]
          reported_by: string | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          room_id: string | null
          seen: boolean | null
          space_id: string | null
          space_type: string | null
          status: Database["public"]["Enums"]["issue_status_enum"]
          tags: string[] | null
          title: string
          type: string | null
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          attachments?: string[] | null
          building_id?: string | null
          created_at?: string
          created_by?: string | null
          date_info?: string | null
          description: string
          due_date?: string | null
          floor_id?: string | null
          id?: string
          issue_type: string
          location_description?: string | null
          notes?: string | null
          photos?: string[] | null
          priority?: Database["public"]["Enums"]["issue_priority_enum"]
          reported_by?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          room_id?: string | null
          seen?: boolean | null
          space_id?: string | null
          space_type?: string | null
          status?: Database["public"]["Enums"]["issue_status_enum"]
          tags?: string[] | null
          title: string
          type?: string | null
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          attachments?: string[] | null
          building_id?: string | null
          created_at?: string
          created_by?: string | null
          date_info?: string | null
          description?: string
          due_date?: string | null
          floor_id?: string | null
          id?: string
          issue_type?: string
          location_description?: string | null
          notes?: string | null
          photos?: string[] | null
          priority?: Database["public"]["Enums"]["issue_priority_enum"]
          reported_by?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          room_id?: string | null
          seen?: boolean | null
          space_id?: string | null
          space_type?: string | null
          status?: Database["public"]["Enums"]["issue_status_enum"]
          tags?: string[] | null
          title?: string
          type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "issues_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issues_floor_id_fkey"
            columns: ["floor_id"]
            isOneToOne: false
            referencedRelation: "floors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issues_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "unified_spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      item_request_frequency: {
        Row: {
          avg_quantity: number | null
          item_id: string
          last_requested: string | null
          request_count: number | null
          updated_at: string | null
        }
        Insert: {
          avg_quantity?: number | null
          item_id: string
          last_requested?: string | null
          request_count?: number | null
          updated_at?: string | null
        }
        Update: {
          avg_quantity?: number | null
          item_id?: string
          last_requested?: string | null
          request_count?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "item_request_frequency_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: true
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "item_request_frequency_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: true
            referencedRelation: "low_stock_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "item_request_frequency_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: true
            referencedRelation: "storage_room_inventory"
            referencedColumns: ["item_id"]
          },
        ]
      }
      key_assignments: {
        Row: {
          assigned_at: string
          assignment_meta: Json | null
          created_at: string | null
          expected_return_at: string | null
          id: string
          is_elevator_card: boolean | null
          is_spare: boolean | null
          key_id: string | null
          occupant_id: string | null
          recipient_email: string | null
          recipient_name: string | null
          recipient_type: string | null
          return_reason: string | null
          returned_at: string | null
          spare_key_reason: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_at?: string
          assignment_meta?: Json | null
          created_at?: string | null
          expected_return_at?: string | null
          id?: string
          is_elevator_card?: boolean | null
          is_spare?: boolean | null
          key_id?: string | null
          occupant_id?: string | null
          recipient_email?: string | null
          recipient_name?: string | null
          recipient_type?: string | null
          return_reason?: string | null
          returned_at?: string | null
          spare_key_reason?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_at?: string
          assignment_meta?: Json | null
          created_at?: string | null
          expected_return_at?: string | null
          id?: string
          is_elevator_card?: boolean | null
          is_spare?: boolean | null
          key_id?: string | null
          occupant_id?: string | null
          recipient_email?: string | null
          recipient_name?: string | null
          recipient_type?: string | null
          return_reason?: string | null
          returned_at?: string | null
          spare_key_reason?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
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
            referencedRelation: "key_statistics_view"
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
          assignment_id: string | null
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
          assignment_id?: string | null
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
          assignment_id?: string | null
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
            foreignKeyName: "key_audit_logs_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "elevator_pass_assignments"
            referencedColumns: ["assignment_id"]
          },
          {
            foreignKeyName: "key_audit_logs_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "key_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "key_audit_logs_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "key_assignments_view"
            referencedColumns: ["id"]
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
            referencedRelation: "key_statistics_view"
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
            referencedRelation: "key_statistics_view"
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
        ]
      }
      key_orders: {
        Row: {
          cost: number | null
          created_at: string | null
          delivered_at: string | null
          delivered_by: string | null
          delivery_notes: string | null
          estimated_delivery_date: string | null
          expected_delivery_date: string | null
          id: string
          key_id: string | null
          key_name: string | null
          key_type: string | null
          last_status_change: string | null
          notes: string | null
          ordered_at: string | null
          ordered_by: string | null
          priority: string | null
          quantity: number
          received_at: string | null
          received_by: string | null
          recipient_department: string | null
          recipient_id: string | null
          recipient_name: string | null
          request_id: string | null
          requestor_id: string | null
          status: Database["public"]["Enums"]["key_order_status"]
          tracking_number: string | null
          updated_at: string | null
          user_id: string | null
          vendor_order_id: string | null
        }
        Insert: {
          cost?: number | null
          created_at?: string | null
          delivered_at?: string | null
          delivered_by?: string | null
          delivery_notes?: string | null
          estimated_delivery_date?: string | null
          expected_delivery_date?: string | null
          id?: string
          key_id?: string | null
          key_name?: string | null
          key_type?: string | null
          last_status_change?: string | null
          notes?: string | null
          ordered_at?: string | null
          ordered_by?: string | null
          priority?: string | null
          quantity: number
          received_at?: string | null
          received_by?: string | null
          recipient_department?: string | null
          recipient_id?: string | null
          recipient_name?: string | null
          request_id?: string | null
          requestor_id?: string | null
          status?: Database["public"]["Enums"]["key_order_status"]
          tracking_number?: string | null
          updated_at?: string | null
          user_id?: string | null
          vendor_order_id?: string | null
        }
        Update: {
          cost?: number | null
          created_at?: string | null
          delivered_at?: string | null
          delivered_by?: string | null
          delivery_notes?: string | null
          estimated_delivery_date?: string | null
          expected_delivery_date?: string | null
          id?: string
          key_id?: string | null
          key_name?: string | null
          key_type?: string | null
          last_status_change?: string | null
          notes?: string | null
          ordered_at?: string | null
          ordered_by?: string | null
          priority?: string | null
          quantity?: number
          received_at?: string | null
          received_by?: string | null
          recipient_department?: string | null
          recipient_id?: string | null
          recipient_name?: string | null
          request_id?: string | null
          requestor_id?: string | null
          status?: Database["public"]["Enums"]["key_order_status"]
          tracking_number?: string | null
          updated_at?: string | null
          user_id?: string | null
          vendor_order_id?: string | null
        }
        Relationships: [
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
            referencedRelation: "key_statistics_view"
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
          {
            foreignKeyName: "key_orders_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "key_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      key_request_workflow: {
        Row: {
          change_reason: string | null
          changed_by: string | null
          created_at: string
          from_status: string | null
          id: string
          metadata: Json | null
          notes: string | null
          request_id: string
          to_status: string
        }
        Insert: {
          change_reason?: string | null
          changed_by?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          request_id: string
          to_status: string
        }
        Update: {
          change_reason?: string | null
          changed_by?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          request_id?: string
          to_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "key_request_workflow_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "key_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      key_requests: {
        Row: {
          admin_notes: string | null
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          email_notifications_enabled: boolean | null
          emergency_contact: string | null
          fulfillment_notes: string | null
          id: string
          key_id: string | null
          last_status_change: string | null
          quantity: number | null
          reason: string | null
          rejected_at: string | null
          rejected_by: string | null
          rejection_reason: string | null
          request_type: Database["public"]["Enums"]["request_type_enum"] | null
          room_id: string | null
          room_other: string | null
          status: Database["public"]["Enums"]["key_request_status"]
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          email_notifications_enabled?: boolean | null
          emergency_contact?: string | null
          fulfillment_notes?: string | null
          id?: string
          key_id?: string | null
          last_status_change?: string | null
          quantity?: number | null
          reason?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          request_type?: Database["public"]["Enums"]["request_type_enum"] | null
          room_id?: string | null
          room_other?: string | null
          status?: Database["public"]["Enums"]["key_request_status"]
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          email_notifications_enabled?: boolean | null
          emergency_contact?: string | null
          fulfillment_notes?: string | null
          id?: string
          key_id?: string | null
          last_status_change?: string | null
          quantity?: number | null
          reason?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          request_type?: Database["public"]["Enums"]["request_type_enum"] | null
          room_id?: string | null
          room_other?: string | null
          status?: Database["public"]["Enums"]["key_request_status"]
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
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
            referencedRelation: "key_statistics_view"
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
            foreignKeyName: "key_requests_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_selection_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "key_requests_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "key_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
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
            referencedRelation: "key_inventory_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "key_stock_transactions_key_id_fkey"
            columns: ["key_id"]
            isOneToOne: false
            referencedRelation: "key_statistics_view"
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
        ]
      }
      keys: {
        Row: {
          active_assignments: number | null
          available_quantity: number
          captain_office_assigned_date: string | null
          captain_office_copy: boolean | null
          captain_office_notes: string | null
          created_at: string | null
          id: string
          is_elevator_card: boolean | null
          is_passkey: boolean | null
          key_scope: string | null
          location_data: Json | null
          lost_count: number | null
          name: string
          properties: Json | null
          status: Database["public"]["Enums"]["key_status_enum"] | null
          total_quantity: number
          type: Database["public"]["Enums"]["key_type_enum"]
          updated_at: string | null
        }
        Insert: {
          active_assignments?: number | null
          available_quantity?: number
          captain_office_assigned_date?: string | null
          captain_office_copy?: boolean | null
          captain_office_notes?: string | null
          created_at?: string | null
          id?: string
          is_elevator_card?: boolean | null
          is_passkey?: boolean | null
          key_scope?: string | null
          location_data?: Json | null
          lost_count?: number | null
          name: string
          properties?: Json | null
          status?: Database["public"]["Enums"]["key_status_enum"] | null
          total_quantity?: number
          type: Database["public"]["Enums"]["key_type_enum"]
          updated_at?: string | null
        }
        Update: {
          active_assignments?: number | null
          available_quantity?: number
          captain_office_assigned_date?: string | null
          captain_office_copy?: boolean | null
          captain_office_notes?: string | null
          created_at?: string | null
          id?: string
          is_elevator_card?: boolean | null
          is_passkey?: boolean | null
          key_scope?: string | null
          location_data?: Json | null
          lost_count?: number | null
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
          notes: string | null
          position: Database["public"]["Enums"]["lighting_position_enum"] | null
          replaced_date: string | null
          reported_out_date: string | null
          requires_electrician: boolean | null
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
          notes?: string | null
          position?:
            | Database["public"]["Enums"]["lighting_position_enum"]
            | null
          replaced_date?: string | null
          reported_out_date?: string | null
          requires_electrician?: boolean | null
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
          notes?: string | null
          position?:
            | Database["public"]["Enums"]["lighting_position_enum"]
            | null
          replaced_date?: string | null
          reported_out_date?: string | null
          requires_electrician?: boolean | null
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
            referencedRelation: "floors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lighting_fixtures_last_scheduled_by_fkey"
            columns: ["last_scheduled_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
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
          assigned_to: string | null
          created_at: string
          description: string
          fixture_id: string | null
          id: string
          issue_type: string
          priority: string
          reported_at: string
          resolution_notes: string | null
          resolved_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          description: string
          fixture_id?: string | null
          id?: string
          issue_type?: string
          priority?: string
          reported_at?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          description?: string
          fixture_id?: string | null
          id?: string
          issue_type?: string
          priority?: string
          reported_at?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lighting_issues_fixture_id_fkey"
            columns: ["fixture_id"]
            isOneToOne: false
            referencedRelation: "lighting_analytics_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lighting_issues_fixture_id_fkey"
            columns: ["fixture_id"]
            isOneToOne: false
            referencedRelation: "lighting_fixtures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lighting_issues_fixture_id_fkey"
            columns: ["fixture_id"]
            isOneToOne: false
            referencedRelation: "lighting_fixtures_enriched"
            referencedColumns: ["id"]
          },
        ]
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
            foreignKeyName: "lighting_maintenance_fixture_id_fkey"
            columns: ["fixture_id"]
            isOneToOne: false
            referencedRelation: "lighting_analytics_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lighting_maintenance_fixture_id_fkey"
            columns: ["fixture_id"]
            isOneToOne: false
            referencedRelation: "lighting_fixtures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lighting_maintenance_fixture_id_fkey"
            columns: ["fixture_id"]
            isOneToOne: false
            referencedRelation: "lighting_fixtures_enriched"
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
            foreignKeyName: "lighting_maintenance_schedules_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lighting_maintenance_schedules_fixture_id_fkey"
            columns: ["fixture_id"]
            isOneToOne: false
            referencedRelation: "lighting_analytics_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lighting_maintenance_schedules_fixture_id_fkey"
            columns: ["fixture_id"]
            isOneToOne: false
            referencedRelation: "lighting_fixtures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lighting_maintenance_schedules_fixture_id_fkey"
            columns: ["fixture_id"]
            isOneToOne: false
            referencedRelation: "lighting_fixtures_enriched"
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
            referencedRelation: "lighting_analytics_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lighting_notifications_fixture_id_fkey"
            columns: ["fixture_id"]
            isOneToOne: false
            referencedRelation: "lighting_fixtures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lighting_notifications_fixture_id_fkey"
            columns: ["fixture_id"]
            isOneToOne: false
            referencedRelation: "lighting_fixtures_enriched"
            referencedColumns: ["id"]
          },
        ]
      }
      lighting_templates: {
        Row: {
          bulbs_per_fixture: number
          created_at: string | null
          fixture_count: number
          floor_restrictions: number[] | null
          id: string
          name: string
          special_config: Json | null
          template_type: string
          updated_at: string | null
        }
        Insert: {
          bulbs_per_fixture: number
          created_at?: string | null
          fixture_count: number
          floor_restrictions?: number[] | null
          id?: string
          name: string
          special_config?: Json | null
          template_type: string
          updated_at?: string | null
        }
        Update: {
          bulbs_per_fixture?: number
          created_at?: string | null
          fixture_count?: number
          floor_restrictions?: number[] | null
          id?: string
          name?: string
          special_config?: Json | null
          template_type?: string
          updated_at?: string | null
        }
        Relationships: []
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
            referencedRelation: "floors"
            referencedColumns: ["id"]
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
            foreignKeyName: "location_access_floor_id_fkey"
            columns: ["floor_id"]
            isOneToOne: false
            referencedRelation: "floors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "location_access_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_issues: {
        Row: {
          assigned_to: string | null
          created_at: string
          description: string
          id: string
          issue_type: string
          last_occurrence: string | null
          maintenance_schedule_id: string | null
          permanent_solution_needed: boolean | null
          photos: string[] | null
          recurring_issue: boolean | null
          reported_by: string | null
          resolution_notes: string | null
          resolved_date: string | null
          severity: string | null
          space_id: string | null
          space_name: string
          space_type: string | null
          status: string
          temporary_fix_date: string | null
          temporary_fix_description: string | null
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          description: string
          id?: string
          issue_type: string
          last_occurrence?: string | null
          maintenance_schedule_id?: string | null
          permanent_solution_needed?: boolean | null
          photos?: string[] | null
          recurring_issue?: boolean | null
          reported_by?: string | null
          resolution_notes?: string | null
          resolved_date?: string | null
          severity?: string | null
          space_id?: string | null
          space_name: string
          space_type?: string | null
          status?: string
          temporary_fix_date?: string | null
          temporary_fix_description?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          description?: string
          id?: string
          issue_type?: string
          last_occurrence?: string | null
          maintenance_schedule_id?: string | null
          permanent_solution_needed?: boolean | null
          photos?: string[] | null
          recurring_issue?: boolean | null
          reported_by?: string | null
          resolution_notes?: string | null
          resolved_date?: string | null
          severity?: string | null
          space_id?: string | null
          space_name?: string
          space_type?: string | null
          status?: string
          temporary_fix_date?: string | null
          temporary_fix_description?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_issues_maintenance_schedule_id_fkey"
            columns: ["maintenance_schedule_id"]
            isOneToOne: false
            referencedRelation: "maintenance_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_notifications: {
        Row: {
          created_at: string
          delivery_method: string | null
          id: string
          maintenance_schedule_id: string | null
          message: string
          notification_type: string
          read_at: string | null
          sent_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          delivery_method?: string | null
          id?: string
          maintenance_schedule_id?: string | null
          message: string
          notification_type: string
          read_at?: string | null
          sent_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          delivery_method?: string | null
          id?: string
          maintenance_schedule_id?: string | null
          message?: string
          notification_type?: string
          read_at?: string | null
          sent_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_notifications_maintenance_schedule_id_fkey"
            columns: ["maintenance_schedule_id"]
            isOneToOne: false
            referencedRelation: "maintenance_schedules"
            referencedColumns: ["id"]
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
            referencedRelation: "lighting_analytics_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_records_fixture_id_fkey"
            columns: ["fixture_id"]
            isOneToOne: false
            referencedRelation: "lighting_fixtures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_records_fixture_id_fkey"
            columns: ["fixture_id"]
            isOneToOne: false
            referencedRelation: "lighting_fixtures_enriched"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_requests: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string | null
          description: string | null
          id: string
          priority: string | null
          requested_by: string | null
          scheduled_date: string | null
          space_id: string | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          priority?: string | null
          requested_by?: string | null
          scheduled_date?: string | null
          space_id?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          priority?: string | null
          requested_by?: string | null
          scheduled_date?: string | null
          space_id?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      maintenance_schedules: {
        Row: {
          actual_cost: number | null
          actual_end_date: string | null
          actual_start_date: string | null
          assigned_to: string | null
          contractor_info: Json | null
          created_at: string
          created_by: string | null
          description: string | null
          estimated_cost: number | null
          id: string
          impact_level: string | null
          maintenance_type: string
          notes: string | null
          notification_sent: boolean | null
          priority: string | null
          recurring_schedule: Json | null
          reminder_dates: string[] | null
          scheduled_end_date: string | null
          scheduled_start_date: string
          space_id: string | null
          space_name: string
          space_type: string | null
          special_instructions: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          actual_cost?: number | null
          actual_end_date?: string | null
          actual_start_date?: string | null
          assigned_to?: string | null
          contractor_info?: Json | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          estimated_cost?: number | null
          id?: string
          impact_level?: string | null
          maintenance_type: string
          notes?: string | null
          notification_sent?: boolean | null
          priority?: string | null
          recurring_schedule?: Json | null
          reminder_dates?: string[] | null
          scheduled_end_date?: string | null
          scheduled_start_date: string
          space_id?: string | null
          space_name: string
          space_type?: string | null
          special_instructions?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          actual_cost?: number | null
          actual_end_date?: string | null
          actual_start_date?: string | null
          assigned_to?: string | null
          contractor_info?: Json | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          estimated_cost?: number | null
          id?: string
          impact_level?: string | null
          maintenance_type?: string
          notes?: string | null
          notification_sent?: boolean | null
          priority?: string | null
          recurring_schedule?: Json | null
          reminder_dates?: string[] | null
          scheduled_end_date?: string | null
          scheduled_start_date?: string
          space_id?: string | null
          space_name?: string
          space_type?: string | null
          special_instructions?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      monitored_items: {
        Row: {
          alert_thresholds: Json | null
          created_at: string
          id: string
          is_active: boolean | null
          item_description: string | null
          item_id: string
          item_name: string
          item_type: string
          last_alert_sent: string | null
          monitored_by: string
          monitoring_criteria: Json | null
          updated_at: string
        }
        Insert: {
          alert_thresholds?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          item_description?: string | null
          item_id: string
          item_name: string
          item_type: string
          last_alert_sent?: string | null
          monitored_by: string
          monitoring_criteria?: Json | null
          updated_at?: string
        }
        Update: {
          alert_thresholds?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          item_description?: string | null
          item_id?: string
          item_name?: string
          item_type?: string
          last_alert_sent?: string | null
          monitored_by?: string
          monitoring_criteria?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      monitoring_rules: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          monitored_item_id: string
          rule_config: Json
          rule_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          monitored_item_id: string
          rule_config?: Json
          rule_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          monitored_item_id?: string
          rule_config?: Json
          rule_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "monitoring_rules_monitored_item_id_fkey"
            columns: ["monitored_item_id"]
            isOneToOne: false
            referencedRelation: "monitored_items"
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
          created_by: string | null
          expiration_date: string | null
          id: string
          is_primary: boolean | null
          last_renewal_date: string | null
          notes: string | null
          occupant_id: string | null
          renewal_count: number | null
          room_id: string | null
          schedule: Json | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          assigned_at?: string | null
          assignment_type?: string
          created_at?: string | null
          created_by?: string | null
          expiration_date?: string | null
          id?: string
          is_primary?: boolean | null
          last_renewal_date?: string | null
          notes?: string | null
          occupant_id?: string | null
          renewal_count?: number | null
          room_id?: string | null
          schedule?: Json | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          assigned_at?: string | null
          assignment_type?: string
          created_at?: string | null
          created_by?: string | null
          expiration_date?: string | null
          id?: string
          is_primary?: boolean | null
          last_renewal_date?: string | null
          notes?: string | null
          occupant_id?: string | null
          renewal_count?: number | null
          room_id?: string | null
          schedule?: Json | null
          updated_at?: string | null
          updated_by?: string | null
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
            foreignKeyName: "occupant_room_assignments_occupant_id_fkey"
            columns: ["occupant_id"]
            isOneToOne: false
            referencedRelation: "occupant_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "occupant_room_assignments_occupant_id_fkey"
            columns: ["occupant_id"]
            isOneToOne: false
            referencedRelation: "occupants"
            referencedColumns: ["id"]
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
          personnel_profile_id: string | null
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
          personnel_profile_id?: string | null
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
          personnel_profile_id?: string | null
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
            foreignKeyName: "occupants_personnel_profile_id_fkey"
            columns: ["personnel_profile_id"]
            isOneToOne: false
            referencedRelation: "personnel_profiles"
            referencedColumns: ["id"]
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
      office_elevator_card_allocations: {
        Row: {
          allocated_at: string
          created_by: string | null
          id: string
          key_id: string
          notes: string | null
          office_name: string
          quantity_delta: number
        }
        Insert: {
          allocated_at?: string
          created_by?: string | null
          id?: string
          key_id: string
          notes?: string | null
          office_name?: string
          quantity_delta: number
        }
        Update: {
          allocated_at?: string
          created_by?: string | null
          id?: string
          key_id?: string
          notes?: string | null
          office_name?: string
          quantity_delta?: number
        }
        Relationships: [
          {
            foreignKeyName: "office_elevator_card_allocations_key_id_fkey"
            columns: ["key_id"]
            isOneToOne: false
            referencedRelation: "key_inventory_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "office_elevator_card_allocations_key_id_fkey"
            columns: ["key_id"]
            isOneToOne: false
            referencedRelation: "key_statistics_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "office_elevator_card_allocations_key_id_fkey"
            columns: ["key_id"]
            isOneToOne: false
            referencedRelation: "keys"
            referencedColumns: ["id"]
          },
        ]
      }
      oncall_members: {
        Row: {
          pool_id: string
          priority: number
          staff_id: string
        }
        Insert: {
          pool_id: string
          priority?: number
          staff_id: string
        }
        Update: {
          pool_id?: string
          priority?: number
          staff_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "oncall_members_pool_id_fkey"
            columns: ["pool_id"]
            isOneToOne: false
            referencedRelation: "oncall_pools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oncall_members_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oncall_members_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff_out_today"
            referencedColumns: ["staff_id"]
          },
        ]
      }
      oncall_pools: {
        Row: {
          active: boolean
          id: string
          label: string
          role: string
        }
        Insert: {
          active?: boolean
          id?: string
          label: string
          role: string
        }
        Update: {
          active?: boolean
          id?: string
          label?: string
          role?: string
        }
        Relationships: []
      }
      personnel_profiles: {
        Row: {
          building: string | null
          created_at: string
          created_by: string | null
          department: string | null
          display_name: string | null
          email: string | null
          extension: string | null
          fax: string | null
          first_name: string
          floor: string | null
          full_name: string | null
          id: string
          is_active: boolean | null
          is_available_for_assignment: boolean | null
          last_name: string
          notes: string | null
          phone: string | null
          primary_role: string
          room_number: string | null
          specializations: string[] | null
          title: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          building?: string | null
          created_at?: string
          created_by?: string | null
          department?: string | null
          display_name?: string | null
          email?: string | null
          extension?: string | null
          fax?: string | null
          first_name: string
          floor?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          is_available_for_assignment?: boolean | null
          last_name: string
          notes?: string | null
          phone?: string | null
          primary_role: string
          room_number?: string | null
          specializations?: string[] | null
          title?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          building?: string | null
          created_at?: string
          created_by?: string | null
          department?: string | null
          display_name?: string | null
          email?: string | null
          extension?: string | null
          fax?: string | null
          first_name?: string
          floor?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          is_available_for_assignment?: boolean | null
          last_name?: string
          notes?: string | null
          phone?: string | null
          primary_role?: string
          room_number?: string | null
          specializations?: string[] | null
          title?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      physical_key_requests: {
        Row: {
          building: string | null
          created_at: string
          department: string | null
          id: string
          key_description: string | null
          location_text: string | null
          needed_from: string | null
          needed_until: string | null
          reason: string | null
          requester_email: string
          requester_name: string
          status: string
        }
        Insert: {
          building?: string | null
          created_at?: string
          department?: string | null
          id?: string
          key_description?: string | null
          location_text?: string | null
          needed_from?: string | null
          needed_until?: string | null
          reason?: string | null
          requester_email: string
          requester_name: string
          status?: string
        }
        Update: {
          building?: string | null
          created_at?: string
          department?: string | null
          id?: string
          key_description?: string | null
          location_text?: string | null
          needed_from?: string | null
          needed_until?: string | null
          reason?: string | null
          requester_email?: string
          requester_name?: string
          status?: string
        }
        Relationships: []
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
          enabled_modules: Json | null
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
          user_settings: Json
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
          enabled_modules?: Json | null
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
          user_settings?: Json
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
          enabled_modules?: Json | null
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
          user_settings?: Json
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
      rate_limit_log: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: unknown | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          user_id?: string | null
        }
        Relationships: []
      }
      rate_limit_tracking: {
        Row: {
          action_type: string
          attempts: number | null
          created_at: string | null
          id: string
          ip_address: unknown | null
          user_id: string | null
        }
        Insert: {
          action_type: string
          attempts?: number | null
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          user_id?: string | null
        }
        Update: {
          action_type?: string
          attempts?: number | null
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          user_id?: string | null
        }
        Relationships: []
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
        ]
      }
      role_audit_log: {
        Row: {
          action: string
          created_at: string | null
          id: string
          new_role: Database["public"]["Enums"]["user_role"] | null
          old_role: Database["public"]["Enums"]["user_role"] | null
          reason: string | null
          target_user_id: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          new_role?: Database["public"]["Enums"]["user_role"] | null
          old_role?: Database["public"]["Enums"]["user_role"] | null
          reason?: string | null
          target_user_id?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          new_role?: Database["public"]["Enums"]["user_role"] | null
          old_role?: Database["public"]["Enums"]["user_role"] | null
          reason?: string | null
          target_user_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      role_change_audit: {
        Row: {
          approved_by: string | null
          changed_by: string | null
          created_at: string | null
          id: string
          ip_address: string | null
          new_role: string | null
          old_role: string | null
          reason: string | null
          target_user_id: string | null
          user_agent: string | null
        }
        Insert: {
          approved_by?: string | null
          changed_by?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          new_role?: string | null
          old_role?: string | null
          reason?: string | null
          target_user_id?: string | null
          user_agent?: string | null
        }
        Update: {
          approved_by?: string | null
          changed_by?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          new_role?: string | null
          old_role?: string | null
          reason?: string | null
          target_user_id?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      room_assignment_audit_log: {
        Row: {
          action_type: string
          assignment_id: string | null
          id: string
          metadata: Json | null
          new_values: Json | null
          old_values: Json | null
          performed_at: string | null
          performed_by: string | null
        }
        Insert: {
          action_type: string
          assignment_id?: string | null
          id?: string
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          performed_at?: string | null
          performed_by?: string | null
        }
        Update: {
          action_type?: string
          assignment_id?: string | null
          id?: string
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          performed_at?: string | null
          performed_by?: string | null
        }
        Relationships: []
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
      room_key_access: {
        Row: {
          access_type: string
          created_at: string | null
          description: string | null
          id: string
          key_id: string | null
          location_within_room: string | null
          room_id: string
          updated_at: string | null
        }
        Insert: {
          access_type: string
          created_at?: string | null
          description?: string | null
          id?: string
          key_id?: string | null
          location_within_room?: string | null
          room_id: string
          updated_at?: string | null
        }
        Update: {
          access_type?: string
          created_at?: string | null
          description?: string | null
          id?: string
          key_id?: string | null
          location_within_room?: string | null
          room_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "room_key_access_key_id_fkey"
            columns: ["key_id"]
            isOneToOne: false
            referencedRelation: "key_inventory_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_key_access_key_id_fkey"
            columns: ["key_id"]
            isOneToOne: false
            referencedRelation: "key_statistics_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_key_access_key_id_fkey"
            columns: ["key_id"]
            isOneToOne: false
            referencedRelation: "keys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_key_access_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_selection_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_key_access_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
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
      room_occupancy: {
        Row: {
          checked_in_at: string
          checked_out_at: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          occupancy_type: string
          room_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          checked_in_at?: string
          checked_out_at?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          occupancy_type?: string
          room_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          checked_in_at?: string
          checked_out_at?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          occupancy_type?: string
          room_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_occupancy_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_selection_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_occupancy_room_id_fkey"
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
      room_shutdowns: {
        Row: {
          actual_end_date: string | null
          actual_start_date: string | null
          court_room_id: string
          created_at: string
          created_by: string | null
          description: string | null
          end_date: string | null
          id: string
          impact_level: string | null
          issue_id: string | null
          notifications_sent: Json | null
          project_details: Json | null
          project_notes: string | null
          reason: string
          start_date: string
          status: string
          temporary_location: string | null
          title: string
          updated_at: string
        }
        Insert: {
          actual_end_date?: string | null
          actual_start_date?: string | null
          court_room_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          impact_level?: string | null
          issue_id?: string | null
          notifications_sent?: Json | null
          project_details?: Json | null
          project_notes?: string | null
          reason: string
          start_date: string
          status?: string
          temporary_location?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          actual_end_date?: string | null
          actual_start_date?: string | null
          court_room_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          impact_level?: string | null
          issue_id?: string | null
          notifications_sent?: Json | null
          project_details?: Json | null
          project_notes?: string | null
          reason?: string
          start_date?: string
          status?: string
          temporary_location?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_shutdowns_court_room_id_fkey"
            columns: ["court_room_id"]
            isOneToOne: false
            referencedRelation: "court_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          capacity: number | null
          capacity_size_category: string | null
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
          original_room_type: string | null
          parent_room_id: string | null
          passkey_enabled: boolean | null
          phone_number: string | null
          position: Json | null
          previous_functions: Json[] | null
          room_number: string | null
          room_type: Database["public"]["Enums"]["room_type_enum"]
          rotation: number | null
          simplified_storage_type:
            | Database["public"]["Enums"]["simplified_storage_type_enum"]
            | null
          size: Json | null
          status: Database["public"]["Enums"]["status_enum"] | null
          storage_capacity: number | null
          storage_notes: string | null
          storage_type: string | null
          temporary_storage_use: boolean | null
          updated_at: string | null
        }
        Insert: {
          capacity?: number | null
          capacity_size_category?: string | null
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
          original_room_type?: string | null
          parent_room_id?: string | null
          passkey_enabled?: boolean | null
          phone_number?: string | null
          position?: Json | null
          previous_functions?: Json[] | null
          room_number?: string | null
          room_type?: Database["public"]["Enums"]["room_type_enum"]
          rotation?: number | null
          simplified_storage_type?:
            | Database["public"]["Enums"]["simplified_storage_type_enum"]
            | null
          size?: Json | null
          status?: Database["public"]["Enums"]["status_enum"] | null
          storage_capacity?: number | null
          storage_notes?: string | null
          storage_type?: string | null
          temporary_storage_use?: boolean | null
          updated_at?: string | null
        }
        Update: {
          capacity?: number | null
          capacity_size_category?: string | null
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
          original_room_type?: string | null
          parent_room_id?: string | null
          passkey_enabled?: boolean | null
          phone_number?: string | null
          position?: Json | null
          previous_functions?: Json[] | null
          room_number?: string | null
          room_type?: Database["public"]["Enums"]["room_type_enum"]
          rotation?: number | null
          simplified_storage_type?:
            | Database["public"]["Enums"]["simplified_storage_type_enum"]
            | null
          size?: Json | null
          status?: Database["public"]["Enums"]["status_enum"] | null
          storage_capacity?: number | null
          storage_notes?: string | null
          storage_type?: string | null
          temporary_storage_use?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rooms_floor_id_fkey"
            columns: ["floor_id"]
            isOneToOne: false
            referencedRelation: "floors"
            referencedColumns: ["id"]
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
      security_audit_log: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: unknown | null
          resource_id: string | null
          resource_type: string | null
          timestamp: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          resource_id?: string | null
          resource_type?: string | null
          timestamp?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          resource_id?: string | null
          resource_type?: string | null
          timestamp?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      security_configurations: {
        Row: {
          configuration: Json
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          name: string
          type: string
          updated_at: string | null
        }
        Insert: {
          configuration?: Json
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          type: string
          updated_at?: string | null
        }
        Update: {
          configuration?: Json
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      security_incidents: {
        Row: {
          affected_users: string[] | null
          assigned_to: string | null
          created_at: string | null
          description: string
          detection_method: string | null
          escalated: boolean | null
          first_detected_at: string
          id: string
          incident_data: Json | null
          incident_type: string
          resolution_notes: string | null
          resolved_at: string | null
          severity: string
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          affected_users?: string[] | null
          assigned_to?: string | null
          created_at?: string | null
          description: string
          detection_method?: string | null
          escalated?: boolean | null
          first_detected_at?: string
          id?: string
          incident_data?: Json | null
          incident_type: string
          resolution_notes?: string | null
          resolved_at?: string | null
          severity: string
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          affected_users?: string[] | null
          assigned_to?: string | null
          created_at?: string | null
          description?: string
          detection_method?: string | null
          escalated?: boolean | null
          first_detected_at?: string
          id?: string
          incident_data?: Json | null
          incident_type?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          severity?: string
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
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
      security_metrics: {
        Row: {
          id: string
          metadata: Json | null
          metric_name: string
          metric_type: string
          metric_value: number
          recorded_at: string | null
        }
        Insert: {
          id?: string
          metadata?: Json | null
          metric_name: string
          metric_type: string
          metric_value: number
          recorded_at?: string | null
        }
        Update: {
          id?: string
          metadata?: Json | null
          metric_name?: string
          metric_type?: string
          metric_value?: number
          recorded_at?: string | null
        }
        Relationships: []
      }
      security_notifications: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          is_read: boolean | null
          message: string
          metadata: Json | null
          notification_type: string
          severity: string
          target_users: string[] | null
          title: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          metadata?: Json | null
          notification_type: string
          severity: string
          target_users?: string[] | null
          title: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          metadata?: Json | null
          notification_type?: string
          severity?: string
          target_users?: string[] | null
          title?: string
        }
        Relationships: []
      }
      security_operations_audit: {
        Row: {
          created_at: string | null
          error_message: string | null
          id: string
          ip_address: unknown | null
          operation_details: Json | null
          operation_type: string
          success: boolean
          target_resource: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          ip_address?: unknown | null
          operation_details?: Json | null
          operation_type: string
          success: boolean
          target_resource?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          ip_address?: unknown | null
          operation_details?: Json | null
          operation_type?: string
          success?: boolean
          target_resource?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      security_policy_compliance: {
        Row: {
          compliance_status: string
          details: Json | null
          id: string
          last_checked: string | null
          next_check_due: string | null
          policy_name: string
        }
        Insert: {
          compliance_status: string
          details?: Json | null
          id?: string
          last_checked?: string | null
          next_check_due?: string | null
          policy_name: string
        }
        Update: {
          compliance_status?: string
          details?: Json | null
          id?: string
          last_checked?: string | null
          next_check_due?: string | null
          policy_name?: string
        }
        Relationships: []
      }
      security_rate_limits: {
        Row: {
          attempt_type: string
          attempts: number
          blocked_until: string | null
          created_at: string
          id: number
          identifier: string
          last_attempt: string
          updated_at: string
        }
        Insert: {
          attempt_type: string
          attempts?: number
          blocked_until?: string | null
          created_at?: string
          id?: number
          identifier: string
          last_attempt?: string
          updated_at?: string
        }
        Update: {
          attempt_type?: string
          attempts?: number
          blocked_until?: string | null
          created_at?: string
          id?: number
          identifier?: string
          last_attempt?: string
          updated_at?: string
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
      shutdown_notifications: {
        Row: {
          created_at: string
          id: string
          message: string | null
          notification_type: string
          recipients: Json | null
          scheduled_for: string
          sent_at: string | null
          shutdown_id: string
          status: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          notification_type: string
          recipients?: Json | null
          scheduled_for: string
          sent_at?: string | null
          shutdown_id: string
          status?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          notification_type?: string
          recipients?: Json | null
          scheduled_for?: string
          sent_at?: string | null
          shutdown_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shutdown_notifications_shutdown_id_fkey"
            columns: ["shutdown_id"]
            isOneToOne: false
            referencedRelation: "room_shutdowns"
            referencedColumns: ["id"]
          },
        ]
      }
      shutdown_schedule_changes: {
        Row: {
          change_type: string
          changed_at: string
          changed_by: string | null
          id: string
          impact_description: string | null
          new_end_date: string | null
          new_start_date: string | null
          previous_end_date: string | null
          previous_start_date: string | null
          reason: string
          shutdown_id: string
        }
        Insert: {
          change_type: string
          changed_at?: string
          changed_by?: string | null
          id?: string
          impact_description?: string | null
          new_end_date?: string | null
          new_start_date?: string | null
          previous_end_date?: string | null
          previous_start_date?: string | null
          reason: string
          shutdown_id: string
        }
        Update: {
          change_type?: string
          changed_at?: string
          changed_by?: string | null
          id?: string
          impact_description?: string | null
          new_end_date?: string | null
          new_start_date?: string | null
          previous_end_date?: string | null
          previous_start_date?: string | null
          reason?: string
          shutdown_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shutdown_schedule_changes_shutdown_id_fkey"
            columns: ["shutdown_id"]
            isOneToOne: false
            referencedRelation: "room_shutdowns"
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
            referencedRelation: "lighting_analytics_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spatial_assignments_fixture_id_fkey"
            columns: ["fixture_id"]
            isOneToOne: true
            referencedRelation: "lighting_fixtures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spatial_assignments_fixture_id_fkey"
            columns: ["fixture_id"]
            isOneToOne: true
            referencedRelation: "lighting_fixtures_enriched"
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
      staff: {
        Row: {
          active: boolean
          created_at: string | null
          display_name: string
          email: string | null
          id: string
          role: string
        }
        Insert: {
          active?: boolean
          created_at?: string | null
          display_name: string
          email?: string | null
          id?: string
          role: string
        }
        Update: {
          active?: boolean
          created_at?: string | null
          display_name?: string
          email?: string | null
          id?: string
          role?: string
        }
        Relationships: []
      }
      staff_absences: {
        Row: {
          created_at: string | null
          created_by: string | null
          ends_on: string
          id: string
          kind: Database["public"]["Enums"]["absence_kind"]
          staff_id: string
          starts_on: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          ends_on: string
          id?: string
          kind: Database["public"]["Enums"]["absence_kind"]
          staff_id: string
          starts_on: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          ends_on?: string
          id?: string
          kind?: Database["public"]["Enums"]["absence_kind"]
          staff_id?: string
          starts_on?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_absences_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_absences_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff_out_today"
            referencedColumns: ["staff_id"]
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
      supply_request_fulfillment_log: {
        Row: {
          created_at: string | null
          id: string
          metadata: Json | null
          notes: string | null
          performed_by: string | null
          request_id: string
          stage: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          performed_by?: string | null
          request_id: string
          stage: string
        }
        Update: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          performed_by?: string | null
          request_id?: string
          stage?: string
        }
        Relationships: [
          {
            foreignKeyName: "supply_request_fulfillment_log_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supply_request_fulfillment_log_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "supply_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      supply_request_items: {
        Row: {
          created_at: string
          id: string
          item_id: string
          notes: string | null
          quantity_approved: number | null
          quantity_fulfilled: number | null
          quantity_requested: number
          request_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          notes?: string | null
          quantity_approved?: number | null
          quantity_fulfilled?: number | null
          quantity_requested: number
          request_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          notes?: string | null
          quantity_approved?: number | null
          quantity_fulfilled?: number | null
          quantity_requested?: number
          request_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supply_request_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supply_request_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "low_stock_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supply_request_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "storage_room_inventory"
            referencedColumns: ["item_id"]
          },
          {
            foreignKeyName: "supply_request_items_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "supply_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      supply_requests: {
        Row: {
          approval_notes: string | null
          approval_requested_at: string | null
          approved_at: string | null
          approved_by: string | null
          assigned_fulfiller_id: string | null
          created_at: string
          delivery_location: string | null
          delivery_method: string | null
          delivery_notes: string | null
          description: string | null
          fulfilled_at: string | null
          fulfilled_by: string | null
          fulfillment_cost: number | null
          fulfillment_notes: string | null
          fulfillment_stage: string | null
          id: string
          justification: string
          metadata: Json | null
          packing_completed_at: string | null
          packing_started_at: string | null
          picking_completed_at: string | null
          picking_started_at: string | null
          priority: string
          ready_for_delivery_at: string | null
          recipient_confirmation: string | null
          rejection_reason: string | null
          requested_delivery_date: string | null
          requester_id: string
          status: string
          supervisor_id: string | null
          title: string
          updated_at: string
          work_completed_at: string | null
          work_duration_minutes: number | null
          work_started_at: string | null
        }
        Insert: {
          approval_notes?: string | null
          approval_requested_at?: string | null
          approved_at?: string | null
          approved_by?: string | null
          assigned_fulfiller_id?: string | null
          created_at?: string
          delivery_location?: string | null
          delivery_method?: string | null
          delivery_notes?: string | null
          description?: string | null
          fulfilled_at?: string | null
          fulfilled_by?: string | null
          fulfillment_cost?: number | null
          fulfillment_notes?: string | null
          fulfillment_stage?: string | null
          id?: string
          justification: string
          metadata?: Json | null
          packing_completed_at?: string | null
          packing_started_at?: string | null
          picking_completed_at?: string | null
          picking_started_at?: string | null
          priority?: string
          ready_for_delivery_at?: string | null
          recipient_confirmation?: string | null
          rejection_reason?: string | null
          requested_delivery_date?: string | null
          requester_id: string
          status?: string
          supervisor_id?: string | null
          title: string
          updated_at?: string
          work_completed_at?: string | null
          work_duration_minutes?: number | null
          work_started_at?: string | null
        }
        Update: {
          approval_notes?: string | null
          approval_requested_at?: string | null
          approved_at?: string | null
          approved_by?: string | null
          assigned_fulfiller_id?: string | null
          created_at?: string
          delivery_location?: string | null
          delivery_method?: string | null
          delivery_notes?: string | null
          description?: string | null
          fulfilled_at?: string | null
          fulfilled_by?: string | null
          fulfillment_cost?: number | null
          fulfillment_notes?: string | null
          fulfillment_stage?: string | null
          id?: string
          justification?: string
          metadata?: Json | null
          packing_completed_at?: string | null
          packing_started_at?: string | null
          picking_completed_at?: string | null
          picking_started_at?: string | null
          priority?: string
          ready_for_delivery_at?: string | null
          recipient_confirmation?: string | null
          rejection_reason?: string | null
          requested_delivery_date?: string | null
          requester_id?: string
          status?: string
          supervisor_id?: string | null
          title?: string
          updated_at?: string
          work_completed_at?: string | null
          work_duration_minutes?: number | null
          work_started_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_supply_requests_requester_id"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supply_requests_assigned_fulfiller_id_fkey"
            columns: ["assigned_fulfiller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supply_requests_supervisor_id_fkey"
            columns: ["supervisor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      system_modules: {
        Row: {
          description: string | null
          enabled: boolean
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          description?: string | null
          enabled?: boolean
          id: string
          name: string
          updated_at?: string
        }
        Update: {
          description?: string | null
          enabled?: boolean
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          admin_email: string
          audit_logging: boolean
          auto_backups: boolean
          backup_retention: number
          created_at: string | null
          created_by: string | null
          email_notifications: boolean
          id: string
          key: string
          log_level: string
          maintenance_mode: boolean
          system_name: string
          updated_at: string | null
          updated_by: string | null
          user_registration: boolean
          value: Json
          welcome_message: string
        }
        Insert: {
          admin_email?: string
          audit_logging?: boolean
          auto_backups?: boolean
          backup_retention?: number
          created_at?: string | null
          created_by?: string | null
          email_notifications?: boolean
          id?: string
          key: string
          log_level?: string
          maintenance_mode?: boolean
          system_name?: string
          updated_at?: string | null
          updated_by?: string | null
          user_registration?: boolean
          value?: Json
          welcome_message?: string
        }
        Update: {
          admin_email?: string
          audit_logging?: boolean
          auto_backups?: boolean
          backup_retention?: number
          created_at?: string | null
          created_by?: string | null
          email_notifications?: boolean
          id?: string
          key?: string
          log_level?: string
          maintenance_mode?: boolean
          system_name?: string
          updated_at?: string | null
          updated_by?: string | null
          user_registration?: boolean
          value?: Json
          welcome_message?: string
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
      unified_spaces: {
        Row: {
          accessibility: string | null
          ceiling_height: number | null
          closer_status:
            | Database["public"]["Enums"]["door_closer_status_enum"]
            | null
          component_issues: Json | null
          courtroom_photos: Json | null
          created_at: string | null
          current_function: string | null
          description: string | null
          floor_id: string
          flooring_type: string | null
          hardware_status: Json | null
          has_closing_issue: boolean | null
          has_handle_issue: boolean | null
          id: string
          inspected_by: string | null
          is_storage: boolean | null
          is_transition_door: boolean | null
          last_inspection_date: string | null
          length: number | null
          lighting_level: string | null
          name: string
          parent_room_id: string | null
          phone_number: string | null
          position: Json | null
          room_number: string | null
          room_type: Database["public"]["Enums"]["room_type_enum"] | null
          rotation: number | null
          simplified_storage_type:
            | Database["public"]["Enums"]["simplified_storage_type_enum"]
            | null
          size: Json | null
          space_type: string
          status: Database["public"]["Enums"]["status_enum"] | null
          storage_capacity: number | null
          storage_notes: string | null
          storage_type: string | null
          temporary_storage_use: boolean | null
          updated_at: string | null
          width: number | null
        }
        Insert: {
          accessibility?: string | null
          ceiling_height?: number | null
          closer_status?:
            | Database["public"]["Enums"]["door_closer_status_enum"]
            | null
          component_issues?: Json | null
          courtroom_photos?: Json | null
          created_at?: string | null
          current_function?: string | null
          description?: string | null
          floor_id: string
          flooring_type?: string | null
          hardware_status?: Json | null
          has_closing_issue?: boolean | null
          has_handle_issue?: boolean | null
          id?: string
          inspected_by?: string | null
          is_storage?: boolean | null
          is_transition_door?: boolean | null
          last_inspection_date?: string | null
          length?: number | null
          lighting_level?: string | null
          name: string
          parent_room_id?: string | null
          phone_number?: string | null
          position?: Json | null
          room_number?: string | null
          room_type?: Database["public"]["Enums"]["room_type_enum"] | null
          rotation?: number | null
          simplified_storage_type?:
            | Database["public"]["Enums"]["simplified_storage_type_enum"]
            | null
          size?: Json | null
          space_type: string
          status?: Database["public"]["Enums"]["status_enum"] | null
          storage_capacity?: number | null
          storage_notes?: string | null
          storage_type?: string | null
          temporary_storage_use?: boolean | null
          updated_at?: string | null
          width?: number | null
        }
        Update: {
          accessibility?: string | null
          ceiling_height?: number | null
          closer_status?:
            | Database["public"]["Enums"]["door_closer_status_enum"]
            | null
          component_issues?: Json | null
          courtroom_photos?: Json | null
          created_at?: string | null
          current_function?: string | null
          description?: string | null
          floor_id?: string
          flooring_type?: string | null
          hardware_status?: Json | null
          has_closing_issue?: boolean | null
          has_handle_issue?: boolean | null
          id?: string
          inspected_by?: string | null
          is_storage?: boolean | null
          is_transition_door?: boolean | null
          last_inspection_date?: string | null
          length?: number | null
          lighting_level?: string | null
          name?: string
          parent_room_id?: string | null
          phone_number?: string | null
          position?: Json | null
          room_number?: string | null
          room_type?: Database["public"]["Enums"]["room_type_enum"] | null
          rotation?: number | null
          simplified_storage_type?:
            | Database["public"]["Enums"]["simplified_storage_type_enum"]
            | null
          size?: Json | null
          space_type?: string
          status?: Database["public"]["Enums"]["status_enum"] | null
          storage_capacity?: number | null
          storage_notes?: string | null
          storage_type?: string | null
          temporary_storage_use?: boolean | null
          updated_at?: string | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "unified_spaces_floor_id_fkey"
            columns: ["floor_id"]
            isOneToOne: false
            referencedRelation: "floors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unified_spaces_inspected_by_fkey"
            columns: ["inspected_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unified_spaces_parent_room_fkey"
            columns: ["parent_room_id"]
            isOneToOne: false
            referencedRelation: "unified_spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      user_favorite_items: {
        Row: {
          created_at: string | null
          id: string
          item_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          item_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          item_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_favorite_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_favorite_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "low_stock_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_favorite_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "storage_room_inventory"
            referencedColumns: ["item_id"]
          },
        ]
      }
      user_notifications: {
        Row: {
          action_url: string | null
          created_at: string
          id: string
          message: string
          metadata: Json | null
          read: boolean
          related_id: string | null
          title: string
          type: string
          urgency: string | null
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string
          id?: string
          message: string
          metadata?: Json | null
          read?: boolean
          related_id?: string | null
          title: string
          type: string
          urgency?: string | null
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string
          id?: string
          message?: string
          metadata?: Json | null
          read?: boolean
          related_id?: string | null
          title?: string
          type?: string
          urgency?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "occupant_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "occupants"
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
      elevator_pass_assignments: {
        Row: {
          assigned_at: string | null
          assignment_id: string | null
          days_since_assigned: number | null
          department: string | null
          email: string | null
          first_name: string | null
          is_overdue: boolean | null
          is_spare: boolean | null
          key_id: string | null
          key_name: string | null
          key_scope: string | null
          last_name: string | null
          occupant_id: string | null
          return_reason: string | null
          returned_at: string | null
          spare_key_reason: string | null
          status: string | null
        }
        Relationships: [
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
            referencedRelation: "key_statistics_view"
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
      key_assignment_stats: {
        Row: {
          active_assignments: number | null
          overdue_assignments: number | null
          returned_assignments: number | null
          total_assignments: number | null
        }
        Relationships: []
      }
      key_assignments_view: {
        Row: {
          assigned_at: string | null
          assignment_status: string | null
          available_quantity: number | null
          created_at: string | null
          department: string | null
          email: string | null
          first_name: string | null
          id: string | null
          is_spare: boolean | null
          key_id: string | null
          key_name: string | null
          key_scope: string | null
          key_status: Database["public"]["Enums"]["key_status_enum"] | null
          key_type: Database["public"]["Enums"]["key_type_enum"] | null
          last_name: string | null
          occupant_id: string | null
          return_reason: string | null
          returned_at: string | null
          spare_key_reason: string | null
          total_quantity: number | null
          updated_at: string | null
        }
        Relationships: [
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
            referencedRelation: "key_statistics_view"
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
      key_inventory_view: {
        Row: {
          active_assignments: number | null
          available_quantity: number | null
          captain_office_assigned_date: string | null
          captain_office_copy: boolean | null
          captain_office_notes: string | null
          created_at: string | null
          current_assignments: number | null
          id: string | null
          is_passkey: boolean | null
          key_scope: string | null
          location_data: Json | null
          lost_count: number | null
          name: string | null
          properties: Json | null
          status: Database["public"]["Enums"]["key_status_enum"] | null
          total_assignment_history: number | null
          total_quantity: number | null
          type: Database["public"]["Enums"]["key_type_enum"] | null
          updated_at: string | null
        }
        Relationships: []
      }
      key_statistics_view: {
        Row: {
          active_assignments: number | null
          assigned_count: number | null
          available_quantity: number | null
          captain_office_assigned_date: string | null
          captain_office_copy: boolean | null
          captain_office_notes: string | null
          created_at: string | null
          id: string | null
          is_elevator_card: boolean | null
          is_passkey: boolean | null
          key_scope: string | null
          location_data: Json | null
          lost_count: number | null
          name: string | null
          properties: Json | null
          returned_assignments: number | null
          status: Database["public"]["Enums"]["key_status_enum"] | null
          stock_status: Database["public"]["Enums"]["key_status_enum"] | null
          total_quantity: number | null
          type: Database["public"]["Enums"]["key_type_enum"] | null
          updated_at: string | null
        }
        Relationships: []
      }
      lighting_analytics_view: {
        Row: {
          ballast_issue: boolean | null
          created_at: string | null
          floor_id: string | null
          floor_name: string | null
          id: string | null
          name: string | null
          status: Database["public"]["Enums"]["light_status_enum"] | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lighting_fixtures_floor_id_fkey"
            columns: ["floor_id"]
            isOneToOne: false
            referencedRelation: "floors"
            referencedColumns: ["id"]
          },
        ]
      }
      lighting_fixture_stats: {
        Row: {
          broken_fixtures: number | null
          maintenance_fixtures: number | null
          total_fixtures: number | null
          working_fixtures: number | null
        }
        Relationships: []
      }
      lighting_fixtures_enriched: {
        Row: {
          ballast_issue: boolean | null
          building_id: string | null
          created_at: string | null
          floor_id: string | null
          floor_name: string | null
          id: string | null
          name: string | null
          operational_status: string | null
          position: Database["public"]["Enums"]["lighting_position_enum"] | null
          space_id: string | null
          space_type: string | null
          status: Database["public"]["Enums"]["light_status_enum"] | null
          type: Database["public"]["Enums"]["light_fixture_type_enum"] | null
          updated_at: string | null
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
            foreignKeyName: "lighting_fixtures_floor_id_fkey"
            columns: ["floor_id"]
            isOneToOne: false
            referencedRelation: "floors"
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
          shortage_amount: number | null
          storage_location: string | null
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
      maintenance_summary: {
        Row: {
          fixtures_needing_maintenance: number | null
          functional_fixtures: number | null
          non_functional_fixtures: number | null
          operational_percentage: number | null
          total_fixtures: number | null
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
          created_at: string | null
          department: string | null
          email: string | null
          first_name: string | null
          id: string | null
          last_name: string | null
          phone: string | null
          room_id: string | null
          room_name: string | null
          room_number: string | null
          status: Database["public"]["Enums"]["occupant_status_enum"] | null
          title: string | null
          updated_at: string | null
        }
        Relationships: [
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
        ]
      }
      room_occupancy_stats: {
        Row: {
          occupied_rooms: number | null
          total_capacity: number | null
          total_occupancy: number | null
          total_rooms: number | null
        }
        Relationships: []
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
      security_dashboard: {
        Row: {
          critical_incidents: number | null
          incidents_last_24h: number | null
          last_updated: string | null
          total_admins: number | null
          total_open_incidents: number | null
        }
        Relationships: []
      }
      security_monitoring: {
        Row: {
          actor_id: string | null
          created_at: string | null
          event_data: Json | null
          event_type: string | null
          ip_address: string | null
          target_user_id: string | null
        }
        Relationships: []
      }
      spaces: {
        Row: {
          building_address: string | null
          building_id: string | null
          building_name: string | null
          capacity: number | null
          created_at: string | null
          current_function: string | null
          current_occupancy: number | null
          description: string | null
          floor_id: string | null
          floor_name: string | null
          floor_number: number | null
          id: string | null
          is_storage: boolean | null
          name: string | null
          phone_number: string | null
          room_number: string | null
          room_type: string | null
          space_type: string | null
          status: string | null
          storage_type: string | null
          updated_at: string | null
        }
        Relationships: []
      }
      spaces_dashboard_mv: {
        Row: {
          building_id: string | null
          building_name: string | null
          created_at: string | null
          current_occupancy: number | null
          floor_id: string | null
          floor_name: string | null
          id: string | null
          name: string | null
          room_type: Database["public"]["Enums"]["room_type_enum"] | null
          space_type: string | null
          status: Database["public"]["Enums"]["status_enum"] | null
          updated_at: string | null
        }
        Relationships: []
      }
      staff_out_today: {
        Row: {
          kind: Database["public"]["Enums"]["absence_kind"] | null
          role: string | null
          staff_id: string | null
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
      v_office_elevator_card_holdings: {
        Row: {
          key_id: string | null
          office_name: string | null
          quantity_held: number | null
        }
        Relationships: [
          {
            foreignKeyName: "office_elevator_card_allocations_key_id_fkey"
            columns: ["key_id"]
            isOneToOne: false
            referencedRelation: "key_inventory_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "office_elevator_card_allocations_key_id_fkey"
            columns: ["key_id"]
            isOneToOne: false
            referencedRelation: "key_statistics_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "office_elevator_card_allocations_key_id_fkey"
            columns: ["key_id"]
            isOneToOne: false
            referencedRelation: "keys"
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
      adjust_inventory_quantity: {
        Args:
          | {
              item_id: string
              notes?: string
              quantity_change: number
              reference_id?: string
              transaction_type: string
            }
          | {
              p_item_id: string
              p_notes?: string
              p_quantity_change: number
              p_transaction_type: string
            }
        Returns: undefined
      }
      admin_update_user_role: {
        Args: {
          new_role: Database["public"]["Enums"]["user_role"]
          target_user_id: string
        }
        Returns: Json
      }
      advance_fulfillment_stage: {
        Args: {
          p_metadata?: Json
          p_notes?: string
          p_request_id: string
          p_stage: string
        }
        Returns: undefined
      }
      advance_key_order_status: {
        Args: { p_fulfilled_by?: string; p_notes?: string; p_order_id: string }
        Returns: undefined
      }
      approve_user: {
        Args: { user_id: string }
        Returns: undefined
      }
      assign_key_if_available: {
        Args:
          | { is_spare?: boolean; key_id: string; occupant_id: string }
          | { key_id: string; occupant_id: string }
        Returns: Json
      }
      assign_user_role: {
        Args: {
          new_role: Database["public"]["Enums"]["user_role"]
          reason?: string
          target_user_id: string
        }
        Returns: undefined
      }
      audit_sensitive_access: {
        Args:
          | {
              p_action: string
              p_context: Json
              p_target_id_text: string
              p_target_table: string
            }
          | {
              p_action: string
              p_context?: Json
              p_target_id?: string
              p_target_table: string
            }
        Returns: undefined
      }
      audit_user_action: {
        Args: { action_type: string; details?: Json; target_resource: string }
        Returns: undefined
      }
      audit_user_role_change: {
        Args: {
          new_role: string
          old_role: string
          reason?: string
          target_user_id: string
        }
        Returns: undefined
      }
      begin_transaction: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      bulk_update_assignment_status: {
        Args: {
          assignment_ids: string[]
          new_status: string
          update_notes?: string
        }
        Returns: number
      }
      can_user_manage_roles: {
        Args: { target_user_id: string }
        Returns: boolean
      }
      change_user_password: {
        Args: { new_password: string }
        Returns: Json
      }
      check_admin_privileges: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      check_admin_status: {
        Args: { user_email?: string } | { user_id: string }
        Returns: boolean
      }
      check_production_security: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      check_rate_limit: {
        Args:
          | {
              action_name: string
              max_attempts?: number
              window_minutes?: number
            }
          | {
              action_type: string
              max_attempts?: number
              time_window?: unknown
            }
          | {
              p_attempt_type: string
              p_identifier: string
              p_max_attempts?: number
              p_window_minutes?: number
            }
        Returns: boolean
      }
      check_relocation_conflicts: {
        Args: { p_end_date: string; p_room_id: string; p_start_date: string }
        Returns: {
          conflict_end_date: string
          conflict_start_date: string
          conflict_type: string
          conflicting_relocation_id: string
        }[]
      }
      check_security_compliance: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_old_backups: {
        Args: { policy_id: string }
        Returns: undefined
      }
      cleanup_rate_limits: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      clear_app_cache: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      commit_transaction: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      complete_backup_restoration: {
        Args: { error_msg?: string; restoration_id: string; success: boolean }
        Returns: undefined
      }
      complete_supply_request_work: {
        Args: { p_notes?: string; p_request_id: string }
        Returns: undefined
      }
      create_assignment_batch: {
        Args: { batch_metadata: Json; creator_id: string }
        Returns: string
      }
      create_emergency_admin: {
        Args: { user_email: string }
        Returns: undefined
      }
      create_key_order: {
        Args: {
          p_expected_delivery_date?: string
          p_key_id: string
          p_notes?: string
          p_quantity: number
          p_recipient_id?: string
          p_requestor_id: string
        }
        Returns: string
      }
      create_security_alert: {
        Args: { alert_type: string; details?: Json; severity?: string }
        Returns: string
      }
      create_user_notification: {
        Args: {
          p_action_url?: string
          p_message: string
          p_metadata?: Json
          p_related_id?: string
          p_title: string
          p_type: string
          p_urgency?: string
          p_user_id: string
        }
        Returns: string
      }
      demote_admin_user: {
        Args: {
          new_role?: Database["public"]["Enums"]["user_role"]
          target_user_id: string
        }
        Returns: undefined
      }
      detect_overdue_assignments: {
        Args: Record<PropertyKey, never>
        Returns: {
          assigned_at: string
          assignment_id: string
          days_overdue: number
          key_name: string
          occupant_name: string
        }[]
      }
      emit_admin_notification: {
        Args: {
          p_message: string
          p_metadata?: Json
          p_related_id?: string
          p_related_table?: string
          p_title: string
          p_type: string
          p_urgency?: string
        }
        Returns: string
      }
      enhanced_check_rate_limit: {
        Args: {
          p_attempt_type: string
          p_identifier: string
          p_max_attempts?: number
          p_window_minutes?: number
        }
        Returns: boolean
      }
      enhanced_security_monitor: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      ensure_admin_user: {
        Args: { user_email: string }
        Returns: {
          message: string
          success: boolean
          user_id: string
        }[]
      }
      find_doors_by_room_number: {
        Args: { p_room_number: string }
        Returns: {
          id: string
          label: string
          room_type: string
          status: string
        }[]
      }
      fn_allocate_elevator_cards_to_office: {
        Args: {
          p_key_id: string
          p_notes?: string
          p_office_name?: string
          p_quantity: number
        }
        Returns: undefined
      }
      fn_issue_elevator_pass: {
        Args: {
          p_expected_return_at: string
          p_key_id: string
          p_notes: string
          p_occupant_id: string
          p_reason: string
          p_recipient_email: string
          p_recipient_name: string
          p_recipient_type: string
        }
        Returns: string
      }
      fulfill_supply_request: {
        Args: { p_fulfillment_notes?: string; p_request_id: string }
        Returns: undefined
      }
      generate_issue_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_security_alert: {
        Args: {
          alert_type: string
          message: string
          metadata?: Json
          severity: string
          target_admins?: boolean
          title: string
        }
        Returns: string
      }
      get_building_hierarchy: {
        Args: Record<PropertyKey, never>
        Returns: {
          active_spaces: number
          building_address: string
          building_id: string
          building_name: string
          door_count: number
          floor_id: string
          floor_name: string
          floor_number: number
          hallway_count: number
          room_count: number
          total_issues: number
          total_occupants: number
          total_spaces: number
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
          connection_type: string
          id: string
          label: string
          type: Database["public"]["Enums"]["floor_plan_object_type"]
        }[]
      }
      get_court_maintenance_info: {
        Args: Record<PropertyKey, never>
        Returns: {
          court_id: string
          maintenance_end_date: string
          maintenance_notes: string
          maintenance_start_date: string
          maintenance_status: string
          maintenance_title: string
          room_number: string
          schedule_id: string
          schedule_status: string
          scheduled_end_date: string
          scheduled_start_date: string
        }[]
      }
      get_court_personnel: {
        Args: Record<PropertyKey, never>
        Returns: {
          access_level: string
          created_at: string
          department: string
          email: string
          first_name: string
          id: string
          last_name: string
          role: string
          updated_at: string
        }[]
      }
      get_courtroom_availability: {
        Args: Record<PropertyKey, never>
        Returns: {
          accessibility_features: Json
          availability_status: string
          courtroom_number: string
          id: string
          is_active: boolean
          juror_capacity: number
          maintenance_status: string
          notes: string
          room_number: string
          spectator_capacity: number
        }[]
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["user_role"]
      }
      get_dashboard_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          available_rooms: number
          maintenance_rooms: number
          occupied_rooms: number
          total_rooms: number
        }[]
      }
      get_door_room_details: {
        Args: { door_id: string }
        Returns: {
          room_number: string
          room_type: string
          status: string
        }[]
      }
      get_door_status: {
        Args: { door_id: string }
        Returns: string
      }
      get_energy_analytics: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_enhanced_room: {
        Args: { p_room_id: string }
        Returns: Json
      }
      get_facility_analytics: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_key_inventory_summary: {
        Args: Record<PropertyKey, never>
        Returns: {
          available_quantity: number
          key_id: string
          key_name: string
          key_type: string
          reserved_quantity: number
          status: string
          total_quantity: number
        }[]
      }
      get_next_lighting_sequence: {
        Args: { p_space_id: string }
        Returns: number
      }
      get_parent_chain: {
        Args: { child_room_id: string }
        Returns: {
          level: number
          parent_id: string
          parent_name: string
          parent_room_number: string
        }[]
      }
      get_rate_limit_status: {
        Args: { p_attempt_type?: string; p_identifier: string }
        Returns: {
          attempt_type: string
          attempts: number
          blocked_until: string
          identifier: string
          is_blocked: boolean
          last_attempt: string
        }[]
      }
      get_request_header: {
        Args: { header_name: string }
        Returns: string
      }
      get_request_headers: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_room_assignments_with_details: {
        Args: { p_room_id?: string }
        Returns: {
          assigned_at: string
          assignment_id: string
          assignment_type: string
          building_name: string
          floor_name: string
          is_primary: boolean
          occupant_id: string
          occupant_name: string
          room_id: string
          room_number: string
        }[]
      }
      get_room_details: {
        Args: { p_space_id?: string }
        Returns: {
          building_id: string
          building_name: string
          capacity: number
          created_at: string
          description: string
          floor_id: string
          floor_name: string
          name: string
          room_number: string
          room_type: string
          space_id: string
          status: string
          updated_at: string
        }[]
      }
      get_room_size_category: {
        Args: { room_height: number; room_width: number }
        Returns: string
      }
      get_room_size_from_data: {
        Args: { room_size_data: Json }
        Returns: string
      }
      get_security_dashboard: {
        Args: Record<PropertyKey, never>
        Returns: {
          active_critical_incidents: number
          admin_users: number
          approved_users: number
          blocked_login_attempts: number
          dashboard_generated_at: string
          recent_admin_actions: number
          security_events_24h: number
        }[]
      }
      get_spaces_dashboard: {
        Args: {
          p_building_id?: string
          p_floor_id?: string
          p_space_type?: string
        }
        Returns: {
          building_name: string
          capacity: number
          fixture_count: number
          floor_name: string
          issue_count: number
          name: string
          occupancy_count: number
          room_number: string
          space_id: string
          space_type: string
          status: string
        }[]
      }
      get_spaces_dashboard_data: {
        Args: { building_filter?: string; space_type_filter?: string }
        Returns: {
          building_name: string
          fixture_count: number
          floor_name: string
          floor_number: number
          id: string
          is_storage: boolean
          issue_count: number
          name: string
          occupant_count: number
          open_issue_count: number
          room_number: string
          room_type: string
          space_type: string
          status: string
        }[]
      }
      get_system_health: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_user_role: {
        Args: { user_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      get_user_verification_data: {
        Args: Record<PropertyKey, never>
        Returns: {
          created_at: string
          department: string
          email: string
          first_name: string
          id: string
          is_approved: boolean
          last_name: string
          updated_at: string
          user_role: Database["public"]["Enums"]["user_role"]
        }[]
      }
      get_user_verification_info: {
        Args: Record<PropertyKey, never>
        Returns: {
          created_at: string
          email: string
          first_name: string
          last_name: string
          role: string
          user_id: string
          verification_status: string
        }[]
      }
      has_role: {
        Args: { check_role: Database["public"]["Enums"]["user_role"] }
        Returns: boolean
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
      invalidate_user_sessions: {
        Args: { target_user_id?: string }
        Returns: undefined
      }
      is_account_locked: {
        Args: { user_email: string }
        Returns: boolean
      }
      is_admin: {
        Args: Record<PropertyKey, never> | { user_id: string }
        Returns: boolean
      }
      is_admin_or_authorized: {
        Args: { target_user_id: string }
        Returns: boolean
      }
      is_courtroom: {
        Args: { room_type: string }
        Returns: boolean
      }
      is_current_user_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      list_occupants_minimal: {
        Args: Record<PropertyKey, never>
        Returns: {
          department: string
          first_name: string
          id: string
          last_name: string
          title: string
        }[]
      }
      list_personnel_profiles_minimal: {
        Args: Record<PropertyKey, never>
        Returns: {
          department: string
          display_name: string
          full_name: string
          id: string
          is_active: boolean
          primary_role: string
          title: string
        }[]
      }
      log_profile_access_row: {
        Args: { p: Database["public"]["Tables"]["profiles"]["Row"] }
        Returns: boolean
      }
      log_security_event: {
        Args:
          | {
              action_type: string
              details?: Json
              resource_id?: string
              resource_type?: string
            }
          | {
              p_action: string
              p_details?: Json
              p_ip_address?: unknown
              p_resource_id?: string
              p_resource_type: string
              p_user_agent?: string
            }
          | {
              p_action: string
              p_details?: string
              p_ip_address?: string
              p_resource_id?: string
              p_resource_type: string
              p_user_agent?: string
            }
        Returns: undefined
      }
      log_security_operation: {
        Args: {
          error_message?: string
          operation_details?: Json
          operation_type: string
          success?: boolean
          target_resource?: string
        }
        Returns: undefined
      }
      mark_clerk_presence: {
        Args: {
          p_actor: string
          p_clerk_name: string
          p_present: boolean
          p_room_id: string
        }
        Returns: undefined
      }
      mark_presence: {
        Args: {
          p_actor: string
          p_present: boolean
          p_role: string
          p_room: string
        }
        Returns: undefined
      }
      migrate_spaces_data: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      move_judge: {
        Args: {
          p_actor: string
          p_from_room_id: string
          p_is_covering?: boolean
          p_judge_name: string
          p_to_room_id: string
        }
        Returns: undefined
      }
      normalize_email: {
        Args: { txt: string }
        Returns: string
      }
      process_key_order_receipt: {
        Args: {
          p_order_id: string
          p_performed_by: string
          p_quantity_received: number
        }
        Returns: undefined
      }
      promote_user_to_admin: {
        Args: { target_user_id: string }
        Returns: undefined
      }
      refresh_all_materialized_views: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      refresh_analytics_cache: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      refresh_materialized_view: {
        Args: { view_name: string }
        Returns: undefined
      }
      refresh_spaces_dashboard: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      remove_user_role: {
        Args: { reason?: string; target_user_id: string }
        Returns: undefined
      }
      reset_rate_limit: {
        Args: { p_attempt_type?: string; p_identifier: string }
        Returns: boolean
      }
      rollback_transaction: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      run_security_health_check: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      safe_current_setting: {
        Args: { setting_name: string }
        Returns: string
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
          p_notes?: string
          p_performed_by?: string
          p_status?: string
        }
        Returns: undefined
      }
      sanitize_input: {
        Args: { input_text: string }
        Returns: string
      }
      search_spaces: {
        Args: {
          p_building_id?: string
          p_search_term: string
          p_space_type?: string
        }
        Returns: {
          building_name: string
          floor_name: string
          name: string
          relevance_score: number
          room_number: string
          space_id: string
          space_type: string
        }[]
      }
      secure_admin_promotion: {
        Args: { target_email: string }
        Returns: Json
      }
      secure_promote_to_admin: {
        Args: { target_email: string }
        Returns: Json
      }
      secure_role_assignment: {
        Args: { new_role: string; target_user_id: string }
        Returns: boolean
      }
      security_health_check: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      setup_emergency_admin: {
        Args: { user_email: string }
        Returns: Json
      }
      start_supply_request_work: {
        Args: { p_request_id: string }
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
      validate_email: {
        Args: { email_to_validate: string }
        Returns: Json
      }
      validate_email_format: {
        Args: { email: string }
        Returns: boolean
      }
      validate_floor_plan_connection: {
        Args: { source_id: string; target_id: string }
        Returns: boolean
      }
      validate_nycourt_email: {
        Args: { email: string }
        Returns: boolean
      }
      validate_password_strength: {
        Args: { password: string }
        Returns: Json
      }
      validate_session_security: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      validate_simple_password: {
        Args: { password: string }
        Returns: Json
      }
      validate_text_input: {
        Args: { input_text: string; max_length?: number; required?: boolean }
        Returns: boolean
      }
      validate_user_session: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      absence_kind: "vacation" | "sick" | "personal" | "training" | "other"
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
      hallway_section_enum:
        | "left_wing"
        | "right_wing"
        | "connector"
        | "main"
        | "north_east"
        | "north_west"
        | "center_east"
        | "center_west"
        | "south_east"
        | "south_west"
      hallway_section_enum_new:
        | "main"
        | "north_east"
        | "north_west"
        | "center_east"
        | "center_west"
        | "south_east"
        | "south_west"
        | "connector"
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
      key_order_status:
        | "pending_fulfillment"
        | "ordered"
        | "in_transit"
        | "received"
        | "ready_for_pickup"
        | "delivered"
        | "completed"
        | "cancelled"
        | "partially_received"
      key_request_status:
        | "pending"
        | "under_review"
        | "approved"
        | "rejected"
        | "cancelled"
        | "fulfilled"
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
      request_type_enum: "spare" | "replacement" | "new"
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
      simplified_storage_type_enum:
        | "files"
        | "supplies"
        | "furniture"
        | "equipment"
        | "general"
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
      user_role:
        | "admin"
        | "standard"
        | "judge"
        | "court_aide"
        | "clerk"
        | "sergeant"
        | "court_officer"
        | "bailiff"
        | "court_reporter"
        | "administrative_assistant"
        | "facilities_manager"
        | "supply_room_staff"
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
      absence_kind: ["vacation", "sick", "personal", "training", "other"],
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
      hallway_section_enum: [
        "left_wing",
        "right_wing",
        "connector",
        "main",
        "north_east",
        "north_west",
        "center_east",
        "center_west",
        "south_east",
        "south_west",
      ],
      hallway_section_enum_new: [
        "main",
        "north_east",
        "north_west",
        "center_east",
        "center_west",
        "south_east",
        "south_west",
        "connector",
      ],
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
      key_order_status: [
        "pending_fulfillment",
        "ordered",
        "in_transit",
        "received",
        "ready_for_pickup",
        "delivered",
        "completed",
        "cancelled",
        "partially_received",
      ],
      key_request_status: [
        "pending",
        "under_review",
        "approved",
        "rejected",
        "cancelled",
        "fulfilled",
      ],
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
      request_type_enum: ["spare", "replacement", "new"],
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
      simplified_storage_type_enum: [
        "files",
        "supplies",
        "furniture",
        "equipment",
        "general",
      ],
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
      user_role: [
        "admin",
        "standard",
        "judge",
        "court_aide",
        "clerk",
        "sergeant",
        "court_officer",
        "bailiff",
        "court_reporter",
        "administrative_assistant",
        "facilities_manager",
        "supply_room_staff",
      ],
      verification_status_enum: ["pending", "verified", "rejected"],
      zone_type_enum: ["general", "emergency", "restricted"],
    },
  },
} as const
