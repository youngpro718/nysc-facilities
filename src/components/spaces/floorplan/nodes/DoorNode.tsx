
import { Handle, NodeProps, NodeResizer } from 'reactflow';
import { getNodeBaseStyle, getResizerConfig } from '../utils/nodeStyles';
import { useNodeHandles } from '../hooks/useNodeHandles';

export function DoorNode({ data, selected }: NodeProps<any>) {
  if (!data) return null;

  const { handleStyle, doorHandles } = useNodeHandles(selected);
  const style = getNodeBaseStyle('door', data, selected);
  const resizerConfig = getResizerConfig('door');

  const isActive = data.properties?.status === 'active';
  const doorStyle = {
    ...style,
    backgroundColor: isActive ? style.backgroundColor : '#cbd5e1',
    border: isActive ? style.border : '2px solid #94a3b8'
  };

  return (
    <div style={doorStyle}>
      <NodeResizer {...resizerConfig} />
      
      {doorHandles.map((handle, index) => (
        <Handle
          key={`${handle.position}-${index}`}
          type={index % 2 === 0 ? "target" : "source"}
          position={handle.position}
          style={handleStyle}
        />
      ))}
      
      <div style={{ fontSize: '0.75rem', fontWeight: 500, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {data.label || 'Door'}
        {data.properties?.room_number && (
          <span style={{ marginLeft: '0.25rem', opacity: 0.8 }}>
            ({data.properties.room_number})
          </span>
        )}
      </div>
    </div>
  );
}
