
import { Handle, Position, NodeProps } from 'reactflow';
import { FloorPlanObjectData } from '../types/floorPlanTypes';

export function DoorNode({ data }: NodeProps<FloorPlanObjectData>) {
  const style = {
    width: data.size.width,
    height: data.size.height,
    backgroundColor: '#94a3b8',
    border: '2px solid #475569',
    ...data.style,
  };

  return (
    <>
      <Handle type="target" position={Position.Left} />
      <div style={style}>
        {data.label}
      </div>
      <Handle type="source" position={Position.Right} />
    </>
  );
}
