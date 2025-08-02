import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, BarChart3, Info } from 'lucide-react';
import { PropertiesPanel } from './PropertiesPanel';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import { FloorPlanNode } from '../types/floorPlanTypes';

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
  const [activeTab, setActiveTab] = useState('properties');

  return (
    <Card className="h-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
        <div className="border-b border-slate-200 dark:border-slate-700 px-4 pt-4">
          <TabsList className="grid w-full grid-cols-3 bg-slate-100 dark:bg-slate-700">
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
                    <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Last Updated</p>
                      <p className="text-slate-900 dark:text-slate-100">{new Date().toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                {/* Selected Object Details */}
                {selectedObject && (
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                      Selected Object Details
                    </h3>
                    <div className="space-y-3">
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                        <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Object ID</p>
                        <p className="text-blue-900 dark:text-blue-100 font-mono text-xs">{selectedObject.id}</p>
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Type</p>
                        <p className="text-slate-900 dark:text-slate-100 capitalize">{selectedObject.type}</p>
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Position</p>
                        <p className="text-slate-900 dark:text-slate-100 font-mono text-sm">
                          ({Math.round(selectedObject.position.x)}, {Math.round(selectedObject.position.y)})
                        </p>
                      </div>
                      {selectedObject.data?.size && (
                        <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Dimensions</p>
                          <p className="text-slate-900 dark:text-slate-100 font-mono text-sm">
                            {selectedObject.data.size.width} × {selectedObject.data.size.height}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* System Information */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                    System Information
                  </h3>
                  <div className="space-y-3">
                    <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">3D Renderer</p>
                      <p className="text-slate-900 dark:text-slate-100">Three.js WebGL</p>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Grid System</p>
                      <p className="text-slate-900 dark:text-slate-100">20px Snap Grid</p>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Lighting</p>
                      <p className="text-slate-900 dark:text-slate-100">Enhanced PBR Materials</p>
                    </div>
                  </div>
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
