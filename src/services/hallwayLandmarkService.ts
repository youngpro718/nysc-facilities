import { supabase } from '@/lib/supabase';
import { HallwayLandmark } from '@/types/walkthrough';

export async function createLandmark(
  hallwayId: string,
  name: string,
  type: HallwayLandmark['type'],
  sequenceOrder: number,
  fixtureRangeStart?: number,
  fixtureRangeEnd?: number
): Promise<HallwayLandmark> {
  const { data, error } = await supabase
    .from('hallway_landmarks')
    .insert({
      hallway_id: hallwayId,
      name,
      type,
      sequence_order: sequenceOrder,
      fixture_range_start: fixtureRangeStart,
      fixture_range_end: fixtureRangeEnd,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateLandmark(
  landmarkId: string,
  updates: Partial<Omit<HallwayLandmark, 'id' | 'hallway_id' | 'created_at' | 'updated_at'>>
): Promise<void> {
  const { error } = await supabase
    .from('hallway_landmarks')
    .update(updates)
    .eq('id', landmarkId);

  if (error) throw error;
}

export async function deleteLandmark(landmarkId: string): Promise<void> {
  const { error } = await supabase
    .from('hallway_landmarks')
    .delete()
    .eq('id', landmarkId);

  if (error) throw error;
}

export async function updateHallwayReferences(
  hallwayId: string,
  startReference?: string,
  endReference?: string,
  estimatedWalkTimeSeconds?: number
): Promise<void> {
  const { error } = await supabase
    .from('hallways')
    .update({
      start_reference: startReference,
      end_reference: endReference,
      estimated_walk_time_seconds: estimatedWalkTimeSeconds,
    })
    .eq('id', hallwayId);

  if (error) throw error;
}
