
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
  zone?: {
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
  room_assignments: {
    rooms: {
      name: string;
    };
  }[];
}

export interface DatabaseTable {
  table_name: string;
  table_schema: string;
}

export type QueryBuilder<T> = PostgrestFilterBuilder<any, any, T[]>;

// New types for report templates and scheduling
export interface ReportTemplate {
  id: string;
  name: string;
  description?: string;
  config: Record<string, any>;
  is_public: boolean;
  created_at?: string;
}

export interface ScheduledReport {
  id: string;
  name: string;
  template_id?: string;
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
  room_name: string;
  status: string;
  occupancy_status: string;
  last_inspection_date?: string;
  building_name?: string;
  floor_name?: string;
}

export interface KeyInventoryData {
  name: string;
  type: string;
  total_quantity: number;
  available_quantity: number;
  status: string;
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

