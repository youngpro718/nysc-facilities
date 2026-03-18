
import { useMemo } from 'react';
import { Position } from 'reactflow';

interface HandleConfig {
  position: Position;
  top?: string;
  left?: string;
}

export const useNodeHandles = (selected: boolean) => {
  const handleStyle = useMemo(() => ({
    width: 8,
    height: 8,
    background: selected ? '#3b82f6' : '#64748b'
  }), [selected]);

  const standardHandles: HandleConfig[] = useMemo(() => [
    // Left handles
    { position: Position.Left, top: '25%' },
    { position: Position.Left, top: '75%' },
    // Right handles
    { position: Position.Right, top: '25%' },
    { position: Position.Right, top: '75%' },
    // Top handles
    { position: Position.Top, left: '25%' },
    { position: Position.Top, left: '75%' },
    // Bottom handles
    { position: Position.Bottom, left: '25%' },
    { position: Position.Bottom, left: '75%' }
  ], []);

  const doorHandles: HandleConfig[] = useMemo(() => [
    { position: Position.Left },
    { position: Position.Right },
    { position: Position.Top },
    { position: Position.Bottom }
  ], []);

  return {
    handleStyle,
    standardHandles,
    doorHandles
  };
}; 