
import { Handle, Position, NodeProps, NodeResizer } from 'reactflow';
import { FloorPlanObjectData } from '../types/floorPlanTypes';

export function HallwayNode({ data }: NodeProps<FloorPlanObjectData>) {
  const style = {
    width: data.size?.width || 300,
    height: data.size?.height || 50,
    backgroundColor: '#e5e7eb',
    border: '1px solid #cbd5e1',
    ...data.style,
  };

  return (
    <>
      <NodeResizer 
        minWidth={200}
        minHeight={40}
        isVisible={true}
        lineClassName="border-blue-400"
        handleClassName="h-3 w-3 bg-white border-2 rounded border-blue-400"
      />
      <Handle type="target" position={Position.Left} />
      <div style={style} className="flex items-center justify-center">
        <div className="text-sm font-medium text-gray-700 truncate">
          {data.label || 'Hallway'}
        </div>
      </div>
      <Handle type="source" position={Position.Right} />
    </>
  );
}
