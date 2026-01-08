import * as THREE from 'three';

// Status-based colors for room outlines
export const STATUS_COLORS = {
  active: '#22c55e',      // green-500
  operational: '#22c55e', // green-500
  maintenance: '#f59e0b', // amber-500
  inactive: '#ef4444',    // red-500
  reserved: '#8b5cf6',    // violet-500
  default: '#0ea5e9'      // cyan-500 (blueprint blue)
} as const;

// Room type accent colors (subtle differentiation)
export const TYPE_COLORS = {
  courtroom: '#6366f1',   // indigo-500
  office: '#3b82f6',      // blue-500
  storage: '#78716c',     // stone-500
  hallway: '#8b5cf6',     // violet-500
  conference: '#0ea5e9', // cyan-500
  jury_room: '#ec4899',   // pink-500
  judges_chambers: '#f97316', // orange-500
  default: '#0ea5e9'
} as const;

// Blueprint grid colors
export const GRID_COLORS = {
  background: '#f0f9ff',  // sky-50
  minorLine: '#bae6fd',   // sky-200
  majorLine: '#0284c7',   // sky-600
  axis: '#0369a1'         // sky-700
} as const;

// Connection colors
export const CONNECTION_COLORS = {
  standard: '#0ea5e9',
  emergency: '#22c55e',
  highTraffic: '#f59e0b',
  selected: '#6366f1'
} as const;

export function getStatusColor(status?: string): string {
  if (!status) return STATUS_COLORS.default;
  const normalized = status.toLowerCase().replace(/[^a-z]/g, '');
  return STATUS_COLORS[normalized as keyof typeof STATUS_COLORS] || STATUS_COLORS.default;
}

export function getTypeColor(type?: string): string {
  if (!type) return TYPE_COLORS.default;
  const normalized = type.toLowerCase().replace(/[^a-z_]/g, '');
  return TYPE_COLORS[normalized as keyof typeof TYPE_COLORS] || TYPE_COLORS.default;
}

export function createWireframeMaterial(
  color: string,
  options: {
    opacity?: number;
    linewidth?: number;
    dashed?: boolean;
    dashSize?: number;
    gapSize?: number;
  } = {}
): THREE.LineBasicMaterial | THREE.LineDashedMaterial {
  const { opacity = 1, dashed = false, dashSize = 3, gapSize = 1 } = options;

  if (dashed) {
    return new THREE.LineDashedMaterial({
      color: new THREE.Color(color),
      opacity,
      transparent: opacity < 1,
      dashSize,
      gapSize,
    });
  }

  return new THREE.LineBasicMaterial({
    color: new THREE.Color(color),
    opacity,
    transparent: opacity < 1,
  });
}

export function createFloorMaterial(color: string, opacity: number = 0.15): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({
    color: new THREE.Color(color),
    opacity,
    transparent: true,
    side: THREE.DoubleSide,
  });
}
