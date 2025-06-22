import { RelocationService } from '@/services/RelocationService';
import type { Relocation, RelocationUpdate } from '@/services/RelocationService';

export async function fetchRelocations(
  status?: 'scheduled' | 'in_progress' | 'completed',
  buildingId?: string,
  floorId?: string,
  startDate?: string,
  endDate?: string
): Promise<Relocation[]> {
  // Optionally, add filtering logic here for building/floor/date if needed
  const all = await RelocationService.listRelocations();
  return all.filter(r =>
    (!status || r.status === status) &&
    (!startDate || (r.start_date && r.start_date >= startDate)) &&
    (!endDate || (r.end_date && r.end_date <= endDate))
    // TODO: Add buildingId/floorId filtering if Relocation includes room info
  );
}

export async function fetchActiveRelocations(): Promise<Relocation[]> {
  return fetchRelocations('in_progress');
}

export async function fetchRelocationById(id: string): Promise<Relocation> {
  return RelocationService.getRelocation(id);
}

export async function createRelocation(payload: Omit<Relocation, 'id' | 'created_at' | 'updated_at'>): Promise<Relocation> {
  return RelocationService.createRelocation(payload);
}

export async function updateRelocation(id: string, payload: RelocationUpdate): Promise<Relocation> {
  return RelocationService.updateRelocation(id, payload);
}
