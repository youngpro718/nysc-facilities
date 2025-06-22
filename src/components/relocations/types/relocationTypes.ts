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
  relocation_type: 'planned' | 'emergency' | 'maintenance' | 'construction' | 'other';
  special_instructions?: string;
  metadata?: any;
  actual_end_date?: string;
  // Additional fields for expanded data (from joins)
  original_room_name?: string;
  original_room_number?: string;
  temporary_room_name?: string;
  temporary_room_number?: string;
  building_name?: string;
  floor_name?: string;
  term_id?: string;
}

export interface ActiveRelocation {
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
  relocation_type: 'planned' | 'emergency' | 'maintenance' | 'construction' | 'other';
  special_instructions?: string;
  metadata?: any;
  actual_end_date?: string;
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

export type RelocationStatus = 'scheduled' | 'active' | 'completed' | 'cancelled';

export interface CreateRelocationFormData {
  original_room_id: string;
  temporary_room_id: string;
  original_parent_room_id?: string;
  temporary_parent_room_id?: string;
  start_date: string;
  end_date: string;
  reason: string;
  relocation_type: 'planned' | 'emergency' | 'maintenance' | 'construction' | 'other';
  notes?: string;
  special_instructions?: string;
  term_id?: string;
  respect_term_assignments?: boolean;
  schedule_changes?: Array<{
    original_court_part: string;
    temporary_assignment: string;
    special_instructions?: string;
  }>;
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
  original_court_part: string;
  temporary_assignment: string;
  start_date: string;
  end_date: string;
  special_instructions?: string;
}

export interface UpdateScheduleChangeFormData {
  id: string;
  original_court_part: string;
  temporary_assignment: string;
  start_date: string;
  end_date: string;
  special_instructions?: string;
  created_by?: string;
}

export interface CourtTermData {
  id: string;
  term_name: string;
  term_number: string;
  start_date: string;
  end_date: string;
  location: string;
  buildings?: { name: string }[];
}
