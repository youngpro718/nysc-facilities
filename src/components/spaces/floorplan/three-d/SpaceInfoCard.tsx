import React, { useState } from 'react';
import { Html } from '@react-three/drei';
import { cn } from "@/lib/utils";
import { LightingStatusWheel } from "@/components/spaces/LightingStatusWheel";
interface SpaceInfoCardProps {
  data: {
    id: string;
    label: string;
    properties?: any;
    size?: {
      width: number;
      height: number;
    };
  };
  position: [number, number, number];
  visible: boolean;
  type?: 'room' | 'hallway' | 'door';
}
export function SpaceInfoCard({
  data,
  position,
  visible,
  type = 'room'
}: SpaceInfoCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  if (!visible) return null;
  const getTypeIcon = () => {
    switch (type) {
      case 'room':
        return '🏠';
      case 'hallway':
        return '↔️';
      case 'door':
        return '🚪';
      default:
        return '📍';
    }
  };
  const formatSize = (size: any) => {
    if (!size) return 'Unknown dimensions';
    const {
      width,
      height
    } = size;
    if (!width || !height) return 'Unknown dimensions';
    return `${Math.round(width)} × ${Math.round(height)} units`;
  };
  const getConnectionsInfo = () => {
    const connections = data.properties?.connected_spaces;
    if (!connections || !Array.isArray(connections) || connections.length === 0) {
      return 'No connections';
    }
    return `${connections.length} connections`;
  };
  const functionalLights = Number(data.properties?.functional_lights ?? 0);
  const totalLights = Number(data.properties?.total_lights ?? 0);
  return <Html position={position} center zIndexRange={[1000, 1100]}>
      <div className={cn("fixed transform -translate-x-1/2 -translate-y-full", "p-3 rounded-lg shadow-lg", "bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85", "border border-gray-200/50", "max-w-[240px] min-w-[180px]", "transition-all duration-150 ease-out", isExpanded ? "scale-100" : "scale-95 hover:scale-100")} style={{
      marginTop: '-10px',
      perspective: '1000px',
      WebkitPerspective: '1000px' as any,
      transformStyle: 'preserve-3d',
      WebkitTransformStyle: 'preserve-3d' as any
    }} onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-start gap-2">
          <div className="text-xl select-none">{getTypeIcon()}</div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm truncate text-zinc-950">{data.label}</h3>
            <div className="text-xs text-gray-500">{formatSize(data.size)}</div>
            <div className="text-xs text-gray-500">{getConnectionsInfo()}</div>
            
            {totalLights > 0 && (
              <div className="flex items-center gap-2 mt-1">
                <LightingStatusWheel
                  functional={functionalLights}
                  total={totalLights}
                  size={28}
                  onClick={() => {
                    const url = `/lighting?room=${encodeURIComponent(data.label)}`;
                    try {
                      window.history.pushState({}, '', url);
                      // Fallback navigate by full load if the app doesn't handle pushState here
                      if (typeof window.dispatchEvent === 'function') {
                        window.dispatchEvent(new PopStateEvent('popstate'));
                      }
                    } catch {
                      window.location.assign(url);
                    }
                  }}
                  title={`${functionalLights}/${totalLights} lights functional`}
                />
                <span className="text-xs text-gray-600">Lighting</span>
              </div>
            )}
            
            {isExpanded && data.properties && <div className="mt-2 pt-2 border-t border-gray-100 space-y-1.5">
                {data.properties.room_number && <div className="text-xs">
                    <span className="font-medium">Room #:</span> {data.properties.room_number}
                  </div>}
                
                {data.properties.space_type && <div className="text-xs">
                    <span className="font-medium">Type:</span> {data.properties.space_type}
                  </div>}
                
                {data.properties.status && <div className="text-xs">
                    <span className="font-medium">Status:</span> {data.properties.status}
                  </div>}

                {/* Child rooms / connected spaces clickable list */}
                {Array.isArray(data.properties?.connected_spaces) && data.properties.connected_spaces.length > 0 && (
                  <div className="text-xs">
                    <div className="font-medium mb-0.5">Sub rooms</div>
                    <div className="flex flex-wrap gap-1">
                      {data.properties.connected_spaces.map((c: any, idx: number) => {
                        const id = c?.id ?? undefined;
                        const label = typeof c === 'string' ? c : (c?.label ?? c?.name ?? `Room ${idx+1}`);
                        const url = id ? `/spaces?roomId=${encodeURIComponent(id)}` : `/spaces?search=${encodeURIComponent(label)}`;
                        return (
                          <button
                            key={id ?? `${label}-${idx}`}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              try {
                                window.history.pushState({}, '', url);
                                if (typeof window.dispatchEvent === 'function') window.dispatchEvent(new PopStateEvent('popstate'));
                              } catch {
                                window.location.assign(url);
                              }
                            }}
                            className="px-1.5 py-0.5 rounded border text-[10px] hover:bg-muted"
                            title={`Open ${label}`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* People with room access clickable list */}
                {Array.isArray(data.properties?.occupants_with_access) && data.properties.occupants_with_access.length > 0 && (
                  <div className="text-xs">
                    <div className="font-medium mb-0.5">Room Access</div>
                    <div className="flex flex-wrap gap-1">
                      {data.properties.occupants_with_access.map((o: any, idx: number) => {
                        const id = o?.id ?? undefined;
                        const name = typeof o === 'string' ? o : (o?.name ?? ((`${o?.first_name ?? ''} ${o?.last_name ?? ''}`.trim()) || `Occupant ${idx+1}`));
                        const url = id ? `/occupants/${encodeURIComponent(id)}` : `/occupants?search=${encodeURIComponent(name)}`;
                        return (
                          <button
                            key={id ?? `${name}-${idx}`}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              try {
                                window.history.pushState({}, '', url);
                                if (typeof window.dispatchEvent === 'function') window.dispatchEvent(new PopStateEvent('popstate'));
                              } catch {
                                window.location.assign(url);
                              }
                            }}
                            className="px-1.5 py-0.5 rounded border text-[10px] hover:bg-muted"
                            title={`Open ${name}`}
                          >
                            {name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Lights out list (clickable -> lighting page filtered) */}
                {(() => {
                  const lightsOut = (data.properties?.lights_out
                    || data.properties?.non_functional_fixtures
                    || data.properties?.non_functional_list) as any[] | undefined;
                  if (!Array.isArray(lightsOut) || lightsOut.length === 0) return null;
                  return (
                    <div className="text-xs">
                      <div className="font-medium mb-0.5">Lights Out</div>
                      <div className="flex flex-wrap gap-1">
                        {lightsOut.map((f: any, idx: number) => {
                          const id = f?.id ?? undefined;
                          const label = typeof f === 'string' ? f : (f?.label ?? f?.name ?? `Fixture ${idx+1}`);
                          const urlBase = `/lighting?room=${encodeURIComponent(data.label)}&status=out`;
                          const url = id ? `${urlBase}&fixtureId=${encodeURIComponent(id)}` : `${urlBase}&q=${encodeURIComponent(label)}`;
                          return (
                            <button
                              key={id ?? `${label}-${idx}`}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                try {
                                  window.history.pushState({}, '', url);
                                  if (typeof window.dispatchEvent === 'function') window.dispatchEvent(new PopStateEvent('popstate'));
                                } catch {
                                  window.location.assign(url);
                                }
                              }}
                              className="px-1.5 py-0.5 rounded border text-[10px] bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
                              title={`Open ${label}`}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
                {/* Fallback: if no explicit lightsOut list but the wheel shows outages, show a generic chip */}
                {(() => {
                  const functional = Number(data.properties?.functional_lights ?? 0);
                  const total = Number(data.properties?.total_lights ?? 0);
                  const hasList = Array.isArray(data.properties?.lights_out)
                    || Array.isArray(data.properties?.non_functional_fixtures)
                    || Array.isArray(data.properties?.non_functional_list);
                  if (total > 0 && functional < total && !hasList) {
                    const url = `/lighting?room=${encodeURIComponent(data.label)}&status=out`;
                    return (
                      <div className="text-xs">
                        <div className="font-medium mb-0.5">Lights Out</div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            try {
                              window.history.pushState({}, '', url);
                              if (typeof window.dispatchEvent === 'function') window.dispatchEvent(new PopStateEvent('popstate'));
                            } catch {
                              window.location.assign(url);
                            }
                          }}
                          className="px-1.5 py-0.5 rounded border text-[10px] bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
                          title={`Open lighting page`}
                        >
                          View {total - functional} lights out
                        </button>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>}
            {type === 'hallway' && data.properties.emergency_route && <div className="text-xs">
                <span className="font-medium">Emergency Route:</span> {data.properties.emergency_route === 'designated' ? '✓ Yes' : '✗ No'}
              </div>}
                
                {type === 'door' && data.properties.is_transition_door && <div className="text-xs font-medium text-blue-600">
                    Transition Door
                  </div>}
                
                {type === 'door' && data.properties.security_level && <div className="text-xs">
                    <span className="font-medium">Security Level:</span> {data.properties.security_level}
                  </div>}
              </div>
          </div>
        
        <div className="text-[10px] text-center mt-2 text-gray-400">
          {isExpanded ? "Click to collapse" : "Click for details"}
        </div>
      </div>
    </Html>;
}