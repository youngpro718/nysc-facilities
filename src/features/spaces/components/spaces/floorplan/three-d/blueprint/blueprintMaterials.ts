import * as THREE from 'three';

// Status-based colors for room outlines - vibrant and clear
export const STATUS_COLORS = {
  active: '#22c55e',      // green-500
  operational: '#22c55e', // green-500
  maintenance: '#f59e0b', // amber-500
  inactive: '#ef4444',    // red-500
  reserved: '#8b5cf6',    // violet-500
  available: '#06b6d4',   // cyan-500
  default: '#38bdf8'      // sky-400 (brighter)
} as const;

// Room type accent colors (for floor fills) — lighter, more translucent
export const TYPE_COLORS = {
  courtroom: '#f97316',       // orange-500
  office: '#60a5fa',          // blue-400
  storage: '#a8a29e',         // stone-400
  hallway: '#a78bfa',         // violet-400
  conference: '#38bdf8',      // sky-400
  jury_room: '#f472b6',       // pink-400
  judges_chambers: '#fb923c', // orange-400
  default: '#38bdf8'          // sky-400
} as const;

// Blueprint grid colors — lighter, softer dark theme
export const GRID_COLORS = {
  background: '#1e293b',  // slate-800 (was slate-900)
  minorLine: '#334155',   // slate-700 (brighter)
  majorLine: '#38bdf8',   // sky-400
  axis: '#67e8f9'         // cyan-300
} as const;

// Connection colors
export const CONNECTION_COLORS = {
  standard: '#38bdf8',    // sky-400
  emergency: '#4ade80',   // green-400
  highTraffic: '#fbbf24', // amber-400
  selected: '#c084fc'     // purple-400
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

export function createFloorMaterial(color: string, opacity: number = 0.2): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({
    color: new THREE.Color(color),
    opacity,
    transparent: true,
    side: THREE.DoubleSide,
  });
}

export function createGlowMaterial(color: string, intensity: number = 0.5): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({
    color: new THREE.Color(color),
    opacity: intensity,
    transparent: true,
    side: THREE.DoubleSide,
  });
}
