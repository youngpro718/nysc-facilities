export type BuildingSection =
  | 'N' | 'NE' | 'NW'
  | 'S' | 'SE' | 'SW'
  | 'C' | 'CE' | 'CW' | 'CC';

export const BUILDING_SECTIONS: { code: BuildingSection; label: string }[] = [
  { code: 'N', label: 'North' },
  { code: 'NE', label: 'North East' },
  { code: 'NW', label: 'North West' },
  { code: 'S', label: 'South' },
  { code: 'SE', label: 'South East' },
  { code: 'SW', label: 'South West' },
  { code: 'C', label: 'Central' },
  { code: 'CE', label: 'Central East' },
  { code: 'CW', label: 'Central West' },
  { code: 'CC', label: 'Central Core' },
];

export function getSectionLabel(code?: BuildingSection | null): string {
  const found = BUILDING_SECTIONS.find(s => s.code === code);
  return found ? found.label : 'Unassigned';
}

// Optional helper for 2D/3D coordinates to section mapping. Assumes local floor coordinates.
export function computeSectionFromXY(x: number, y: number, opts?: { coreHalfWidth?: number }): BuildingSection {
  const core = Math.abs(x) <= (opts?.coreHalfWidth ?? 6);
  if (core) return 'C';
  return x < 0 ? 'CW' : 'CE';
}
