
import { Handle, NodeProps, NodeResizer } from 'reactflow';
import { FloorPlanObjectData } from '../types/floorPlanTypes';
import { useNodeHandles } from '../hooks/useNodeHandles';
import { getNodeBaseStyle, getResizerConfig } from '../utils/nodeStyles';

export function RoomNode({ data, selected }: NodeProps<FloorPlanObjectData>) {
  // Hooks must be called unconditionally at the top level
  const { handleStyle, standardHandles } = useNodeHandles(selected);
  if (!data) return null;
  const style = getNodeBaseStyle('room', data, selected);
  const resizerConfig = getResizerConfig('room');
  
  // Check if this is a child room
  const isChildRoom = !!data.properties?.parent_room_id;

  // Simplified, cleaner styling
  const nodeStyle = {
    ...style,
    backgroundColor: isChildRoom ? 'hsl(var(--muted))' : 'hsl(var(--card))',
    border: isChildRoom ? '2px dashed hsl(var(--muted-foreground))' : '2px solid hsl(var(--border))',
    borderRadius: '8px',
    boxShadow: selected ? '0 0 0 2px hsl(var(--primary))' : '0 1px 3px rgba(0,0,0,0.1)',
    transition: 'all 0.2s ease'
  };

  // Connection count for visual feedback
  const connectionCount = data.properties?.connected_spaces?.length || 0;

  return (
    <div style={nodeStyle}>
      <NodeResizer {...resizerConfig} />
      
      {standardHandles.map((handle, index) => (
        <Handle
          key={`${handle.position}-${index}`}
          type={index % 2 === 0 ? "target" : "source"}
          position={handle.position}
          style={{ 
            ...handleStyle, 
            top: handle.top, 
            left: handle.left,
            backgroundColor: 'hsl(var(--primary))',
            border: '2px solid hsl(var(--primary-foreground))',
            opacity: selected ? 1 : 0.7
          }}
        />
      ))}
      
      <div style={{ 
        fontSize: '0.875rem', 
        fontWeight: 500, 
        color: 'hsl(var(--foreground))',
        textAlign: 'center',
        padding: '4px'
      }}>
        {data.label || 'Unnamed Room'}
        {data.properties?.room_number && (
          <div style={{ 
            fontSize: '0.75rem', 
            color: 'hsl(var(--muted-foreground))',
            marginTop: '2px'
          }}>
            Room {data.properties.room_number}
          </div>
        )}
        {isChildRoom && (
          <div style={{ 
            fontSize: '0.7rem', 
            color: 'hsl(var(--muted-foreground))', 
            fontStyle: 'italic',
            marginTop: '2px'
          }}>
            Child Room
          </div>
        )}
        {connectionCount > 0 && (
          <div style={{ 
            fontSize: '0.7rem', 
            color: 'hsl(var(--primary))',
            marginTop: '4px',
            fontWeight: 600
          }}>
            {connectionCount} connections
          </div>
        )}
      </div>
    </div>
  );
}
