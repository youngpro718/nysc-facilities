// @ts-nocheck
import { Handle, NodeProps, NodeResizer } from 'reactflow';
import { FloorPlanObjectData } from '../types/floorPlanTypes';
import { useNodeHandles } from '../hooks/useNodeHandles';
import { getNodeBaseStyle, getResizerConfig } from '../utils/nodeStyles';
import { Lightbulb, ShieldAlert, Accessibility, ArrowRight } from 'lucide-react';

export function HallwayNode({ data, selected }: NodeProps<FloorPlanObjectData>) {
  // Hooks must be called unconditionally at the top level
  const { handleStyle, standardHandles } = useNodeHandles(selected);
  if (!data) return null;
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
    borderLeft: emergencyRoute === 'designated' || emergencyRoute === 'primary' ? '4px solid #dc2626' :
               emergencyRoute === 'secondary' ? '4px solid #f97316' : undefined,
    position: 'relative' as const
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

  // Accessibility indicator styling
  const getAccessibilityIndicator = () => {
    switch (accessibility) {
      case 'fully_accessible': 
        return { color: '#10b981', title: 'Fully Accessible' };
      case 'limited_access': 
        return { color: '#f59e0b', title: 'Limited Access' };
      case 'stairs_only': 
        return { color: '#f97316', title: 'Stairs Only' };
      case 'restricted': 
        return { color: '#ef4444', title: 'Restricted Access' };
      default: 
        return { color: '#94a3b8', title: 'Unknown Accessibility' };
    }
  };

  const accessibilityInfo = getAccessibilityIndicator();

  // Render connection badges if the hallway has connections
  const hasConnections = properties.connected_spaces && properties.connected_spaces.length > 0;

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
      
      {/* Emergency route indicator */}
      {(emergencyRoute === 'primary' || emergencyRoute === 'secondary') && (
        <div 
          className="absolute top-0 left-0 right-0 flex items-center justify-center"
          style={{ 
            backgroundColor: emergencyRoute === 'primary' ? 'rgba(220, 38, 38, 0.1)' : 'rgba(249, 115, 22, 0.1)',
            height: '100%',
            pointerEvents: 'none'
          }}
        >
          <div style={{ opacity: 0.2 }}>
            <ArrowRight size={24} color={emergencyRoute === 'primary' ? '#dc2626' : '#f97316'} />
          </div>
        </div>
      )}
      
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
        width: '100%',
        position: 'relative',
        zIndex: 2
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
                marginLeft: '4px',
                backgroundColor: 'rgba(255, 255, 255, 0.5)',
                padding: '1px 3px',
                borderRadius: '3px'
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
          opacity: 0.8,
          marginTop: '2px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '4px',
          width: '100%'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.5)',
            padding: '1px 3px',
            borderRadius: '3px',
            fontSize: '0.65rem'
          }}>
            <span>{hallwaySection.replace('_', ' ')}</span>
            <span style={{ margin: '0 2px' }}>•</span>
            <span>{hallwayType.replace('_', ' ')}</span>
          </div>
          
          {/* Accessibility indicator */}
          <div 
            style={{
              display: 'flex',
              alignItems: 'center',
              color: accessibilityInfo.color,
              backgroundColor: 'rgba(255, 255, 255, 0.5)',
              padding: '1px 3px',
              borderRadius: '3px',
              fontSize: '0.65rem'
            }}
            title={accessibilityInfo.title}
          >
            <Accessibility size={12} />
          </div>
          
          {/* Emergency route indicator */}
          {emergencyRoute !== 'not_designated' && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                color: emergencyRoute === 'primary' ? '#dc2626' : '#f97316',
                backgroundColor: 'rgba(255, 255, 255, 0.5)',
                padding: '1px 3px',
                borderRadius: '3px',
                fontSize: '0.65rem'
              }}
              title={`${emergencyRoute.charAt(0).toUpperCase() + emergencyRoute.slice(1)} Emergency Route`}
            >
              <ShieldAlert size={12} />
            </div>
          )}
        </div>
        
        {/* Connection count badge - if hallway has explicit connections */}
        {hasConnections && (
          <div style={{
            position: 'absolute',
            bottom: '-5px',
            right: '-5px',
            backgroundColor: '#3b82f6',
            color: 'white',
            borderRadius: '50%',
            width: '16px',
            height: '16px',
            fontSize: '0.6rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid white'
          }}
          title={`${properties.connected_spaces.length} connected spaces`}
          >
            {properties.connected_spaces.length}
          </div>
        )}
      </div>
    </div>
  );
}
