
import React from 'react';
import { Html } from '@react-three/drei';
import { StretchHorizontalIcon } from 'lucide-react';

interface SpaceInfoCardProps {
  data: any;
  position: [number, number, number];
  visible: boolean;
  type: string;
}

export function SpaceInfoCard({
  data,
  position,
  visible,
  type
}: SpaceInfoCardProps) {
  if (!visible) return null;
  
  return (
    <Html position={position} center distanceFactor={10} occlude zIndexRange={[16, 100]}>
      <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-2 min-w-[160px] max-w-[200px] text-xs border border-gray-200">
        <div className="font-semibold border-b pb-1 mb-1 flex items-center">
          <span className={`w-2 h-2 rounded-full mr-1.5 ${
            type === 'room' ? 'bg-blue-500' : 
            type === 'hallway' ? 'bg-green-500' : 'bg-amber-500'
          }`}></span>
          {data.label || type}
        </div>
        
        {type === 'room' && (
          <div className="space-y-1">
            {data.properties?.room_number && (
              <div>Room #: <span className="font-medium">{data.properties.room_number}</span></div>
            )}
            {data.properties?.room_type && (
              <div>Type: <span className="font-medium capitalize">{data.properties.room_type.replace('_', ' ')}</span></div>
            )}
            {data.properties?.total_lights && (
              <div>Lighting: 
                <span className={`font-medium ml-1 ${
                  data.properties.lighting_status === 'all_functional' ? 'text-green-600' :
                  data.properties.lighting_status === 'partial_issues' ? 'text-amber-600' :
                  data.properties.lighting_status === 'all_non_functional' ? 'text-red-600' :
                  'text-gray-600'
                }`}>
                  {data.properties.functional_lights}/{data.properties.total_lights} functional
                </span>
              </div>
            )}
            {data.properties?.connected_spaces?.length > 0 && (
              <div>Connections: <span className="font-medium">{data.properties.connected_spaces.length}</span></div>
            )}
          </div>
        )}
        
        {type === 'hallway' && (
          <div className="space-y-1">
            {data.properties?.section && (
              <div>Section: <span className="font-medium capitalize">{data.properties.section.replace('_', ' ')}</span></div>
            )}
            {data.properties?.hallwayType && (
              <div>Type: <span className="font-medium capitalize">{data.properties.hallwayType.replace('_', ' ')}</span></div>
            )}
            {data.properties?.accessibility && (
              <div>Access: <span className="font-medium capitalize">{data.properties.accessibility.replace('_', ' ')}</span></div>
            )}
            {data.properties?.emergency_route && data.properties.emergency_route !== 'not_designated' && (
              <div className="text-red-600 font-medium">Emergency Route</div>
            )}
            {data.properties?.connected_spaces?.length > 0 && (
              <div>Connected rooms: <span className="font-medium">{data.properties.connected_spaces.length}</span></div>
            )}
            {data.properties?.total_lights && (
              <div>Lighting: 
                <span className={`font-medium ml-1 ${
                  data.properties.lighting_status === 'all_functional' ? 'text-green-600' :
                  data.properties.lighting_status === 'partial_issues' ? 'text-amber-600' :
                  data.properties.lighting_status === 'all_non_functional' ? 'text-red-600' :
                  'text-gray-600'
                }`}>
                  {data.properties.functional_lights}/{data.properties.total_lights} functional
                </span>
              </div>
            )}
          </div>
        )}
        
        {type === 'door' && (
          <div className="space-y-1">
            {data.properties?.doorType && (
              <div>Type: <span className="font-medium capitalize">{data.properties.doorType.replace('_', ' ')}</span></div>
            )}
            {data.properties?.security_level && (
              <div>Security: <span className="font-medium capitalize">{data.properties.security_level.replace('_', ' ')}</span></div>
            )}
            {data.properties?.connects && (
              <div>Connects: <span className="font-medium">{data.properties.connects}</span></div>
            )}
          </div>
        )}
        
        <div className="mt-1 pt-1 border-t text-gray-500 text-[10px] flex items-center justify-between">
          <div>ID: {data.id.substring(0, 6)}...</div>
          <div className="flex items-center">
            <StretchHorizontalIcon className="h-3 w-3 mr-0.5" />
            {data.size.width}×{data.size.height}
          </div>
        </div>
      </div>
    </Html>
  );
}
