
export interface RoomRelocation {
  id: string;
  original_room_id: string;
  temporary_room_id: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: RelocationStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  relocation_type: 'planned' | 'emergency' | 'maintenance';
  special_instructions?: string;
  metadata?: any;
  // Additional fields for expanded data
  original_room_name?: string;
  original_room_number?: string;
  temporary_room_name?: string;
  temporary_room_number?: string;
  building_name?: string;
  floor_name?: string;
  actual_end_date?: string;
  term_id?: string;
}

export interface ActiveRelocation extends RoomRelocation {
  original_room_name: string;
  original_room_number: string;
  temporary_room_name: string;
  temporary_room_number: string;
  building_name: string;
  floor_name: string;
  progress_percentage: number;
  days_active: number;
  total_days: number;
}

export type RelocationStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export interface CreateRelocationFormData {
  original_room_id: string;
  temporary_room_id: string;
  original_parent_room_id?: string;
  temporary_parent_room_id?: string;
  start_date: string;
  end_date: string;
  reason: string;
  relocation_type: 'planned' | 'emergency' | 'maintenance';
  notes?: string;
  special_instructions?: string;
}

export interface UpdateRelocationFormData extends Partial<CreateRelocationFormData> {
  id: string;
  status?: RelocationStatus;
  actual_end_date?: string;
}

export interface RelocationNotification {
  id: string;
  relocation_id: string;
  notification_type: string;
  message: string;
  scheduled_for: string;
  status: 'pending' | 'sent' | 'failed';
  created_at: string;
}

export interface ScheduleChangeNotification {
  id: string;
  relocation_id: string;
  change_type: string;
  old_date: string;
  new_date: string;
  reason: string;
  created_at: string;
}

export interface ScheduleChange {
  id: string;
  relocation_id: string;
  change_type: 'start_date' | 'end_date' | 'both';
  old_start_date?: string;
  old_end_date?: string;
  new_start_date?: string;
  new_end_date?: string;
  reason: string;
  approved_by?: string;
  created_at: string;
}

export interface CreateScheduleChangeFormData {
  relocation_id: string;
  change_type: 'start_date' | 'end_date' | 'both';
  new_start_date?: string;
  new_end_date?: string;
  reason: string;
}

export interface UpdateScheduleChangeFormData extends Partial<CreateScheduleChangeFormData> {
  id: string;
  approved_by?: string;
}
