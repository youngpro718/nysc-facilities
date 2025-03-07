
import { Handle, NodeProps, NodeResizer } from 'reactflow';
import { FloorPlanObjectData } from '../types/floorPlanTypes';
import { useNodeHandles } from '../hooks/useNodeHandles';
import { getNodeBaseStyle, getResizerConfig } from '../utils/nodeStyles';
import { Lightbulb } from 'lucide-react';

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
  // Safely extract properties with consistent naming
  const properties = data.properties || {};
  
  const hallwaySection = 
    (properties.section) || 
    'connector';
    
  const hallwayType = 
    (properties.hallwayType) || 
    (properties.type) ||
    'public_main';
    
  const trafficFlow = 
    (properties.traffic_flow) || 
    (properties.trafficFlow) || 
    'two_way';
    
  const accessibility = 
    (properties.accessibility) || 
    'fully_accessible';

  const emergencyRoute =
    (properties.emergency_route) ||
    (properties.emergencyRoute) ||
    'not_designated';

  // Get lighting status for visual indicator if available
  const lightingStatus = properties.lighting_status || 'unknown';
  const functionalLights = properties.functional_lights || 0;
  const totalLights = properties.total_lights || 0;
  
  // Different appearance based on hallway attributes
  const getHallwayColor = () => {
    if (hallwayType === 'public_main') return '#e5e7eb';
    if (hallwayType === 'private') return '#f3f4f6';
    return '#e5e7eb';
  };

  // Apply styling based on properties
  const hallwayStyle = {
    ...style,
    backgroundColor: getHallwayColor(),
    borderLeft: emergencyRoute === 'designated' ? '4px solid #dc2626' : undefined
  };

  // Lighting indicator styling
  const getLightingIndicatorColor = () => {
    if (lightingStatus === 'all_functional' || (functionalLights > 0 && functionalLights === totalLights)) 
      return '#10b981'; // Green for fully functional
    else if (lightingStatus === 'partial_issues' || (functionalLights > 0 && functionalLights < totalLights)) 
      return '#f59e0b'; // Amber for partial issues
    else if (lightingStatus === 'all_non_functional' || (functionalLights === 0 && totalLights > 0)) 
      return '#ef4444'; // Red for non-functional
    return '#94a3b8'; // Gray for unknown status
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
        alignItems: 'center',
        width: '100%'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <span>{data.label || 'Hallway'}</span>
          
          {/* Lighting status indicator */}
          {(lightingStatus !== 'unknown' || totalLights > 0) && (
            <div 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                color: getLightingIndicatorColor(),
                marginLeft: '4px'
              }}
              title={`${functionalLights}/${totalLights} lights functional`}
            >
              <Lightbulb size={14} />
              {totalLights > 0 && (
                <span style={{ fontSize: '0.7rem', marginLeft: '2px' }}>
                  {functionalLights}/{totalLights}
                </span>
              )}
            </div>
          )}
        </div>
        
        <div style={{ 
          fontSize: '0.75rem', 
          opacity: 0.7,
          marginTop: '2px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '4px'
        }}>
          <span>{hallwaySection}</span>
          <span>•</span>
          <span>{hallwayType}</span>
          {emergencyRoute === 'designated' && (
            <>
              <span>•</span>
              <span style={{ color: '#dc2626' }}>Emergency</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
