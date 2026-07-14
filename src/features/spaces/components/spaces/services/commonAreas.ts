import { supabase } from '@/lib/supabase';
import type { CommonArea, CommonAreaInput, CommonAreaType } from '../common-areas/types';

interface CommonAreaRow {
  id: string;
  floor_id: string;
  name: string;
  area_type: string;
  status: CommonArea['status'];
  description: string | null;
  water_cooler_count: number;
  water_cooler_notes: string | null;
  created_at: string;
  updated_at: string;
  floors: {
    id: string;
    name: string;
    floor_number: number;
    buildings: { id: string; name: string };
  };
}

export async function fetchCommonAreas(buildingId?: string, floorId?: string): Promise<CommonArea[]> {
  let request = supabase
    .from('common_areas')
    .select(`
      *,
      floors!common_areas_floor_id_fkey!inner (
        id,
        name,
        floor_number,
        buildings!floors_building_id_fkey!inner (id, name)
      )
    `)
    .order('name');

  if (floorId && floorId !== 'all') {
    request = request.eq('floor_id', floorId);
  }
  if (buildingId && buildingId !== 'all') {
    request = request.eq('floors.buildings.id', buildingId);
  }

  const { data, error } = await request;
  if (error) throw error;

  return ((data ?? []) as unknown as CommonAreaRow[]).map((area): CommonArea => ({
    id: area.id,
    floor_id: area.floor_id,
    name: area.name,
    area_type: area.area_type as CommonAreaType,
    status: area.status,
    description: area.description,
    water_cooler_count: area.water_cooler_count,
    water_cooler_notes: area.water_cooler_notes,
    created_at: area.created_at,
    updated_at: area.updated_at,
    floor: {
      id: area.floors.id,
      name: area.floors.name,
      floor_number: area.floors.floor_number,
      building: area.floors.buildings,
    },
  }));
}

export async function createCommonArea(input: CommonAreaInput) {
  const { error } = await supabase.from('common_areas').insert(input);
  if (error) throw error;
}

export async function updateCommonArea(id: string, input: CommonAreaInput) {
  const { error } = await supabase.from('common_areas').update(input).eq('id', id);
  if (error) throw error;
}

export async function deleteCommonArea(id: string) {
  const { error } = await supabase.from('common_areas').delete().eq('id', id);
  if (error) throw error;
}
