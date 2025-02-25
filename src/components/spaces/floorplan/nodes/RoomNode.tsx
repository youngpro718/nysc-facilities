import { Handle, NodeProps, NodeResizer } from 'reactflow';
import { FloorPlanObjectData } from '../types/floorPlanTypes';
import { useNodeHandles } from '../hooks/useNodeHandles';
import { getNodeBaseStyle, getResizerConfig } from '../utils/nodeStyles';

export function RoomNode({ data, selected }: NodeProps<FloorPlanObjectData>) {
  if (!data) return null;

  const { handleStyle, standardHandles } = useNodeHandles(selected);
  const style = getNodeBaseStyle('room', data, selected);
  const resizerConfig = getResizerConfig('room');

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
      
      <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#1f2937' }}>
        {data.label || 'Unnamed Room'}
        {data.properties?.room_number && (
          <div style={{ fontSize: '0.75rem', color: '#4b5563' }}>
            Room {data.properties.room_number}
          </div>
        )}
      </div>
    </div>
  );
}
