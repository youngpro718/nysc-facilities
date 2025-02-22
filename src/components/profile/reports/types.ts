
import { Content, TableCell, TDocumentDefinitions } from "pdfmake/interfaces";

export interface ReportProgress {
  status: 'pending' | 'generating' | 'completed' | 'error';
  progress: number;
  message?: string;
}

export interface RoomHealthData {
  room_name: string;
  room_number: string;
  building_name: string;
  floor_name: string;
  status: string;
  occupancy_status: string;
  last_inspection_date: string | null;
  health_score: number;
  maintenance_compliance_score: number;
  open_issues_count: number;
  critical_issues_count: number;
  active_critical_issues: number;
  active_recurring_issues: number;
  next_maintenance_due: string | null;
}

export interface KeyInventoryData {
  type: string;
  total_quantity: number;
  available_quantity: number;
  active_assignments: number;
  returned_assignments: number;
  lost_count: number;
}

export interface FloorPlanRoomData {
  id: string;
  name: string;
  type: string;
  status: string;
  maintenance_history: any[];
  next_maintenance_date: string | null;
}

export interface FloorPlanFloorData {
  id: string;
  name: string;
  rooms: FloorPlanRoomData[];
}

export interface FloorplanReportData {
  id: string;
  name: string;
  floors: FloorPlanFloorData[];
}

export interface IssueReportDetail {
  id: string;
  title: string;
  description: string | null;
  type: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  photos: string[] | null;
  due_date: string | null;
  resolution_type: string | null;
  resolution_notes: string | null;
  resolution_date: string | null;
  impact_level: string | null;
  tags: string[] | null;
  building_name: string | null;
  floor_name: string | null;
  room_name: string | null;
  room_number: string | null;
  assignee_first_name: string | null;
  assignee_last_name: string | null;
  assignee_email: string | null;
  timeline_events: any[] | null;
  lighting_details: Record<string, any> | null;
  recurring_pattern: Record<string, any> | null;
  maintenance_requirements: Record<string, any> | null;
}

export interface IssueReportSection {
  title: string;
  data: any;
}

export interface IssueReportMetrics {
  total_issues: number;
  open_issues: number;
  resolved_issues: number;
  overdue_issues: number;
  avg_resolution_time?: string;
  priority_distribution: Record<string, number>;
  status_distribution: Record<string, number>;
}

export interface FormattedIssueReport {
  metadata: {
    generated_at: string;
    generated_by?: string;
    report_period?: string;
  };
  metrics: IssueReportMetrics;
  sections: IssueReportSection[];
}

export type ReportCallback = (progress: ReportProgress) => void;

