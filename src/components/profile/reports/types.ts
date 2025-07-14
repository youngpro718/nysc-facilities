import { PostgrestFilterBuilder } from "@supabase/postgrest-js";

export type ReportProgress = {
  status: 'pending' | 'generating' | 'completed' | 'error';
  progress: number;
  message?: string;
};

export type ReportCallback = (progress: ReportProgress) => void;

export interface LightingFixture {
  id: string;
  name: string;
  type: string;
  status: string;
  technology?: string;
  zone_id?: string;
  maintenance_history?: any[];
  last_maintenance_date?: string;
  next_maintenance_date?: string;
  installation_date?: string;
  electrical_issues?: any;
  lighting_zones?: {
    name: string;
  };
}

export interface Occupant {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  department: string;
  status: string;
  title?: string;
  phone?: string;
  employment_type?: string;
  occupant_room_assignments?: {
    rooms: {
      name: string;
      room_number: string;
    };
  }[];
}

export interface DatabaseTable {
  table_name: string;
  table_schema: string;
}

export type QueryBuilder<T> = PostgrestFilterBuilder<any, any, T[]>;

export interface ReportTemplate {
  id: string;
  name: string;
  description?: string;
  config: Record<string, any>;
  is_public: boolean;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
}

export interface ScheduledReport {
  id: string;
  name: string;
  template_id: string;
  schedule: string;
  next_run_at?: string;
  last_run_at?: string;
  recipients: string[];
  status: string;
}

export interface FloorplanReportData {
  building_name: string;
  floor_name: string;
  floor_id: string;
  floorplan_data: Record<string, any>;
}

export interface RoomHealthData {
  room_id?: string;
  room_name: string;
  room_number: string;
  status?: string;
  occupancy_status?: string;
  last_inspection_date?: string;
  building_name?: string;
  floor_name?: string;
  current_occupancy?: number;
  capacity?: number;
  health_score?: number;
  maintenance_compliance_score?: number;
  active_critical_issues?: number;
  active_recurring_issues?: number;
  critical_issues_count?: number;
  open_issues_count?: number;
  next_maintenance_due?: string;
}

export interface KeyInventoryData {
  type: string;
  total_quantity: number;
  available_quantity: number;
  active_assignments: number;
  returned_assignments: number;
  lost_count: number;
}

export interface KeyData {
  id: string;
  name: string;
  type: string;
  status: string;
  total_quantity: number;
  available_quantity: number;
  is_passkey: boolean;
  key_scope?: string;
}

export interface IssueReportDetail {
  id: string;
  title: string;
  type: string;
  status: string;
  priority: string;
  created_at: string;
  building_name?: string;
  floor_name?: string;
  room_name?: string;
  due_date?: string;
  resolution_date?: string;
  resolution_type?: string;
}

export interface IssueReportMetrics {
  total_issues: number;
  open_issues: number;
  resolved_issues: number;
  overdue_issues: number;
  priority_distribution: Record<string, number>;
  status_distribution: Record<string, number>;
}

export interface IssueReportSection {
  title: string;
  data: any;
}

export interface FormattedIssueReport {
  metadata: {
    generated_at: string;
  };
  metrics: IssueReportMetrics;
  sections: IssueReportSection[];
}

export interface ReportMetrics {
  totalRecords: number;
  categories: Record<string, number>;
  trends?: Record<string, any>;
}

export interface ReportSummary {
  title: string;
  description: string;
  keyMetrics: string[];
  recommendations?: string[];
}