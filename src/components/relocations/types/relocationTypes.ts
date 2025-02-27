import { Room } from "@/components/spaces/rooms/types/RoomTypes";

export type RelocationStatus = 'scheduled' | 'active' | 'completed' | 'cancelled';

export interface RoomRelocation {
  id: string;
  original_room_id: string;
  temporary_room_id: string;
  start_date: string;
  end_date: string;
  actual_end_date?: string;
  reason: string;
  status: RelocationStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  metadata?: Record<string, any>;
  relocation_type: 'emergency' | 'maintenance' | 'other' | 'construction';
  
  // Joined data
  original_room?: Room;
  temporary_room?: Room;
}

export interface ActiveRelocation {
  id: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: RelocationStatus;
  notes?: string;
  original_room_name: string;
  original_room_number: string;
  original_floor_name: string;
  original_building_name: string;
  temporary_room_name: string;
  temporary_room_number: string;
  temporary_floor_name: string;
  temporary_building_name: string;
  days_active: number;
  total_days?: number;
  progress_percentage?: number;
}

export interface CreateRelocationFormData {
  original_room_id: string;
  temporary_room_id: string;
  start_date: string;
  end_date: string;
  reason: string;
  notes?: string;
  schedule_changes?: {
    original_court_part: string;
    temporary_assignment: string;
    special_instructions?: string;
  }[];
  relocation_type: 'emergency' | 'maintenance' | 'other' | 'construction';
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

export interface RelocationNotification {
  id: string;
  relocation_id?: string;
  schedule_change_id?: string;
  notification_type: string;
  message: string;
  sent_at?: string;
  recipients?: Record<string, any>;
  status: string;
  created_at: string;
}
