import { memo } from 'react';
import { Handle, NodeProps, Position } from 'reactflow';
import { FloorPlanObjectData } from '../../types/floorPlanTypes';

export const HallwayNode = memo(({ data, selected }: NodeProps<FloorPlanObjectData>) => {
  const style = {
    padding: '5px',
    borderRadius: '2px',
    width: data.size?.width || 60,
    height: data.size?.height || 20,
    transform: data.rotation ? `rotate(${data.rotation}deg)` : undefined,
    border: selected ? '2px solid #2563eb' : '1px solid #94a3b8',
    backgroundColor: data.style?.backgroundColor || '#e5e7eb',
    ...data.style
  };

  return (
    <>
      <div style={style}>
        <div className="text-xs text-gray-600">{data.label}</div>
      </div>
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </>
  );
});
