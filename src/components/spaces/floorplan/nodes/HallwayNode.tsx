import { Handle, NodeProps, NodeResizer } from 'reactflow';
import { FloorPlanObjectData } from '../types/floorPlanTypes';
import { useNodeHandles } from '../hooks/useNodeHandles';
import { getNodeBaseStyle, getResizerConfig } from '../utils/nodeStyles';

export function HallwayNode({ data, selected }: NodeProps<FloorPlanObjectData>) {
  if (!data) return null;

  const { handleStyle, standardHandles } = useNodeHandles(selected);
  const style = getNodeBaseStyle('hallway', data, selected);
  const resizerConfig = getResizerConfig('hallway');

  return (
    <div style={style}>
      <NodeResizer {...resizerConfig} />
      
      {standardHandles.map((handle, index) => (
        <Handle
          key={`${handle.position}-${index}`}
          type={index % 2 === 0 ? "target" : "source"}
          position={handle.position}
          style={{ ...handleStyle, top: handle.top, left: handle.left }}
        />
      ))}
      
      <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#374151', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {data.label || 'Hallway'}
      </div>
    </div>
  );
}
