
import { Handle, NodeProps, NodeResizer } from 'reactflow';
import { FloorPlanObjectData } from '../types/floorPlanTypes';
import { useNodeHandles } from '../hooks/useNodeHandles';
import { getNodeBaseStyle, getResizerConfig } from '../utils/nodeStyles';

export function HallwayNode({ data, selected }: NodeProps<FloorPlanObjectData>) {
  if (!data) return null;

  const { handleStyle, standardHandles } = useNodeHandles(selected);
  const style = {
    ...getNodeBaseStyle('hallway', data, selected),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '6px 8px',
    fontSize: '0.75rem',
    fontWeight: 500
  };

  // Determine the hallway metadata for display
  const hallwaySection = data.properties?.section || 'connector';
  const hallwayType = data.properties?.hallwayType || 'public_main';
  const trafficFlow = data.properties?.traffic_flow || 'two_way';
  const accessibility = data.properties?.accessibility || 'fully_accessible';

  // Different appearance based on hallway attributes
  const getHallwayColor = () => {
    if (hallwayType === 'public_main') return '#e5e7eb';
    if (hallwayType === 'private') return '#f3f4f6';
    return '#e5e7eb';
  };

  // Apply styling based on properties
  const hallwayStyle = {
    ...style,
    backgroundColor: getHallwayColor()
  };

  return (
    <div style={hallwayStyle}>
      <NodeResizer {...getResizerConfig('hallway')} />
      
      {standardHandles.map((handle, index) => (
        <Handle
          key={`${handle.position}-${index}`}
          type={index % 2 === 0 ? "target" : "source"}
          position={handle.position}
          style={{ ...handleStyle, top: handle.top, left: handle.left }}
        />
      ))}
      
      <div style={{ 
        fontSize: '0.875rem', 
        fontWeight: 500, 
        color: '#374151', 
        whiteSpace: 'nowrap', 
        overflow: 'hidden', 
        textOverflow: 'ellipsis',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        <div>{data.label || 'Hallway'}</div>
        <div style={{ 
          fontSize: '0.75rem', 
          opacity: 0.7,
          marginTop: '2px'
        }}>
          {hallwaySection} • {hallwayType}
        </div>
      </div>
    </div>
  );
}
