
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
  original_room?: Room;
  temporary_room?: Room;
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

