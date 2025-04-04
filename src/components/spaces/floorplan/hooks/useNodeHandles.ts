
import { Position } from 'reactflow';
import { useState, useEffect } from 'react';

export function useNodeHandles(selected: boolean) {
  const [handleStyle, setHandleStyle] = useState({
    width: 8,
    height: 8,
    background: '#3b82f6',
    border: '1px solid white',
    borderRadius: '50%',
    opacity: selected ? 1 : 0
  });
  
  useEffect(() => {
    setHandleStyle(prev => ({
      ...prev,
      opacity: selected ? 1 : 0
    }));
  }, [selected]);

  // Predefined handle positions for each node type
  const roomHandles = [
    { position: Position.Top },
    { position: Position.Right },
    { position: Position.Bottom },
    { position: Position.Left }
  ];
  
  const doorHandles = [
    { position: Position.Left },
    { position: Position.Right }
  ];
  
  const hallwayHandles = [
    { position: Position.Top },
    { position: Position.Right },
    { position: Position.Bottom },
    { position: Position.Left }
  ];

  return { handleStyle, roomHandles, doorHandles, hallwayHandles };
}
