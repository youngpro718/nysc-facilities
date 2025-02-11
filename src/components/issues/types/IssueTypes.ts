
export type Issue = {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved';
  priority: 'low' | 'medium' | 'high';
  building_id?: string;
  floor_id?: string;
  room_id?: string;
  photos: string[];
  created_at: string;
  updated_at: string;
  seen: boolean;
};
