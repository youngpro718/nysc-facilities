
import { Handle, NodeProps, NodeResizer } from 'reactflow';
import { getNodeBaseStyle, getResizerConfig } from '../utils/nodeStyles';
import { useNodeHandles } from '../hooks/useNodeHandles';

export function HallwayNode({ data, selected }: NodeProps<any>) {
  if (!data) return null;

  const { handleStyle, hallwayHandles } = useNodeHandles(selected);
  const style = getNodeBaseStyle('hallway', data, selected);
  const resizerConfig = getResizerConfig('hallway');

  // Additional styling for hallways based on properties
  const isEmergencyRoute = data.properties?.emergency_route === 'primary';
  const hallwayStyle = {
    ...style,
    ...(isEmergencyRoute && { 
      border: '2px dashed #ef4444',
      backgroundColor: `${style.backgroundColor}dd` // Add some transparency
    })
  };

  return (
    <div style={hallwayStyle}>
      <NodeResizer {...resizerConfig} />
      
      {hallwayHandles.map((handle, index) => (
        <Handle
          key={`${handle.position}-${index}`}
          type={index % 2 === 0 ? "source" : "target"}
          position={handle.position}
          style={handleStyle}
        />
      ))}
      
      <div style={{ fontSize: '0.75rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {data.label || 'Hallway'}
        {data.properties?.section && (
          <span style={{ marginLeft: '0.25rem', opacity: 0.8 }}>
            ({data.properties.section})
          </span>
        )}
      </div>
    </div>
  );
}
