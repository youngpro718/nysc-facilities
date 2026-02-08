import { FloorPlanObjectData } from '../types/floorPlanTypes';
import { CSSProperties } from 'react';

interface NodeSize {
  width: number;
  height: number;
}

const DEFAULT_SIZES: Record<string, NodeSize> = {
  room: { width: 150, height: 100 },
  door: { width: 60, height: 20 },
  hallway: { width: 300, height: 50 }
};

const DEFAULT_COLORS = {
  room: {
    background: '#e2e8f0',
    border: '#cbd5e1'
  },
  door: {
    background: '#94a3b8',
    border: '#475569'
  },
  hallway: {
    background: '#e5e7eb',
    border: '#cbd5e1'
  }
};

export const getNodeBaseStyle = (
  type: 'room' | 'door' | 'hallway',
  data: FloorPlanObjectData,
  selected: boolean = false
): CSSProperties => {
  // Ensure we have valid data and size
  const size = (data?.size?.width && data?.size?.height) ? data.size : DEFAULT_SIZES[type];
  const colors = DEFAULT_COLORS[type];

  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: type === 'door' ? '2px' : '10px',
    borderRadius: '3px',
    width: `${size.width}px`,
    height: `${size.height}px`,
    // Standardize on backgroundColor to avoid shorthand/non-shorthand conflicts with React Flow internals
    backgroundColor: data?.style?.backgroundColor || (data?.style as Record<string, unknown>)?.background || colors.background,
    border: `${selected ? '2px' : '1px'} solid ${data?.style?.borderColor || colors.border}`,
    transform: data?.rotation ? `rotate(${data.rotation}deg)` : 'none',
    position: 'relative' as const,
    overflow: 'hidden'
  };
};

export const getResizerConfig = (type: 'room' | 'door' | 'hallway') => {
  const configs = {
    room: { minWidth: 100, minHeight: 100 },
    door: { minWidth: 40, minHeight: 15 },
    hallway: { minWidth: 200, minHeight: 40 }
  };

  return {
    ...configs[type],
    isVisible: true,
    lineClassName: "border-blue-400",
    handleClassName: "h-3 w-3 bg-white border-2 rounded border-blue-400"
  };
}; 