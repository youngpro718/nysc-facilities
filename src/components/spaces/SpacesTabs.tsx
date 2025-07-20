import React, { useState, Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Home, 
  Settings, 
  Map, 
  Users, 
  Activity, 
  LayoutPanelLeft,
  GitFork,
  DoorClosed,
  Maximize2,
  X
} from 'lucide-react';
import RoomsPage from './views/RoomsPage';
import HallwaysList from './HallwaysList';
import DoorsList from './DoorsList';
import { FloorPlanView } from './floorplan/FloorPlanView';
import { RoomAccessManager } from './RoomAccessManager';

interface SpaceViewProps {
  selectedBuilding: string | null;
  selectedFloor: string | null;
}

const SpacesTabs = ({ selectedBuilding, selectedFloor }: SpaceViewProps) => {
  const [activeView, setActiveView] = useState("rooms");
  const [floorPlanExpanded, setFloorPlanExpanded] = useState(false);

  return (
    <div className="space-y-6">
      {/* Top Navigation Bar - Horizontal Layout */}
      <div className="bg-card border rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-lg">Space Management Tools</h3>
            <p className="text-sm text-muted-foreground">Navigate between different space management areas</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">Quick Stats:</span>
              <Badge variant="secondary" className="ml-2">94 Total</Badge>
              <Badge variant="default" className="ml-1">87 Active</Badge>
              <Badge variant="outline" className="ml-1">7 Vacant</Badge>
            </div>
          </div>
        </div>

        {/* Horizontal Navigation Buttons */}
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => setActiveView('rooms')}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              activeView === 'rooms' 
                ? 'bg-primary text-primary-foreground shadow-md' 
                : 'bg-accent hover:bg-accent/80'
            }`}
          >
            <div className={`p-2 rounded-lg ${
              activeView === 'rooms' ? 'bg-primary-foreground/20' : 'bg-primary'
            }`}>
              <Home className={`h-4 w-4 ${
                activeView === 'rooms' ? 'text-primary-foreground' : 'text-white'
              }`} />
            </div>
            <div className="text-left">
              <h4 className="font-medium text-sm">Room Management</h4>
              <p className={`text-xs ${
                activeView === 'rooms' ? 'text-primary-foreground/70' : 'text-muted-foreground'
              }`}>Primary workspace</p>
            </div>
            {activeView === 'rooms' && (
              <Badge variant="secondary" className="ml-2">
                <Activity className="h-3 w-3 mr-1" />
                Active
              </Badge>
            )}
          </button>

          <button
            onClick={() => setActiveView('infrastructure')}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              activeView === 'infrastructure' 
                ? 'bg-slate-600 text-white shadow-md' 
                : 'bg-accent hover:bg-accent/80'
            }`}
          >
            <div className={`p-2 rounded-lg ${
              activeView === 'infrastructure' ? 'bg-white/20' : 'bg-slate-500'
            }`}>
              <Settings className={`h-4 w-4 ${
                activeView === 'infrastructure' ? 'text-white' : 'text-white'
              }`} />
            </div>
            <div className="text-left">
              <h4 className="font-medium text-sm">Infrastructure</h4>
              <p className={`text-xs ${
                activeView === 'infrastructure' ? 'text-white/70' : 'text-muted-foreground'
              }`}>Hallways & doors</p>
            </div>
          </button>

          <button
            onClick={() => setActiveView('floorplan')}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              activeView === 'floorplan' 
                ? 'bg-green-600 text-white shadow-md' 
                : 'bg-accent hover:bg-accent/80'
            }`}
          >
            <div className={`p-2 rounded-lg ${
              activeView === 'floorplan' ? 'bg-white/20' : 'bg-green-500'
            }`}>
              <Map className={`h-4 w-4 ${
                activeView === 'floorplan' ? 'text-white' : 'text-white'
              }`} />
            </div>
            <div className="text-left">
              <h4 className="font-medium text-sm">Floor Plan</h4>
              <p className={`text-xs ${
                activeView === 'floorplan' ? 'text-white/70' : 'text-muted-foreground'
              }`}>Visual overview</p>
            </div>
          </button>

          <button
            onClick={() => setActiveView('access')}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              activeView === 'access' 
                ? 'bg-purple-600 text-white shadow-md' 
                : 'bg-accent hover:bg-accent/80'
            }`}
          >
            <div className={`p-2 rounded-lg ${
              activeView === 'access' ? 'bg-white/20' : 'bg-purple-500'
            }`}>
              <Users className={`h-4 w-4 ${
                activeView === 'access' ? 'text-white' : 'text-white'
              }`} />
            </div>
            <div className="text-left">
              <h4 className="font-medium text-sm">Access Control</h4>
              <p className={`text-xs ${
                activeView === 'access' ? 'text-white/70' : 'text-muted-foreground'
              }`}>User permissions</p>
            </div>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="min-w-0">
        {activeView === 'rooms' && (
          <div className="space-y-4">
            {/* Header - Not in a card for less boxed-in feel */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <Home className="h-6 w-6" />
                  Room Management
                  <Badge variant="secondary" className="text-xs">
                    <Activity className="h-3 w-3 mr-1" />
                    Primary
                  </Badge>
                </h2>
                <p className="text-muted-foreground mt-1">
                  Browse, search, and manage all rooms with enhanced visual interface
                </p>
              </div>
            </div>
            
            {/* Room content - Direct integration without card wrapper */}
            <div className="min-h-[500px]">
              <RoomsPage selectedBuilding={selectedBuilding} selectedFloor={selectedFloor} />
            </div>
          </div>
        )}

        {activeView === 'infrastructure' && (
          <div className="bg-card border rounded-lg">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Infrastructure Management
              </h2>
              <p className="text-muted-foreground mt-1">
                Manage hallways, doors, and building infrastructure components
              </p>
            </div>
            <div className="p-6">
              <Tabs defaultValue="hallways" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="hallways" className="flex items-center gap-2">
                    <GitFork size={16} />
                    Hallways
                  </TabsTrigger>
                  <TabsTrigger value="doors" className="flex items-center gap-2">
                    <DoorClosed size={16} />
                    Doors
                  </TabsTrigger>
                </TabsList>
                <div className="min-h-[400px]">
                  <TabsContent value="hallways" className="mt-0">
                    <HallwaysList selectedBuilding={selectedBuilding} selectedFloor={selectedFloor} />
                  </TabsContent>
                  <TabsContent value="doors" className="mt-0">
                    <DoorsList selectedBuilding={selectedBuilding} selectedFloor={selectedFloor} />
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          </div>
        )}

        {activeView === 'floorplan' && (
          <>
            {/* Floor Plan - Expandable */}
            <div className={`bg-card border rounded-lg transition-all duration-300 ${
              floorPlanExpanded ? 'fixed inset-4 z-50' : 'relative'
            }`}>
              <div className="p-4 border-b flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <LayoutPanelLeft className="h-5 w-5" />
                    Floor Plan Viewer
                    {floorPlanExpanded && <Badge variant="secondary">Expanded View</Badge>}
                  </h2>
                  <p className="text-muted-foreground mt-1">
                    Interactive visual representation of building layouts and room relationships
                  </p>
                </div>
                <Button
                  onClick={() => setFloorPlanExpanded(!floorPlanExpanded)}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  {floorPlanExpanded ? (
                    <>
                      <X className="h-4 w-4" />
                      Close
                    </>
                  ) : (
                    <>
                      <Maximize2 className="h-4 w-4" />
                      Expand
                    </>
                  )}
                </Button>
              </div>
              
              {/* Floor Plan Content - No padding to allow full size */}
              <div className={`transition-all ${
                floorPlanExpanded ? 'h-[calc(100vh-140px)]' : 'h-[700px]'
              }`}>
                <Suspense fallback={
                  <div className="h-full flex items-center justify-center">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      Loading floor plan...
                    </div>
                  </div>
                }>
                  <div className="w-full h-full">
                    <FloorPlanView />
                  </div>
                </Suspense>
              </div>
            </div>
            
            {/* Backdrop for expanded view */}
            {floorPlanExpanded && (
              <div 
                className="fixed inset-0 bg-black/50 z-40" 
                onClick={() => setFloorPlanExpanded(false)}
              />
            )}
          </>
        )}

        {activeView === 'access' && (
          <div className="bg-card border rounded-lg">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Users className="h-5 w-5" />
                Room Access Management
              </h2>
              <p className="text-muted-foreground mt-1">
                Control user permissions and access rights for all rooms
              </p>
            </div>
            <div className="p-6">
              <div className="min-h-[400px]">
                <RoomAccessManager />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpacesTabs;
