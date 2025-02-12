
import { Handle, Position, NodeProps } from 'reactflow';
import { FloorPlanObjectData } from '../types/floorPlanTypes';

export function RoomNode({ data }: NodeProps<FloorPlanObjectData>) {
  const style = {
    padding: '10px',
    borderRadius: '3px',
    width: data.size.width,
    height: data.size.height,
    ...data.style,
  };

  return (
    <>
      <Handle type="target" position={Position.Top} />
      <div style={style}>
        {data.label}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </>
  );
}
