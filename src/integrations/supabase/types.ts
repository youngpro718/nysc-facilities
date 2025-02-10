export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
      doors: {
        Row: {
          access_log: Json[] | null
          created_at: string | null
          emergency_protocol: Json | null
          floor_id: string
          id: string
          last_maintenance_date: string | null
          maintenance_history: Json[] | null
          maintenance_schedule: Json[] | null
          name: string
          next_maintenance_date: string | null
          passkey_enabled: boolean | null
          security_config: Json | null
          security_level: string | null
          status: Database["public"]["Enums"]["status_enum"]
          status_history: Json[] | null
          type: Database["public"]["Enums"]["door_type_enum"]
          updated_at: string | null
        }
        Insert: {
          access_log?: Json[] | null
          created_at?: string | null
          emergency_protocol?: Json | null
          floor_id: string
          id?: string
          last_maintenance_date?: string | null
          maintenance_history?: Json[] | null
          maintenance_schedule?: Json[] | null
          name: string
          next_maintenance_date?: string | null
          passkey_enabled?: boolean | null
          security_config?: Json | null
          security_level?: string | null
          status?: Database["public"]["Enums"]["status_enum"]
          status_history?: Json[] | null
          type: Database["public"]["Enums"]["door_type_enum"]
          updated_at?: string | null
        }
        Update: {
          access_log?: Json[] | null
          created_at?: string | null
          emergency_protocol?: Json | null
          floor_id?: string
          id?: string
          last_maintenance_date?: string | null
          maintenance_history?: Json[] | null
          maintenance_schedule?: Json[] | null
          name?: string
          next_maintenance_date?: string | null
          passkey_enabled?: boolean | null
          security_config?: Json | null
          security_level?: string | null
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
        ]
      }
      floor_plan_objects: {
        Row: {
          created_at: string | null
          floor_id: string
          height: number
          id: string
          metadata: Json | null
          object_id: string
          object_type: string
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
            foreignKeyName: "fk_floor_plan_objects_rooms"
            columns: ["object_id"]
            isOneToOne: false
            referencedRelation: "room_function_history"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_floor_plan_objects_rooms"
            columns: ["object_id"]
            isOneToOne: false
            referencedRelation: "room_lighting_status"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "fk_floor_plan_objects_rooms"
            columns: ["object_id"]
            isOneToOne: false
            referencedRelation: "room_occupancy_stats"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "fk_floor_plan_objects_rooms"
            columns: ["object_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_floor_plan_objects_rooms"
            columns: ["object_id"]
            isOneToOne: false
            referencedRelation: "storage_room_inventory"
            referencedColumns: ["room_id"]
          },
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
          floorplan_id: string | null
          id: string
          name: string
          order_index: number
          type: string
          updated_at: string | null
          visible: boolean | null
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          floorplan_id?: string | null
          id?: string
          name: string
          order_index: number
          type: string
          updated_at?: string | null
          visible?: boolean | null
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          floorplan_id?: string | null
          id?: string
          name?: string
          order_index?: number
          type?: string
          updated_at?: string | null
          visible?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "floorplan_layers_floorplan_id_fkey"
            columns: ["floorplan_id"]
            isOneToOne: false
            referencedRelation: "floorplans"
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
            referencedRelation: "room_function_history"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_floorplan_objects_rooms"
            columns: ["object_id"]
            isOneToOne: false
            referencedRelation: "room_lighting_status"
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
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_floorplan_objects_rooms"
            columns: ["object_id"]
            isOneToOne: false
            referencedRelation: "storage_room_inventory"
            referencedColumns: ["room_id"]
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
          section: Database["public"]["Enums"]["hallway_section_enum"] | null
          security_level: string | null
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
          section?: Database["public"]["Enums"]["hallway_section_enum"] | null
          security_level?: string | null
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
          section?: Database["public"]["Enums"]["hallway_section_enum"] | null
          security_level?: string | null
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
      inventory_categories: {
        Row: {
          color: Database["public"]["Enums"]["category_color_enum"]
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          color?: Database["public"]["Enums"]["category_color_enum"]
          created_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          color?: Database["public"]["Enums"]["category_color_enum"]
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
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
          quantity: number
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
          quantity?: number
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
          quantity?: number
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
          {
            foreignKeyName: "inventory_items_storage_room_id_fkey"
            columns: ["storage_room_id"]
            isOneToOne: false
            referencedRelation: "room_function_history"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_storage_room_id_fkey"
            columns: ["storage_room_id"]
            isOneToOne: false
            referencedRelation: "room_lighting_status"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "inventory_items_storage_room_id_fkey"
            columns: ["storage_room_id"]
            isOneToOne: false
            referencedRelation: "room_occupancy_stats"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "inventory_items_storage_room_id_fkey"
            columns: ["storage_room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_storage_room_id_fkey"
            columns: ["storage_room_id"]
            isOneToOne: false
            referencedRelation: "storage_room_inventory"
            referencedColumns: ["room_id"]
          },
        ]
      }
      inventory_transactions: {
        Row: {
          created_at: string | null
          from_room_id: string | null
          id: string
          item_id: string | null
          notes: string | null
          performed_by: string | null
          quantity: number
          to_room_id: string | null
          transaction_type: string
        }
        Insert: {
          created_at?: string | null
          from_room_id?: string | null
          id?: string
          item_id?: string | null
          notes?: string | null
          performed_by?: string | null
          quantity: number
          to_room_id?: string | null
          transaction_type: string
        }
        Update: {
          created_at?: string | null
          from_room_id?: string | null
          id?: string
          item_id?: string | null
          notes?: string | null
          performed_by?: string | null
          quantity?: number
          to_room_id?: string | null
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_transactions_from_room_id_fkey"
            columns: ["from_room_id"]
            isOneToOne: false
            referencedRelation: "room_function_history"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_from_room_id_fkey"
            columns: ["from_room_id"]
            isOneToOne: false
            referencedRelation: "room_lighting_status"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "inventory_transactions_from_room_id_fkey"
            columns: ["from_room_id"]
            isOneToOne: false
            referencedRelation: "room_occupancy_stats"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "inventory_transactions_from_room_id_fkey"
            columns: ["from_room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_from_room_id_fkey"
            columns: ["from_room_id"]
            isOneToOne: false
            referencedRelation: "storage_room_inventory"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "inventory_transactions_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "low_stock_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "storage_room_inventory"
            referencedColumns: ["item_id"]
          },
          {
            foreignKeyName: "inventory_transactions_to_room_id_fkey"
            columns: ["to_room_id"]
            isOneToOne: false
            referencedRelation: "room_function_history"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_to_room_id_fkey"
            columns: ["to_room_id"]
            isOneToOne: false
            referencedRelation: "room_lighting_status"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "inventory_transactions_to_room_id_fkey"
            columns: ["to_room_id"]
            isOneToOne: false
            referencedRelation: "room_occupancy_stats"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "inventory_transactions_to_room_id_fkey"
            columns: ["to_room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_to_room_id_fkey"
            columns: ["to_room_id"]
            isOneToOne: false
            referencedRelation: "storage_room_inventory"
            referencedColumns: ["room_id"]
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
        Relationships: [
          {
            foreignKeyName: "issue_comments_issue_id_fkey"
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
          type: Database["public"]["Enums"]["issue_type_enum"]
          updated_at: string | null
        }
        Insert: {
          conditions: Json
          created_at?: string | null
          id?: string
          priority: string
          subcategory?: string | null
          type: Database["public"]["Enums"]["issue_type_enum"]
          updated_at?: string | null
        }
        Update: {
          conditions?: Json
          created_at?: string | null
          id?: string
          priority?: string
          subcategory?: string | null
          type?: Database["public"]["Enums"]["issue_type_enum"]
          updated_at?: string | null
        }
        Relationships: []
      }
      issue_routing_rules: {
        Row: {
          assigned_to: Database["public"]["Enums"]["party_enum"]
          conditions: Json
          created_at: string | null
          id: string
          subcategory: string | null
          type: Database["public"]["Enums"]["issue_type_enum"]
          updated_at: string | null
        }
        Insert: {
          assigned_to: Database["public"]["Enums"]["party_enum"]
          conditions: Json
          created_at?: string | null
          id?: string
          subcategory?: string | null
          type: Database["public"]["Enums"]["issue_type_enum"]
          updated_at?: string | null
        }
        Update: {
          assigned_to?: Database["public"]["Enums"]["party_enum"]
          conditions?: Json
          created_at?: string | null
          id?: string
          subcategory?: string | null
          type?: Database["public"]["Enums"]["issue_type_enum"]
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
          default_assigned_to: Database["public"]["Enums"]["party_enum"] | null
          default_priority: string | null
          id: string
          optional_fields: Json | null
          required_fields: Json | null
          subcategory: string | null
          type: Database["public"]["Enums"]["issue_type_enum"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          default_assigned_to?: Database["public"]["Enums"]["party_enum"] | null
          default_priority?: string | null
          id?: string
          optional_fields?: Json | null
          required_fields?: Json | null
          subcategory?: string | null
          type: Database["public"]["Enums"]["issue_type_enum"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          default_assigned_to?: Database["public"]["Enums"]["party_enum"] | null
          default_priority?: string | null
          id?: string
          optional_fields?: Json | null
          required_fields?: Json | null
          subcategory?: string | null
          type?: Database["public"]["Enums"]["issue_type_enum"]
          updated_at?: string | null
        }
        Relationships: []
      }
      issues: {
        Row: {
          assigned_to: Database["public"]["Enums"]["party_enum"]
          building_id: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          fixture_id: string | null
          floor_id: string | null
          id: string
          labels: string[] | null
          last_activity_at: string | null
          lighting_details: Json | null
          lighting_inspection_due_date: string | null
          lighting_maintenance_history: Json[] | null
          lighting_maintenance_priority: string | null
          lighting_previous_states: Json[] | null
          mentions: string[] | null
          photos: string[] | null
          priority: string | null
          related_issues: string[] | null
          resolution_notes: string | null
          resolution_time: unknown | null
          resolved_at: string | null
          room_id: string | null
          seen: boolean | null
          sla_hours: number | null
          status: Database["public"]["Enums"]["issue_status_enum"] | null
          status_history: Json[] | null
          subcategory: string | null
          template_fields: Json | null
          title: string
          type: Database["public"]["Enums"]["issue_type_enum"]
          updated_at: string | null
        }
        Insert: {
          assigned_to: Database["public"]["Enums"]["party_enum"]
          building_id?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          fixture_id?: string | null
          floor_id?: string | null
          id?: string
          labels?: string[] | null
          last_activity_at?: string | null
          lighting_details?: Json | null
          lighting_inspection_due_date?: string | null
          lighting_maintenance_history?: Json[] | null
          lighting_maintenance_priority?: string | null
          lighting_previous_states?: Json[] | null
          mentions?: string[] | null
          photos?: string[] | null
          priority?: string | null
          related_issues?: string[] | null
          resolution_notes?: string | null
          resolution_time?: unknown | null
          resolved_at?: string | null
          room_id?: string | null
          seen?: boolean | null
          sla_hours?: number | null
          status?: Database["public"]["Enums"]["issue_status_enum"] | null
          status_history?: Json[] | null
          subcategory?: string | null
          template_fields?: Json | null
          title: string
          type: Database["public"]["Enums"]["issue_type_enum"]
          updated_at?: string | null
        }
        Update: {
          assigned_to?: Database["public"]["Enums"]["party_enum"]
          building_id?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          fixture_id?: string | null
          floor_id?: string | null
          id?: string
          labels?: string[] | null
          last_activity_at?: string | null
          lighting_details?: Json | null
          lighting_inspection_due_date?: string | null
          lighting_maintenance_history?: Json[] | null
          lighting_maintenance_priority?: string | null
          lighting_previous_states?: Json[] | null
          mentions?: string[] | null
          photos?: string[] | null
          priority?: string | null
          related_issues?: string[] | null
          resolution_notes?: string | null
          resolution_time?: unknown | null
          resolved_at?: string | null
          room_id?: string | null
          seen?: boolean | null
          sla_hours?: number | null
          status?: Database["public"]["Enums"]["issue_status_enum"] | null
          status_history?: Json[] | null
          subcategory?: string | null
          template_fields?: Json | null
          title?: string
          type?: Database["public"]["Enums"]["issue_type_enum"]
          updated_at?: string | null
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
            referencedRelation: "emergency_lighting_status"
            referencedColumns: ["id"]
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
            referencedRelation: "lighting_fixture_details"
            referencedColumns: ["id"]
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
            foreignKeyName: "issues_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_function_history"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issues_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_lighting_status"
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
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issues_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "storage_room_inventory"
            referencedColumns: ["room_id"]
          },
        ]
      }
      key_assignments: {
        Row: {
          assigned_at: string
          created_at: string | null
          department: string | null
          expected_return_date: string | null
          id: string
          is_spare: boolean | null
          key_id: string
          notes: string | null
          occupant_id: string | null
          purpose: string | null
          return_reason:
            | Database["public"]["Enums"]["return_reason_enum"]
            | null
          returned_at: string | null
          spare_key_approved_at: string | null
          spare_key_approved_by: string | null
          spare_key_reason: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_at?: string
          created_at?: string | null
          department?: string | null
          expected_return_date?: string | null
          id?: string
          is_spare?: boolean | null
          key_id: string
          notes?: string | null
          occupant_id?: string | null
          purpose?: string | null
          return_reason?:
            | Database["public"]["Enums"]["return_reason_enum"]
            | null
          returned_at?: string | null
          spare_key_approved_at?: string | null
          spare_key_approved_by?: string | null
          spare_key_reason?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_at?: string
          created_at?: string | null
          department?: string | null
          expected_return_date?: string | null
          id?: string
          is_spare?: boolean | null
          key_id?: string
          notes?: string | null
          occupant_id?: string | null
          purpose?: string | null
          return_reason?:
            | Database["public"]["Enums"]["return_reason_enum"]
            | null
          returned_at?: string | null
          spare_key_approved_at?: string | null
          spare_key_approved_by?: string | null
          spare_key_reason?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "key_assignments_key_id_fkey"
            columns: ["key_id"]
            isOneToOne: false
            referencedRelation: "available_keys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "key_assignments_key_id_fkey"
            columns: ["key_id"]
            isOneToOne: false
            referencedRelation: "key_access_points"
            referencedColumns: ["key_id"]
          },
          {
            foreignKeyName: "key_assignments_key_id_fkey"
            columns: ["key_id"]
            isOneToOne: false
            referencedRelation: "key_inventory_stats"
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
          created_at: string | null
          details: Json | null
          id: string
          key_id: string | null
          new_quantity: number | null
          performed_by: string | null
          previous_quantity: number | null
          related_transaction_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string | null
          details?: Json | null
          id?: string
          key_id?: string | null
          new_quantity?: number | null
          performed_by?: string | null
          previous_quantity?: number | null
          related_transaction_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          key_id?: string | null
          new_quantity?: number | null
          performed_by?: string | null
          previous_quantity?: number | null
          related_transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "key_audit_logs_key_id_fkey"
            columns: ["key_id"]
            isOneToOne: false
            referencedRelation: "available_keys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "key_audit_logs_key_id_fkey"
            columns: ["key_id"]
            isOneToOne: false
            referencedRelation: "key_access_points"
            referencedColumns: ["key_id"]
          },
          {
            foreignKeyName: "key_audit_logs_key_id_fkey"
            columns: ["key_id"]
            isOneToOne: false
            referencedRelation: "key_inventory_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "key_audit_logs_key_id_fkey"
            columns: ["key_id"]
            isOneToOne: false
            referencedRelation: "keys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "key_audit_logs_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "key_audit_logs_related_transaction_id_fkey"
            columns: ["related_transaction_id"]
            isOneToOne: false
            referencedRelation: "key_stock_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      key_door_locations: {
        Row: {
          created_at: string | null
          door_location: string
          id: string
          key_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          door_location: string
          id?: string
          key_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          door_location?: string
          id?: string
          key_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "key_door_locations_key_id_fkey"
            columns: ["key_id"]
            isOneToOne: false
            referencedRelation: "available_keys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "key_door_locations_key_id_fkey"
            columns: ["key_id"]
            isOneToOne: false
            referencedRelation: "key_access_points"
            referencedColumns: ["key_id"]
          },
          {
            foreignKeyName: "key_door_locations_key_id_fkey"
            columns: ["key_id"]
            isOneToOne: false
            referencedRelation: "key_inventory_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "key_door_locations_key_id_fkey"
            columns: ["key_id"]
            isOneToOne: false
            referencedRelation: "keys"
            referencedColumns: ["id"]
          },
        ]
      }
      key_inventory: {
        Row: {
          created_at: string | null
          discrepancy_notes: string | null
          expected_quantity: number | null
          id: string
          key_id: string
          last_audit_date: string | null
          last_audited_by: string | null
          quantity: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          discrepancy_notes?: string | null
          expected_quantity?: number | null
          id?: string
          key_id: string
          last_audit_date?: string | null
          last_audited_by?: string | null
          quantity?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          discrepancy_notes?: string | null
          expected_quantity?: number | null
          id?: string
          key_id?: string
          last_audit_date?: string | null
          last_audited_by?: string | null
          quantity?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "key_inventory_key_id_fkey"
            columns: ["key_id"]
            isOneToOne: false
            referencedRelation: "available_keys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "key_inventory_key_id_fkey"
            columns: ["key_id"]
            isOneToOne: false
            referencedRelation: "key_access_points"
            referencedColumns: ["key_id"]
          },
          {
            foreignKeyName: "key_inventory_key_id_fkey"
            columns: ["key_id"]
            isOneToOne: false
            referencedRelation: "key_inventory_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "key_inventory_key_id_fkey"
            columns: ["key_id"]
            isOneToOne: false
            referencedRelation: "keys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "key_inventory_last_audited_by_fkey"
            columns: ["last_audited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      key_stock_transactions: {
        Row: {
          created_at: string | null
          id: string
          key_id: string | null
          notes: string | null
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
            referencedRelation: "available_keys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "key_stock_transactions_key_id_fkey"
            columns: ["key_id"]
            isOneToOne: false
            referencedRelation: "key_access_points"
            referencedColumns: ["key_id"]
          },
          {
            foreignKeyName: "key_stock_transactions_key_id_fkey"
            columns: ["key_id"]
            isOneToOne: false
            referencedRelation: "key_inventory_stats"
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
            foreignKeyName: "key_stock_transactions_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      keys: {
        Row: {
          available_quantity: number | null
          building_id: string | null
          created_at: string | null
          door_id: string | null
          floor_id: string | null
          id: string
          is_passkey: boolean | null
          key_scope: string | null
          name: string
          room_id: string | null
          status: Database["public"]["Enums"]["key_status_enum"] | null
          total_quantity: number | null
          type: Database["public"]["Enums"]["key_type_enum"]
          updated_at: string | null
        }
        Insert: {
          available_quantity?: number | null
          building_id?: string | null
          created_at?: string | null
          door_id?: string | null
          floor_id?: string | null
          id?: string
          is_passkey?: boolean | null
          key_scope?: string | null
          name: string
          room_id?: string | null
          status?: Database["public"]["Enums"]["key_status_enum"] | null
          total_quantity?: number | null
          type: Database["public"]["Enums"]["key_type_enum"]
          updated_at?: string | null
        }
        Update: {
          available_quantity?: number | null
          building_id?: string | null
          created_at?: string | null
          door_id?: string | null
          floor_id?: string | null
          id?: string
          is_passkey?: boolean | null
          key_scope?: string | null
          name?: string
          room_id?: string | null
          status?: Database["public"]["Enums"]["key_status_enum"] | null
          total_quantity?: number | null
          type?: Database["public"]["Enums"]["key_type_enum"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "keys_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "keys_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "lighting_assignments"
            referencedColumns: ["building_id"]
          },
          {
            foreignKeyName: "keys_door_id_fkey"
            columns: ["door_id"]
            isOneToOne: false
            referencedRelation: "doors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "keys_floor_id_fkey"
            columns: ["floor_id"]
            isOneToOne: false
            referencedRelation: "floorplan_report_data"
            referencedColumns: ["floor_id"]
          },
          {
            foreignKeyName: "keys_floor_id_fkey"
            columns: ["floor_id"]
            isOneToOne: false
            referencedRelation: "floors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "keys_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_function_history"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "keys_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_lighting_status"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "keys_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_occupancy_stats"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "keys_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "keys_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "storage_room_inventory"
            referencedColumns: ["room_id"]
          },
        ]
      }
      lighting_fixtures: {
        Row: {
          backup_power_source: string | null
          balance_check_date: string | null
          ballast_check_notes: string | null
          ballast_issue: boolean | null
          bulb_count: number | null
          connected_fixtures: string[] | null
          created_at: string | null
          electrical_issues: Json | null
          emergency_circuit: boolean | null
          emergency_duration_minutes: number | null
          emergency_protocols: Json | null
          energy_usage_data: Json | null
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
          manufacturer_details: Json | null
          name: string
          next_inspection_date: string | null
          next_maintenance_date: string | null
          position: Database["public"]["Enums"]["lighting_position_enum"] | null
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
          warranty_info: Json | null
          zone_id: string | null
        }
        Insert: {
          backup_power_source?: string | null
          balance_check_date?: string | null
          ballast_check_notes?: string | null
          ballast_issue?: boolean | null
          bulb_count?: number | null
          connected_fixtures?: string[] | null
          created_at?: string | null
          electrical_issues?: Json | null
          emergency_circuit?: boolean | null
          emergency_duration_minutes?: number | null
          emergency_protocols?: Json | null
          energy_usage_data?: Json | null
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
          manufacturer_details?: Json | null
          name: string
          next_inspection_date?: string | null
          next_maintenance_date?: string | null
          position?:
            | Database["public"]["Enums"]["lighting_position_enum"]
            | null
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
          warranty_info?: Json | null
          zone_id?: string | null
        }
        Update: {
          backup_power_source?: string | null
          balance_check_date?: string | null
          ballast_check_notes?: string | null
          ballast_issue?: boolean | null
          bulb_count?: number | null
          connected_fixtures?: string[] | null
          created_at?: string | null
          electrical_issues?: Json | null
          emergency_circuit?: boolean | null
          emergency_duration_minutes?: number | null
          emergency_protocols?: Json | null
          energy_usage_data?: Json | null
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
          manufacturer_details?: Json | null
          name?: string
          next_inspection_date?: string | null
          next_maintenance_date?: string | null
          position?:
            | Database["public"]["Enums"]["lighting_position_enum"]
            | null
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
          warranty_info?: Json | null
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_hallway_space"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "hallways"
            referencedColumns: ["id"]
          },
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
            foreignKeyName: "lighting_fixtures_last_scheduled_by_fkey"
            columns: ["last_scheduled_by"]
            isOneToOne: false
            referencedRelation: "profiles"
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
            referencedRelation: "emergency_lighting_status"
            referencedColumns: ["id"]
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
            referencedRelation: "lighting_fixture_details"
            referencedColumns: ["id"]
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
            referencedRelation: "emergency_lighting_status"
            referencedColumns: ["id"]
          },
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
            referencedRelation: "lighting_fixture_details"
            referencedColumns: ["id"]
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
            foreignKeyName: "location_access_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
          created_at: string | null
          id: string
          is_primary: boolean | null
          occupant_id: string | null
          room_id: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_at?: string | null
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          occupant_id?: string | null
          room_id?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_at?: string | null
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          occupant_id?: string | null
          room_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
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
            referencedRelation: "room_function_history"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "occupant_room_assignments_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_lighting_status"
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
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "occupant_room_assignments_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "storage_room_inventory"
            referencedColumns: ["room_id"]
          },
        ]
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
            referencedRelation: "room_function_history"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "occupants_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_lighting_status"
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
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "occupants_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "storage_room_inventory"
            referencedColumns: ["room_id"]
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
          accessibility_preferences: Json | null
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          department: string | null
          emergency_contact: Json | null
          first_name: string | null
          id: string
          job_title_validated: boolean | null
          language: string | null
          last_login: string | null
          last_login_at: string | null
          last_name: string | null
          notification_preferences: Json | null
          phone: string | null
          security_settings: Json | null
          system_preferences: Json | null
          theme: string | null
          time_zone: string | null
          title: string | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          accessibility_preferences?: Json | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          department?: string | null
          emergency_contact?: Json | null
          first_name?: string | null
          id: string
          job_title_validated?: boolean | null
          language?: string | null
          last_login?: string | null
          last_login_at?: string | null
          last_name?: string | null
          notification_preferences?: Json | null
          phone?: string | null
          security_settings?: Json | null
          system_preferences?: Json | null
          theme?: string | null
          time_zone?: string | null
          title?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          accessibility_preferences?: Json | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          department?: string | null
          emergency_contact?: Json | null
          first_name?: string | null
          id?: string
          job_title_validated?: boolean | null
          language?: string | null
          last_login?: string | null
          last_login_at?: string | null
          last_name?: string | null
          notification_preferences?: Json | null
          phone?: string | null
          security_settings?: Json | null
          system_preferences?: Json | null
          theme?: string | null
          time_zone?: string | null
          title?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
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
            referencedRelation: "room_function_history"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_history_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_lighting_status"
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
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_history_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "storage_room_inventory"
            referencedColumns: ["room_id"]
          },
        ]
      }
      rooms: {
        Row: {
          created_at: string | null
          current_function: string | null
          description: string | null
          floor_id: string
          function_change_date: string | null
          id: string
          is_storage: boolean | null
          last_inventory_check: string | null
          name: string
          parent_room_id: string | null
          phone_number: string | null
          previous_functions: Json[] | null
          room_number: string
          room_type: Database["public"]["Enums"]["room_type_enum"]
          status: Database["public"]["Enums"]["status_enum"] | null
          storage_capacity: number | null
          storage_notes: string | null
          storage_type: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          current_function?: string | null
          description?: string | null
          floor_id: string
          function_change_date?: string | null
          id?: string
          is_storage?: boolean | null
          last_inventory_check?: string | null
          name: string
          parent_room_id?: string | null
          phone_number?: string | null
          previous_functions?: Json[] | null
          room_number: string
          room_type?: Database["public"]["Enums"]["room_type_enum"]
          status?: Database["public"]["Enums"]["status_enum"] | null
          storage_capacity?: number | null
          storage_notes?: string | null
          storage_type?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          current_function?: string | null
          description?: string | null
          floor_id?: string
          function_change_date?: string | null
          id?: string
          is_storage?: boolean | null
          last_inventory_check?: string | null
          name?: string
          parent_room_id?: string | null
          phone_number?: string | null
          previous_functions?: Json[] | null
          room_number?: string
          room_type?: Database["public"]["Enums"]["room_type_enum"]
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
            foreignKeyName: "rooms_parent_room_id_fkey"
            columns: ["parent_room_id"]
            isOneToOne: false
            referencedRelation: "room_function_history"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rooms_parent_room_id_fkey"
            columns: ["parent_room_id"]
            isOneToOne: false
            referencedRelation: "room_lighting_status"
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
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rooms_parent_room_id_fkey"
            columns: ["parent_room_id"]
            isOneToOne: false
            referencedRelation: "storage_room_inventory"
            referencedColumns: ["room_id"]
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
      space_connections: {
        Row: {
          access_requirements: Json | null
          connection_status: string | null
          connection_type: string
          created_at: string | null
          direction: string | null
          door_details: Json | null
          floor_id: string | null
          from_space_id: string
          id: string
          is_emergency_exit: boolean | null
          last_modified: string | null
          metadata: Json | null
          position: string | null
          space_type: string
          status: Database["public"]["Enums"]["connection_status_enum"] | null
          to_space_id: string
          updated_at: string | null
        }
        Insert: {
          access_requirements?: Json | null
          connection_status?: string | null
          connection_type: string
          created_at?: string | null
          direction?: string | null
          door_details?: Json | null
          floor_id?: string | null
          from_space_id: string
          id?: string
          is_emergency_exit?: boolean | null
          last_modified?: string | null
          metadata?: Json | null
          position?: string | null
          space_type: string
          status?: Database["public"]["Enums"]["connection_status_enum"] | null
          to_space_id: string
          updated_at?: string | null
        }
        Update: {
          access_requirements?: Json | null
          connection_status?: string | null
          connection_type?: string
          created_at?: string | null
          direction?: string | null
          door_details?: Json | null
          floor_id?: string | null
          from_space_id?: string
          id?: string
          is_emergency_exit?: boolean | null
          last_modified?: string | null
          metadata?: Json | null
          position?: string | null
          space_type?: string
          status?: Database["public"]["Enums"]["connection_status_enum"] | null
          to_space_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "space_connections_floor_id_fkey"
            columns: ["floor_id"]
            isOneToOne: false
            referencedRelation: "floorplan_report_data"
            referencedColumns: ["floor_id"]
          },
          {
            foreignKeyName: "space_connections_floor_id_fkey"
            columns: ["floor_id"]
            isOneToOne: false
            referencedRelation: "floors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "space_connections_from_space_id_fkey"
            columns: ["from_space_id"]
            isOneToOne: false
            referencedRelation: "hallways"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "space_connections_to_space_id_fkey"
            columns: ["to_space_id"]
            isOneToOne: false
            referencedRelation: "room_function_history"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "space_connections_to_space_id_fkey"
            columns: ["to_space_id"]
            isOneToOne: false
            referencedRelation: "room_lighting_status"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "space_connections_to_space_id_fkey"
            columns: ["to_space_id"]
            isOneToOne: false
            referencedRelation: "room_occupancy_stats"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "space_connections_to_space_id_fkey"
            columns: ["to_space_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "space_connections_to_space_id_fkey"
            columns: ["to_space_id"]
            isOneToOne: false
            referencedRelation: "storage_room_inventory"
            referencedColumns: ["room_id"]
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
            isOneToOne: false
            referencedRelation: "emergency_lighting_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spatial_assignments_fixture_id_fkey"
            columns: ["fixture_id"]
            isOneToOne: false
            referencedRelation: "lighting_assignments"
            referencedColumns: ["fixture_id"]
          },
          {
            foreignKeyName: "spatial_assignments_fixture_id_fkey"
            columns: ["fixture_id"]
            isOneToOne: false
            referencedRelation: "lighting_fixture_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spatial_assignments_fixture_id_fkey"
            columns: ["fixture_id"]
            isOneToOne: false
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
    }
    Views: {
      available_keys: {
        Row: {
          available_quantity: number | null
          building_id: string | null
          created_at: string | null
          current_available: number | null
          door_id: string | null
          floor_id: string | null
          id: string | null
          is_passkey: boolean | null
          name: string | null
          status: Database["public"]["Enums"]["key_status_enum"] | null
          total_quantity: number | null
          type: Database["public"]["Enums"]["key_type_enum"] | null
          updated_at: string | null
        }
        Insert: {
          available_quantity?: number | null
          building_id?: string | null
          created_at?: string | null
          current_available?: never
          door_id?: string | null
          floor_id?: string | null
          id?: string | null
          is_passkey?: boolean | null
          name?: string | null
          status?: Database["public"]["Enums"]["key_status_enum"] | null
          total_quantity?: number | null
          type?: Database["public"]["Enums"]["key_type_enum"] | null
          updated_at?: string | null
        }
        Update: {
          available_quantity?: number | null
          building_id?: string | null
          created_at?: string | null
          current_available?: never
          door_id?: string | null
          floor_id?: string | null
          id?: string | null
          is_passkey?: boolean | null
          name?: string | null
          status?: Database["public"]["Enums"]["key_status_enum"] | null
          total_quantity?: number | null
          type?: Database["public"]["Enums"]["key_type_enum"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "keys_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "keys_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "lighting_assignments"
            referencedColumns: ["building_id"]
          },
          {
            foreignKeyName: "keys_door_id_fkey"
            columns: ["door_id"]
            isOneToOne: false
            referencedRelation: "doors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "keys_floor_id_fkey"
            columns: ["floor_id"]
            isOneToOne: false
            referencedRelation: "floorplan_report_data"
            referencedColumns: ["floor_id"]
          },
          {
            foreignKeyName: "keys_floor_id_fkey"
            columns: ["floor_id"]
            isOneToOne: false
            referencedRelation: "floors"
            referencedColumns: ["id"]
          },
        ]
      }
      emergency_lighting_status: {
        Row: {
          backup_power_source: string | null
          emergency_circuit: boolean | null
          emergency_duration_minutes: number | null
          id: string | null
          is_emergency_route: boolean | null
          name: string | null
          position: string | null
          space_id: string | null
          space_type: string | null
          status: Database["public"]["Enums"]["light_status_enum"] | null
          type: Database["public"]["Enums"]["light_fixture_type_enum"] | null
          zone_name: string | null
        }
        Relationships: []
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
      key_access_points: {
        Row: {
          access_point_name: string | null
          door_id: string | null
          key_id: string | null
          key_name: string | null
          key_scope: string | null
          key_type: Database["public"]["Enums"]["key_type_enum"] | null
          room_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "keys_door_id_fkey"
            columns: ["door_id"]
            isOneToOne: false
            referencedRelation: "doors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "keys_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_function_history"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "keys_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_lighting_status"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "keys_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_occupancy_stats"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "keys_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "keys_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "storage_room_inventory"
            referencedColumns: ["room_id"]
          },
        ]
      }
      key_assignment_analytics: {
        Row: {
          active_assignments: number | null
          avg_assignment_days: number | null
          building_id: string | null
          damaged_count: number | null
          floor_id: string | null
          lost_count: number | null
          total_assignments: number | null
          type: Database["public"]["Enums"]["key_type_enum"] | null
        }
        Relationships: [
          {
            foreignKeyName: "keys_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "keys_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "lighting_assignments"
            referencedColumns: ["building_id"]
          },
          {
            foreignKeyName: "keys_floor_id_fkey"
            columns: ["floor_id"]
            isOneToOne: false
            referencedRelation: "floorplan_report_data"
            referencedColumns: ["floor_id"]
          },
          {
            foreignKeyName: "keys_floor_id_fkey"
            columns: ["floor_id"]
            isOneToOne: false
            referencedRelation: "floors"
            referencedColumns: ["id"]
          },
        ]
      }
      key_inventory_analytics: {
        Row: {
          active_assignments: number | null
          current_quantity: number | null
          expected_quantity: number | null
          is_passkey: boolean | null
          key_id: string | null
          key_name: string | null
          key_type: Database["public"]["Enums"]["key_type_enum"] | null
          last_assigned_at: string | null
          last_audit_date: string | null
          last_audited_by: string | null
          total_lost: number | null
        }
        Relationships: [
          {
            foreignKeyName: "key_inventory_key_id_fkey"
            columns: ["key_id"]
            isOneToOne: false
            referencedRelation: "available_keys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "key_inventory_key_id_fkey"
            columns: ["key_id"]
            isOneToOne: false
            referencedRelation: "key_access_points"
            referencedColumns: ["key_id"]
          },
          {
            foreignKeyName: "key_inventory_key_id_fkey"
            columns: ["key_id"]
            isOneToOne: false
            referencedRelation: "key_inventory_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "key_inventory_key_id_fkey"
            columns: ["key_id"]
            isOneToOne: false
            referencedRelation: "keys"
            referencedColumns: ["id"]
          },
        ]
      }
      key_inventory_stats: {
        Row: {
          current_assignments: number | null
          current_holder: string | null
          door_location: string | null
          holder_department: string | null
          id: string | null
          is_passkey: boolean | null
          last_assigned_at: string | null
          name: string | null
          spare_assignments: number | null
          status: Database["public"]["Enums"]["key_status_enum"] | null
          times_lost: number | null
          total_assignments: number | null
          type: Database["public"]["Enums"]["key_type_enum"] | null
        }
        Relationships: []
      }
      key_statistics: {
        Row: {
          assigned_keys: number | null
          available_keys: number | null
          building_name: string | null
          decommissioned_keys: number | null
          floor_name: string | null
          lost_keys: number | null
          total_keys: number | null
        }
        Relationships: []
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
            foreignKeyName: "fk_hallway_space"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "hallways"
            referencedColumns: ["id"]
          },
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
        ]
      }
      lighting_fixture_details: {
        Row: {
          backup_power_source: string | null
          balance_check_date: string | null
          ballast_check_notes: string | null
          ballast_issue: boolean | null
          building_name: string | null
          bulb_count: number | null
          connected_fixtures: string[] | null
          created_at: string | null
          electrical_issues: Json | null
          emergency_circuit: boolean | null
          emergency_duration_minutes: number | null
          emergency_protocols: Json | null
          energy_usage_data: Json | null
          floor_id: string | null
          floor_name: string | null
          id: string | null
          inspection_history: Json[] | null
          installation_date: string | null
          last_inspection_date: string | null
          last_maintenance_date: string | null
          last_scheduled_by: string | null
          maintenance_frequency_days: number | null
          maintenance_history: Json[] | null
          maintenance_notes: string | null
          maintenance_priority: string | null
          manufacturer_details: Json | null
          name: string | null
          next_inspection_date: string | null
          next_maintenance_date: string | null
          position: Database["public"]["Enums"]["lighting_position_enum"] | null
          room_number: string | null
          scheduled_maintenance_date: string | null
          sequence_number: number | null
          space_id: string | null
          space_name: string | null
          space_type: string | null
          status: Database["public"]["Enums"]["light_status_enum"] | null
          technology:
            | Database["public"]["Enums"]["lighting_technology_enum"]
            | null
          type: Database["public"]["Enums"]["light_fixture_type_enum"] | null
          updated_at: string | null
          warranty_info: Json | null
          zone_id: string | null
          zone_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_hallway_space"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "hallways"
            referencedColumns: ["id"]
          },
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
            foreignKeyName: "lighting_fixtures_last_scheduled_by_fkey"
            columns: ["last_scheduled_by"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      low_stock_items: {
        Row: {
          category: string | null
          id: string | null
          minimum_quantity: number | null
          name: string | null
          quantity: number | null
          room_name: string | null
          storage_location: string | null
        }
        Relationships: []
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
          key_count: number | null
          key_names: string | null
          last_name: string | null
          notes: string | null
          phone: string | null
          room_count: number | null
          room_id: string | null
          room_names: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["occupant_status_enum"] | null
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
          first_name?: string | null
          hire_date?: string | null
          id?: string | null
          key_count?: never
          key_names?: never
          last_name?: string | null
          notes?: string | null
          phone?: string | null
          room_count?: never
          room_id?: string | null
          room_names?: never
          start_date?: string | null
          status?: Database["public"]["Enums"]["occupant_status_enum"] | null
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
          first_name?: string | null
          hire_date?: string | null
          id?: string | null
          key_count?: never
          key_names?: never
          last_name?: string | null
          notes?: string | null
          phone?: string | null
          room_count?: never
          room_id?: string | null
          room_names?: never
          start_date?: string | null
          status?: Database["public"]["Enums"]["occupant_status_enum"] | null
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
            referencedRelation: "room_function_history"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "occupants_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_lighting_status"
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
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "occupants_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "storage_room_inventory"
            referencedColumns: ["room_id"]
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
      room_function_history: {
        Row: {
          change_history: Json | null
          current_function: string | null
          function_change_date: string | null
          id: string | null
          issue_history: Json | null
          name: string | null
          previous_functions: Json[] | null
          room_number: string | null
          room_type: Database["public"]["Enums"]["room_type_enum"] | null
        }
        Insert: {
          change_history?: never
          current_function?: string | null
          function_change_date?: string | null
          id?: string | null
          issue_history?: never
          name?: string | null
          previous_functions?: Json[] | null
          room_number?: string | null
          room_type?: Database["public"]["Enums"]["room_type_enum"] | null
        }
        Update: {
          change_history?: never
          current_function?: string | null
          function_change_date?: string | null
          id?: string | null
          issue_history?: never
          name?: string | null
          previous_functions?: Json[] | null
          room_number?: string | null
          room_type?: Database["public"]["Enums"]["room_type_enum"] | null
        }
        Relationships: []
      }
      room_lighting_status: {
        Row: {
          non_working_fixtures: number | null
          room_id: string | null
          room_name: string | null
          room_number: string | null
          total_fixtures: number | null
          working_fixtures: number | null
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
        ]
      }
      spaces: {
        Row: {
          floor_id: string | null
          id: string | null
          name: string | null
          room_number: string | null
          space_type: string | null
        }
        Relationships: []
      }
      storage_room_inventory: {
        Row: {
          category: string | null
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
      user_activity_history: {
        Row: {
          action: string | null
          activity_type: string | null
          created_at: string | null
          metadata: Json | null
          performed_by: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      assign_key_if_available:
        | {
            Args: {
              key_id: string
              occupant_id: string
            }
            Returns: Json
          }
        | {
            Args: {
              key_id: string
              occupant_id: string
              is_spare?: boolean
            }
            Returns: Json
          }
      cleanup_old_backups: {
        Args: {
          policy_id: string
        }
        Returns: undefined
      }
      complete_backup_restoration: {
        Args: {
          restoration_id: string
          success: boolean
          error_msg?: string
        }
        Returns: undefined
      }
      get_next_lighting_sequence: {
        Args: {
          p_space_id: string
        }
        Returns: number
      }
      increment_key_quantity: {
        Args: {
          key_id: string
        }
        Returns: number
      }
      safely_delete_key: {
        Args: {
          key_id_to_delete: string
        }
        Returns: undefined
      }
    }
    Enums: {
      access_level_enum: "none" | "read" | "write" | "admin"
      category_color_enum:
        | "red"
        | "blue"
        | "green"
        | "yellow"
        | "purple"
        | "orange"
        | "pink"
        | "gray"
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
      door_type_enum: "standard" | "emergency" | "secure" | "maintenance"
      emergency_route_enum: "primary" | "secondary" | "not_designated"
      floor_plan_mode_enum: "edit" | "view"
      hallway_accessibility_enum:
        | "fully_accessible"
        | "limited_access"
        | "stairs_only"
        | "restricted"
      hallway_section_enum: "left_wing" | "right_wing" | "connector"
      hallway_traffic_flow_enum: "one_way" | "two_way" | "restricted"
      hallway_type_enum: "public_main" | "private"
      issue_status_enum: "open" | "in_progress" | "resolved"
      issue_type_enum:
        | "HVAC"
        | "Leak"
        | "Electrical"
        | "Plaster"
        | "Cleaning"
        | "Other"
        | "Lighting_Ballast"
        | "Lighting_Replacement"
        | "Lighting_Emergency"
        | "Lighting_Sensor"
        | "Lighting_Control"
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
      key_status_enum: "available" | "assigned" | "lost" | "decommissioned"
      key_type_enum: "physical_key" | "elevator_pass" | "room_key"
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
      occupant_status_change_reason_enum:
        | "new_hire"
        | "voluntary_leave"
        | "involuntary_leave"
        | "temporary_leave"
        | "returned_from_leave"
        | "retirement"
        | "other"
      occupant_status_enum: "active" | "inactive" | "on_leave" | "terminated"
      party_enum: "DCAS" | "OCA" | "Self" | "Outside_Vendor"
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
      status_enum: "active" | "inactive" | "under_maintenance"
      zone_type_enum: "general" | "emergency" | "restricted"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
