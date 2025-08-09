import { LightingFixture } from '@/types/lighting';

export function getFixtureLocationText(f: LightingFixture): string {
  return f.room_number || f.space_name || 'Unknown';
}

export function getFixtureFullLocationText(f: LightingFixture): string {
  const parts: string[] = [];
  if (f.building_name) parts.push(f.building_name);
  if (f.floor_name) parts.push(`Floor ${f.floor_name}`);
  if (f.space_name) parts.push(f.space_name);
  if (f.room_number) parts.push(`#${f.room_number}`);
  return parts.join(' • ') || 'Location not assigned';
}
