
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
