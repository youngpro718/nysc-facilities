import React, { useState, Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Home, 
  Map, 
  Activity, 
  LayoutPanelLeft,
  Maximize2,
  X
} from 'lucide-react';
import RoomsPage from './views/RoomsPage';
// Removed Infrastructure views (HallwaysList, DoorsList)
import { FloorPlanViewer } from './floorplan/FloorPlanViewer';
// Removed Access Control view (RoomAccessManager)

const SpacesTabs = () => {
  const [activeView, setActiveView] = useState("rooms");
  const [floorPlanExpanded, setFloorPlanExpanded] = useState(false);

  return (
    <div className="space-y-6">
      {/* Modern Tab Navigation */}
      <div className="border-b sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-1 pt-4 pb-2">
          <div className="flex items-center gap-6">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setActiveView('rooms')}
                    className={`group flex items-center gap-2 px-4 py-2.5 rounded-t-lg border-b-2 transition-all ${
                      activeView === 'rooms'
                        ? 'border-primary text-foreground bg-accent/50'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-accent/30'
                    }`}
                  >
                    <Home className="h-4 w-4" />
                    <span className="font-medium text-sm">Rooms</span>
                    {activeView === 'rooms' && (
                      <Badge variant="secondary" className="h-5 text-xs">Active</Badge>
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent>Manage all rooms</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setActiveView('floorplan')}
                    className={`group flex items-center gap-2 px-4 py-2.5 rounded-t-lg border-b-2 transition-all ${
                      activeView === 'floorplan'
                        ? 'border-primary text-foreground bg-accent/50'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-accent/30'
                    }`}
                  >
                    <Map className="h-4 w-4" />
                    <span className="font-medium text-sm">Floor Plan</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent>View interactive floor plan</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <Badge variant="outline" className="text-xs">94 Total</Badge>
            <Badge variant="secondary" className="text-xs">87 Active</Badge>
          </div>
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
              <RoomsPage />
            </div>
          </div>
        )}

        {/* Infrastructure view removed */}

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
                  <p className="text-muted-foreground mt-1 hidden sm:block">
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
                floorPlanExpanded ? 'h-[calc(100vh-140px)]' : 'sm:h-[700px] h-[70vh]'
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
                    <FloorPlanViewer />
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

        {/* Access Control view removed */}
      </div>
    </div>
  );
};

export default SpacesTabs;
