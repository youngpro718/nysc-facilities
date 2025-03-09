
import React, { useState } from 'react';
import { Html } from '@react-three/drei';

interface SpaceInfoCardProps {
  data: {
    id: string;
    label: string;
    properties?: any;
    size?: { width: number; height: number };
  };
  position: [number, number, number];
  visible: boolean;
  type?: 'room' | 'hallway' | 'door';
}

export function SpaceInfoCard({ data, position, visible, type = 'room' }: SpaceInfoCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!visible) return null;
  
  const getTypeIcon = () => {
    switch (type) {
      case 'room': return '🏠';
      case 'hallway': return '↔️';
      case 'door': return '🚪';
      default: return '📍';
    }
  };

  // Format size info to be more readable
  const formatSize = (size: any) => {
    if (!size) return 'Unknown dimensions';
    const { width, height } = size;
    
    if (!width || !height) return 'Unknown dimensions';
    return `${Math.round(width)} × ${Math.round(height)} units`;
  };
  
  // Get connection count
  const getConnectionsInfo = () => {
    const connections = data.properties?.connected_spaces;
    if (!connections || !Array.isArray(connections)) {
      return 'No connections';
    }
    return `${connections.length} connections`;
  };
  
  // Get lighting status if available
  const getLightingStatus = () => {
    const status = data.properties?.lighting_status;
    if (!status) return null;
    
    let statusIcon = '❓';
    let statusText = 'Unknown';
    
    switch (status) {
      case 'all_functional':
        statusIcon = '✅';
        statusText = 'All lights working';
        break;
      case 'partial_issues':
        statusIcon = '⚠️';
        statusText = `${data.properties?.functional_lights || 0}/${data.properties?.total_lights || 0} lights functioning`;
        break;
      case 'all_non_functional':
        statusIcon = '❌';
        statusText = 'No working lights';
        break;
      default:
        statusIcon = '❓';
        statusText = 'No lighting data';
    }
    
    return { icon: statusIcon, text: statusText };
  };
  
  const lightingStatus = getLightingStatus();
  
  return (
    <Html position={position} center zIndexRange={[900, 999]}>
      <div 
        className={`p-2 rounded-lg shadow-lg bg-white/95 backdrop-blur-sm 
                   transition-all duration-150 border border-gray-200 max-w-[240px]
                   ${isExpanded ? 'scale-100' : 'scale-95'}`}
        style={{ 
          transform: `translateY(-100%)`,
          pointerEvents: 'auto'
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start gap-2">
          <div className="text-xl">{getTypeIcon()}</div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm truncate">{data.label}</h3>
            <div className="text-xs text-gray-500">{formatSize(data.size)}</div>
            <div className="text-xs text-gray-500">{getConnectionsInfo()}</div>
            
            {lightingStatus && (
              <div className="text-xs flex items-center gap-1 mt-1">
                <span>{lightingStatus.icon}</span> 
                <span className="truncate">{lightingStatus.text}</span>
              </div>
            )}
            
            {isExpanded && data.properties && (
              <div className="mt-2 pt-2 border-t border-gray-100 space-y-1">
                {data.properties.room_number && (
                  <div className="text-xs">
                    <span className="font-medium">Room #:</span> {data.properties.room_number}
                  </div>
                )}
                
                {data.properties.space_type && (
                  <div className="text-xs">
                    <span className="font-medium">Type:</span> {data.properties.space_type}
                  </div>
                )}
                
                {data.properties.status && (
                  <div className="text-xs">
                    <span className="font-medium">Status:</span> {data.properties.status}
                  </div>
                )}
                
                {type === 'hallway' && data.properties.emergency_route && (
                  <div className="text-xs">
                    <span className="font-medium">Emergency Route:</span> {data.properties.emergency_route === 'designated' ? '✓ Yes' : '✗ No'}
                  </div>
                )}
                
                {type === 'door' && data.properties.is_transition_door && (
                  <div className="text-xs font-medium text-blue-600">
                    Transition Door
                  </div>
                )}
                
                {type === 'door' && data.properties.security_level && (
                  <div className="text-xs">
                    <span className="font-medium">Security Level:</span> {data.properties.security_level}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        {isExpanded ? (
          <div className="text-[10px] text-center mt-1 text-gray-400">Click to collapse</div>
        ) : (
          <div className="text-[10px] text-center mt-1 text-gray-400">Click for details</div>
        )}
      </div>
    </Html>
  );
}
