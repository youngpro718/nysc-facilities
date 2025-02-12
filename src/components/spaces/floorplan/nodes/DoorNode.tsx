
import { Handle, Position, NodeProps, NodeResizer } from 'reactflow';
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
      <NodeResizer 
        minWidth={20}
        minHeight={10}
        isVisible={true}
        lineClassName="border-blue-400"
        handleClassName="h-3 w-3 bg-white border-2 rounded border-blue-400"
      />
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
