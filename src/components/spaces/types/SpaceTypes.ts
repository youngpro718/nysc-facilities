
export type SpaceStatus = 'active' | 'inactive' | 'under_maintenance';
export type SpaceType = 'room' | 'hallway' | 'door';

export interface Space {
  id: string;
  name: string;
  type: SpaceType;
  status: SpaceStatus;
  floor_id: string;
  room_number?: string | null;
  position: {
    x: number;
    y: number;
  };
  size: {
    width: number;
    height: number;
  };
  rotation: number;
  created_at?: string;
  updated_at?: string;
  subtype?: string;
}
