import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, BarChart3, Info, Users, Building2 } from 'lucide-react';
import { PropertiesPanel } from './PropertiesPanel';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import { FloorPlanNode } from '../types/floorPlanTypes';
import { useEnhancedRoomData } from '@/hooks/useEnhancedRoomData';

interface EnhancedPropertiesPanelProps {
  selectedObject: FloorPlanNode | null;
  allObjects: FloorPlanNode[];
  onUpdate: () => void;
  onPreviewChange?: (values: any) => void;
  selectedFloorName?: string;
}

export function EnhancedPropertiesPanel({ 
  selectedObject, 
  allObjects,
  onUpdate,
  onPreviewChange,
  selectedFloorName
}: EnhancedPropertiesPanelProps) {
  const [activeTab, setActiveTab] = useState('overview');

  // Load enriched room details when a room is selected
  // IMPORTANT: Always call hooks unconditionally to preserve hook order.
  // We pass an empty string when not a room; the hook itself uses `enabled: !!roomId`.
  const isRoom = selectedObject?.type === 'room';
  const roomId = isRoom ? String(selectedObject?.id) : '';
  const { data: enhancedRoom } = (useEnhancedRoomData as any)(roomId);

  return (
    <Card className="h-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
        <div className="border-b border-slate-200 dark:border-slate-700 px-4 pt-4">
          <TabsList className="grid w-full grid-cols-4 bg-slate-100 dark:bg-slate-700">
            <TabsTrigger value="overview" className="flex items-center gap-1.5 text-xs">
              <Users className="h-3.5 w-3.5" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="properties" className="flex items-center gap-1.5 text-xs">
              <Settings className="h-3.5 w-3.5" />
              Properties
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-1.5 text-xs">
              <BarChart3 className="h-3.5 w-3.5" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="info" className="flex items-center gap-1.5 text-xs">
              <Info className="h-3.5 w-3.5" />
              Info
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-hidden">
          <TabsContent value="overview" className="h-full m-0 p-0">
            {isRoom && enhancedRoom ? (
              <div className="h-full overflow-y-auto p-4 space-y-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg border">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Building2 className="h-4 w-4" />
                    {selectedFloorName || 'Unknown Floor'}
                  </div>
                  <h3 className="text-lg font-semibold">{enhancedRoom.name || enhancedRoom.room_name || 'Room'}</h3>
                  <div className="text-sm text-muted-foreground">Room {enhancedRoom.room_number || selectedObject?.data?.properties?.label}</div>
                </div>

                <div className="p-4 bg-white dark:bg-slate-800 rounded-lg border">
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Users className="h-4 w-4" /> Current Occupants
                  </h4>
                  {Array.isArray((enhancedRoom as any).current_occupants) && (enhancedRoom as any).current_occupants.length > 0 ? (
                    <ul className="space-y-2 text-sm">
                      {(enhancedRoom as any).current_occupants.map((o: any, idx: number) => (
                        <li key={idx} className="flex items-center justify-between">
                          <div>
                            {o.occupant?.first_name} {o.occupant?.last_name}
                            {o.is_primary ? <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">Primary</span> : null}
                          </div>
                          <div className="text-xs text-muted-foreground">{o.assignment_type?.replace(/_/g, ' ')}</div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-sm text-muted-foreground">No occupants assigned.</div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded border">
                    <div className="text-xs text-muted-foreground">Status</div>
                    <div className="text-sm font-medium capitalize">{(enhancedRoom as any).status || 'unknown'}</div>
                  </div>
                  <div className="p-3 rounded border">
                    <div className="text-xs text-muted-foreground">Type</div>
                    <div className="text-sm font-medium capitalize">{(enhancedRoom as any).room_type || selectedObject?.type}</div>
                  </div>
                </div>

                {Array.isArray((enhancedRoom as any).lighting_fixtures) && (
                  <div className="p-3 rounded border">
                    <div className="text-xs text-muted-foreground mb-1">Lighting</div>
                    <div className="text-sm">{(enhancedRoom as any).functional_fixtures_count}/{(enhancedRoom as any).total_fixtures_count} functional</div>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground p-6">
                Select a room to see overview details.
              </div>
            )}
          </TabsContent>
          <TabsContent value="properties" className="h-full m-0 p-0">
            {selectedObject ? (
              <PropertiesPanel
                selectedObject={selectedObject}
                onUpdate={onUpdate}
                onPreviewChange={onPreviewChange}
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                <div className="p-4 bg-slate-100 dark:bg-slate-700 rounded-full mb-4">
                  <Settings className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
                  No Object Selected
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xs">
                  Click on any room, door, or space in the floor plan to view and edit its properties.
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="analytics" className="h-full m-0 p-0">
            <div className="h-full overflow-y-auto p-4">
              <AnalyticsDashboard 
                objects={allObjects} 
                selectedFloorName={selectedFloorName}
              />
            </div>
          </TabsContent>

          <TabsContent value="info" className="h-full m-0 p-0">
            <div className="h-full overflow-y-auto p-6">
              <div className="space-y-6">
                {/* Floor Information */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                    <Info className="h-5 w-5 text-blue-600" />
                    Floor Information
                  </h3>
                  <div className="space-y-3">
                    <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Floor Name</p>
                      <p className="text-slate-900 dark:text-slate-100">{selectedFloorName || 'Unknown Floor'}</p>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Total Objects</p>
                      <p className="text-slate-900 dark:text-slate-100">{allObjects.length}</p>
                    </div>
                    {/* Remove noisy system info and IDs from primary view. Keep concise. */}
                  </div>
                </div>

                {/* System Information trimmed */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    System Info
                  </h3>
                  <p className="text-sm text-muted-foreground">Technical details hidden for clarity.</p>
                </div>

                {/* Help & Tips */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                    Tips & Controls
                  </h3>
                  <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                    <p>• Click objects to select and view properties</p>
                    <p>• Use mouse wheel to zoom in/out</p>
                    <p>• Drag to pan around the floor plan</p>
                    <p>• Toggle between 2D and 3D views</p>
                    <p>• Use advanced search to filter objects</p>
                    <p>• Check analytics for floor insights</p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </Card>
  );
}
