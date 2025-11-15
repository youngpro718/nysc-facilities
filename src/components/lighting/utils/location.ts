import { LightingFixture } from '@/types/lighting';

export function getFixtureLocationText(f: LightingFixture): string {
  // Short location string that prefers human-friendly space display name
  const name = (f.space_name || '').trim();
  const number = (f.room_number ?? '').toString().trim();
  const isUnknown = /^(unknown|unnamed)$/i.test(name);

  if (name && !isUnknown && number) return `${name} (#${number})`;
  if (name && !isUnknown) return name;
  if (number) return `#${number}`;
  return 'Unknown room';
}

export function getFixtureFullLocationText(f: LightingFixture): string {
  const parts: string[] = [];
  if (f.building_name) parts.push(f.building_name);
  if (f.floor_name) parts.push(`Floor ${f.floor_name}`);
  // Combine room display name and number when both exist
  const name = (f.space_name || '').trim();
  const number = (f.room_number ?? '').toString().trim();
  const isUnknown = /^(unknown|unnamed)$/i.test(name);
  if (name && !isUnknown && number) parts.push(`${name} (#${number})`);
  else if (name && !isUnknown) parts.push(name);
  else if (number) parts.push(`#${number}`);
  return parts.join(' • ') || 'Location not assigned';
}
