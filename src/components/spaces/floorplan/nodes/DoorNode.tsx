
import { Handle, Position, NodeProps } from 'reactflow';
import { FloorPlanObjectData } from '../types/floorPlanTypes';

export function DoorNode({ data }: NodeProps<FloorPlanObjectData>) {
  const style = {
    width: data.size?.width || 40,
    height: data.size?.height || 10,
    backgroundColor: '#94a3b8',
    border: '2px solid #475569',
    ...data.style,
  };

  return (
    <>
      <Handle type="target" position={Position.Left} />
      <div style={style}>
        <div className="text-xs font-medium text-gray-800 truncate">
          {data.label}
        </div>
      </div>
      <Handle type="source" position={Position.Right} />
    </>
  );
}
