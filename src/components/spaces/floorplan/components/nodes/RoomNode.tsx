import { memo } from 'react';
import { Handle, NodeProps, Position } from 'reactflow';
import { FloorPlanObjectData } from '../../types/floorPlanTypes';

export const RoomNode = memo(({ data, selected }: NodeProps<FloorPlanObjectData>) => {
  const style = {
    padding: data.isParent ? '20px' : '10px',
    borderRadius: '3px',
    width: data.size?.width || 150,
    height: data.size?.height || 100,
    transform: data.rotation ? `rotate(${data.rotation}deg)` : undefined,
    border: selected ? '2px solid #2563eb' : '1px solid #94a3b8',
    backgroundColor: data.style?.backgroundColor || '#f8fafc',
    ...data.style
  };

  return (
    <>
      <div style={style}>
        <div className="text-sm font-medium text-gray-700">{data.label}</div>
        {data.properties?.room_number && (
          <div className="text-xs text-gray-500">#{data.properties.room_number}</div>
        )}
      </div>
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </>
  );
});
