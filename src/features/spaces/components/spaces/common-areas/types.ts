export const COMMON_AREA_TYPES = [
  'hallway',
  'entrance',
  'lobby',
  'mezzanine',
  'waiting_area',
  'restroom',
  'stairwell',
  'other',
] as const;

export type CommonAreaType = (typeof COMMON_AREA_TYPES)[number];

export interface CommonArea {
  id: string;
  floor_id: string;
  name: string;
  area_type: CommonAreaType;
  status: 'active' | 'inactive' | 'under_maintenance';
  description: string | null;
  water_cooler_count: number;
  water_cooler_notes: string | null;
  created_at: string;
  updated_at: string;
  floor: {
    id: string;
    name: string;
    floor_number: number;
    building: {
      id: string;
      name: string;
    };
  };
}

export interface CommonAreaInput {
  floor_id: string;
  name: string;
  area_type: CommonAreaType;
  status: CommonArea['status'];
  description: string | null;
  water_cooler_count: number;
  water_cooler_notes: string | null;
}

export const commonAreaTypeLabel = (type: CommonAreaType) => {
  const labels: Record<CommonAreaType, string> = {
    hallway: 'Hallway',
    entrance: 'Entrance',
    lobby: 'Lobby',
    mezzanine: 'Mezzanine',
    waiting_area: 'Waiting area',
    restroom: 'Restroom',
    stairwell: 'Stairwell',
    other: 'Other',
  };
  return labels[type];
};
