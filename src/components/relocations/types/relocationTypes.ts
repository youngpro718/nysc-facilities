
import { Room } from "@/components/spaces/rooms/types/RoomTypes";

export type RelocationStatus = 'scheduled' | 'active' | 'completed' | 'cancelled';
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
