
import { Room } from "@/components/spaces/types/RoomTypes";

export interface RelocationWithDetails {
  id: string;
  original_room: Room;
  temporary_room: Room;
  start_date: string;
  end_date: string;
  reason: string;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  notes?: string;
  relocation_type: 'emergency' | 'maintenance' | 'other' | 'construction';
  special_instructions?: string;
  created_at: string;
  updated_at: string;
}

export type RelocationStatus = 'scheduled' | 'active' | 'completed' | 'cancelled';

export interface RoomRelocation {
  id: string;
  original_room_id: string;
  temporary_room_id: string;
  original_parent_room_id?: string;
  temporary_parent_room_id?: string;
  start_date: string;
  end_date: string;
  actual_end_date?: string;
  reason: string;
  status: RelocationStatus;
  notes?: string;
  relocation_type: 'emergency' | 'maintenance' | 'other' | 'construction';
  special_instructions?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  term_id?: string;
  respect_term_assignments?: boolean;
  original_room?: Room;
  temporary_room?: Room;
}

export interface ActiveRelocation extends RoomRelocation {
  days_active: number;
  progress_percentage: number;
}

export interface CreateRelocationFormData {
  original_room_id: string;
  temporary_room_id: string;
  original_parent_room_id?: string;
  temporary_parent_room_id?: string;
  start_date: string;
  end_date: string;
  reason: string;
  notes?: string;
  relocation_type: 'emergency' | 'maintenance' | 'other' | 'construction';
  term_id?: string;
  respect_term_assignments?: boolean;
  schedule_changes?: CreateScheduleChangeFormData[];
}

export interface UpdateRelocationFormData {
  id: string;
  temporary_room_id?: string;
  temporary_parent_room_id?: string;
  original_parent_room_id?: string;
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
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateScheduleChangeFormData {
  relocation_id: string;
  original_court_part: string;
  temporary_assignment: string;
  start_date: string;
  end_date: string;
  special_instructions?: string;
}

export interface UpdateScheduleChangeFormData {
  id: string;
  temporary_assignment?: string;
  end_date?: string;
  special_instructions?: string;
  status?: RelocationStatus;
}

export interface RelocationNotification {
  id: string;
  relocation_id?: string;
  schedule_change_id?: string;
  notification_type: string;
  message: string;
  recipients: string;
  status: 'pending' | 'sent' | 'failed';
  sent_at?: string;
  created_at: string;
  updated_at: string;
  recipient_email?: string;
  subject?: string;
}

export interface ScheduleChangeNotification extends RelocationNotification {
  schedule_change_id: string;
}
