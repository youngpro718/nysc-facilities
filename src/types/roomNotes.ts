export type NoteType = 'known_issue' | 'warning' | 'info' | 'maintenance';
export type NoteSeverity = 'low' | 'medium' | 'high';

export interface RoomNote {
  id: string;
  room_id: string;
  note_type: NoteType;
  title: string;
  content: string | null;
  severity: NoteSeverity | null;
  is_recurring: boolean;
  first_reported: string | null;
  last_occurrence: string | null;
  occurrence_count: number;
  is_resolved: boolean;
  resolved_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateRoomNoteInput {
  room_id: string;
  note_type: NoteType;
  title: string;
  content?: string;
  severity?: NoteSeverity;
  is_recurring?: boolean;
}

export interface UpdateRoomNoteInput {
  title?: string;
  content?: string;
  severity?: NoteSeverity;
  is_recurring?: boolean;
  is_resolved?: boolean;
  last_occurrence?: string;
  occurrence_count?: number;
}

// Quick note presets for common issues
export const QUICK_NOTE_PRESETS = [
  { title: 'Overheating', note_type: 'known_issue' as NoteType, severity: 'medium' as NoteSeverity, icon: '🌡️' },
  { title: 'Window Issue', note_type: 'known_issue' as NoteType, severity: 'low' as NoteSeverity, icon: '🪟' },
  { title: 'Leak/Water', note_type: 'known_issue' as NoteType, severity: 'high' as NoteSeverity, icon: '💧' },
  { title: 'Door Problem', note_type: 'known_issue' as NoteType, severity: 'medium' as NoteSeverity, icon: '🚪' },
  { title: 'Electrical', note_type: 'warning' as NoteType, severity: 'high' as NoteSeverity, icon: '⚡' },
  { title: 'HVAC Issue', note_type: 'known_issue' as NoteType, severity: 'medium' as NoteSeverity, icon: '❄️' },
] as const;
