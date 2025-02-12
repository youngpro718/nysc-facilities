
import { Handle, Position, NodeProps } from 'reactflow';
import { FloorPlanObjectData } from '../types/floorPlanTypes';

export function RoomNode({ data }: NodeProps<FloorPlanObjectData>) {
  if (!data) {
    console.error('No data provided to RoomNode');
    return null;
  }

  const style = {
    padding: '10px',
    borderRadius: '3px',
    width: data.size?.width || 150,
    height: data.size?.height || 100,
    ...data.style,
  };

  return (
    <>
      <Handle type="target" position={Position.Left} />
      <div style={style}>
        <div className="text-sm font-medium">
          {data.label}
          {data.properties?.room_number && (
            <div className="text-xs text-gray-600">
              Room {data.properties.room_number}
            </div>
          )}
        </div>
      </div>
      <Handle type="source" position={Position.Right} />
    </>
  );
}
