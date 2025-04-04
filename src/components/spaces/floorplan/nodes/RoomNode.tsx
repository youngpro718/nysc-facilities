
import { Handle, NodeProps, NodeResizer } from 'reactflow';
import { getNodeBaseStyle, getResizerConfig } from '../utils/nodeStyles';
import { useNodeHandles } from '../hooks/useNodeHandles';

export function RoomNode({ data, selected }: NodeProps<any>) {
  if (!data) return null;

  const { handleStyle, roomHandles } = useNodeHandles(selected);
  const style = getNodeBaseStyle('room', data, selected);
  const resizerConfig = getResizerConfig('room');

  // Get room status and type info for visualization
  const roomStatus = data.properties?.status || 'active';
  const roomType = data.properties?.room_type || 'office';
  const isStorage = data.properties?.is_storage;

  // Custom styling based on room properties
  const roomStyle = {
    ...style,
    ...(isStorage && { backgroundColor: '#d1fae5' }),
    ...(roomType === 'courtroom' && { 
      backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,0.1) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.1) 75%, transparent 75%, transparent)',
      backgroundSize: '10px 10px' 
    })
  };

  return (
    <div style={roomStyle}>
      <NodeResizer {...resizerConfig} />
      
      {roomHandles.map((handle, index) => (
        <Handle
          key={`${handle.position}-${index}`}
          type={index % 2 === 0 ? "source" : "target"}
          position={handle.position}
          style={handleStyle}
        />
      ))}
      
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        textAlign: 'center', 
        fontSize: '0.75rem', 
        fontWeight: 500, 
        whiteSpace: 'nowrap', 
        overflow: 'hidden', 
        textOverflow: 'ellipsis' 
      }}>
        <div>{data.label || 'Room'}</div>
        {data.properties?.room_number && (
          <div style={{ fontSize: '0.7rem', opacity: 0.7 }}>
            {data.properties.room_number}
          </div>
        )}
      </div>
    </div>
  );
}
