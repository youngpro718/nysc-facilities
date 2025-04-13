
import { Room } from "@/components/spaces/rooms/types/RoomTypes";

export type RelocationStatus = 'scheduled' | 'active' | 'completed' | 'cancelled';
export type WorkAssignmentStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
export type CourtSessionStatus = 'scheduled' | 'in_session' | 'completed' | 'cancelled';
export type RelocationType = 'emergency' | 'maintenance' | 'other' | 'construction';

// Base interfaces for specific aspects of a relocation
export interface RelocationRooms {
  original_room_id: string;
  temporary_room_id: string;
}

export interface RelocationDates {
  start_date: string;
  end_date: string;
  actual_end_date?: string;
  expected_end_date?: string;
}

export interface RelocationDetails {
  reason: string;
  notes?: string;
  relocation_type: RelocationType;
}

export interface ScheduleChangeData {
  original_court_part: string;
  temporary_assignment: string;
  special_instructions?: string;
}

// Form data interface composed of the smaller interfaces
export interface CreateRelocationFormData 
  extends RelocationRooms, 
          RelocationDates, 
          RelocationDetails {
  schedule_changes?: ScheduleChangeData[];
}

// Complete relocation interface with all possible fields
export interface RoomRelocation 
  extends RelocationRooms, 
          RelocationDates, 
          RelocationDetails {
  id: string;
  status: RelocationStatus;
  created_at: string;
  updated_at: string;
  created_by?: string;
  metadata?: Record<string, any>;
  original_room?: Room;
  temporary_room?: Room;
}

export interface UpdateRelocationFormData {
  id: string;
  temporary_room_id?: string;
  end_date?: string;
  actual_end_date?: string;
  reason?: string;
  status?: RelocationStatus;
  notes?: string;
}

export interface ScheduleChange {
  id: string;
  relocation_id: string;
  original_court_part: string;
  temporary_assignment: string;
  start_date: string;
  end_date?: string;
  special_instructions?: string;
  status: RelocationStatus;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface CreateScheduleChangeFormData {
  relocation_id: string;
  original_court_part: string;
  temporary_assignment: string;
  start_date: string;
  end_date?: string;
  special_instructions?: string;
}

export interface UpdateScheduleChangeFormData {
  id: string;
  temporary_assignment?: string;
  end_date?: string;
  special_instructions?: string;
  status?: RelocationStatus;
}

export interface ScheduleChangeNotification {
  id: string;
  relocation_id: string;
  schedule_change_id: string;
  message: string;
  created_at: string;
  recipients: Array<{ email: string }>;
  notification_type: string;
  status: string;
}

export interface RelocationNotification {
  id: string;
  relocation_id: string;
  message: string;
  notification_type: string;
  scheduled_for?: string;
  sent_at: string;
  status: string;
  created_at: string;
  recipients: Array<{email: string}>;
  recipient_email?: string;
  subject?: string;
}

export interface ActiveRelocation extends RoomRelocation {
  days_active: number;
  progress_percentage: number;
  original_building_name?: string;
  original_floor_name?: string;
  original_room_name?: string;
  temporary_building_name?: string;
  temporary_floor_name?: string;
  temporary_room_name?: string;
}

export interface TimeSlot {
  start_time: string; // Format: HH:MM in 24h format
  end_time: string;   // Format: HH:MM in 24h format
}

export interface WorkAssignment {
  id: string;
  relocation_id: string;
  date: string;        // ISO date string: YYYY-MM-DD
  start_time: string;  // Format: HH:MM in 24h format
  end_time: string;    // Format: HH:MM in 24h format
  crew_name: string;
  task: string;
  status: WorkAssignmentStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  completed_at?: string;
  completed_by?: string;
}

export interface CourtSession {
  id: string;
  relocation_id: string;
  room_id: string;
  date: string;        // ISO date string: YYYY-MM-DD
  start_time: string;  // Format: HH:MM in 24h format
  end_time: string;    // Format: HH:MM in 24h format
  judge_name?: string;
  case_number?: string;
  description?: string;
  status: CourtSessionStatus;
  created_at: string;
  updated_at: string;
}

export interface DailyAvailability {
  date: string;       // ISO date string: YYYY-MM-DD
  room_id: string;
  is_available: boolean;
  available_slots: TimeSlot[];
  court_sessions: CourtSession[];
  work_assignments: WorkAssignment[];
}

export interface CreateWorkAssignmentFormData {
  relocation_id: string;
  date: string;
  start_time: string;
  end_time: string;
  crew_name: string;
  task: string;
  notes?: string;
}

export interface UpdateWorkAssignmentFormData {
  id: string;
  status?: WorkAssignmentStatus;
  notes?: string;
  date?: string;
  start_time?: string;
  end_time?: string;
  crew_name?: string;
  task?: string;
}

export interface CreateCourtSessionFormData {
  relocation_id: string;
  room_id: string;
  date: string;
  start_time: string;
  end_time: string;
  judge_name?: string;
  case_number?: string;
  description?: string;
}

export interface UpdateCourtSessionFormData {
  id: string;
  status?: CourtSessionStatus;
  date?: string;
  start_time?: string;
  end_time?: string;
  judge_name?: string;
  case_number?: string;
  description?: string;
}
