// Court Sessions Types

export type SessionPeriod = 'AM' | 'PM' | 'ALL_DAY';
export type BuildingCode = '100' | '111';

export interface CourtSession {
  id: string;
  session_date: string;
  period: SessionPeriod;
  building_code: BuildingCode;
  court_room_id: string;
  assignment_id: string | null;
  status: string;
  status_detail: string | null;
  estimated_finish_date: string | null;
  judge_name: string | null;
  part_number: string | null;
  clerk_names: string[] | null;
  sergeant_name: string | null;
  calendar_day: string | null;
  // New calendar fields
  parts_entered_by: string | null;
  defendants: string | null;
  purpose: string | null;
  date_transferred_or_started: string | null;
  top_charge: string | null;
  attorney: string | null;
  notes: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  court_rooms?: {
    room_number: string;
    courtroom_number: string;
    room_id: string;
  };
  court_assignments?: {
    part: string;
    justice: string;
    clerks: string[];
    sergeant: string;
  };
}

export interface CreateCourtSessionInput {
  session_date: string;
  period: SessionPeriod;
  building_code: BuildingCode;
  court_room_id: string;
  assignment_id?: string | null;
  status: string;
  status_detail?: string | null;
  estimated_finish_date?: string | null;
  judge_name?: string | null;
  part_number?: string | null;
  clerk_names?: string[] | null;
  sergeant_name?: string | null;
  calendar_day?: string | null;
  // New calendar fields
  parts_entered_by?: string | null;
  defendants?: string | null;
  purpose?: string | null;
  date_transferred_or_started?: string | null;
  top_charge?: string | null;
  attorney?: string | null;
  notes?: string | null;
}

export interface UpdateCourtSessionInput extends Partial<CreateCourtSessionInput> {
  id: string;
}

export interface CoverageAssignment {
  id: string;
  coverage_date: string;
  period: SessionPeriod;
  building_code: BuildingCode;
  court_room_id: string;
  absent_staff_id: string | null;
  absent_staff_name: string;
  absent_staff_role: string;
  covering_staff_id: string | null;
  covering_staff_name: string;
  start_time: string | null;
  end_time: string | null;
  absence_reason: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  court_rooms?: {
    room_number: string;
    courtroom_number: string;
  };
}

export interface CreateCoverageAssignmentInput {
  coverage_date: string;
  period: SessionPeriod;
  building_code: BuildingCode;
  court_room_id: string;
  absent_staff_id?: string | null;
  absent_staff_name: string;
  absent_staff_role: string;
  covering_staff_id?: string | null;
  covering_staff_name: string;
  start_time?: string | null;
  end_time?: string | null;
  absence_reason?: string | null;
  notes?: string | null;
}

export interface UpdateCoverageAssignmentInput extends Partial<CreateCoverageAssignmentInput> {
  id: string;
}

export interface DailyReportNotes {
  id: string;
  report_date: string;
  period: SessionPeriod;
  building_code: BuildingCode;
  available_hrgs: string | null;
  coverage_summary: string | null;
  general_notes: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface SessionValidationResult {
  isValid: boolean;
  errors: string[];
}
