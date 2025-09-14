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
import { ModernFloorPlanView } from './floorplan/ModernFloorPlanView';
// Removed Access Control view (RoomAccessManager)

const SpacesTabs = () => {
  const [activeView, setActiveView] = useState("rooms");
  const [floorPlanExpanded, setFloorPlanExpanded] = useState(false);

  return (
    <div className="space-y-6">
      {/* Top Navigation Bar - Horizontal Layout */}
      <div className="bg-card border rounded-lg p-4">
        <div className="flex items-start sm:items-center justify-between mb-4 gap-3">
          <div>
            <h3 className="font-semibold text-lg">Space Management Tools</h3>
            <p className="text-sm text-muted-foreground">Navigate between different space management areas</p>
          </div>
          <div className="hidden sm:flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">Quick Stats:</span>
              <Badge variant="secondary" className="ml-2">94 Total</Badge>
              <Badge variant="default" className="ml-1">87 Active</Badge>
              <Badge variant="outline" className="ml-1">7 Vacant</Badge>
            </div>
          </div>
        </div>

        {/* Horizontal Navigation Buttons */}
        <div className="flex gap-3 flex-nowrap overflow-x-auto pb-1 -mx-1 px-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setActiveView('rooms')}
                  className={`flex items-center gap-3 px-3 py-2 sm:px-4 sm:py-3 rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                    activeView === 'rooms' 
                      ? 'bg-primary text-primary-foreground shadow-md' 
                      : 'bg-accent hover:bg-accent/80'
                  }`}
                  aria-pressed={activeView === 'rooms'}
                  aria-current={activeView === 'rooms' ? 'page' : undefined}
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
              </TooltipTrigger>
              <TooltipContent side="bottom">Room Management</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Infrastructure removed */}

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setActiveView('floorplan')}
                  className={`flex items-center gap-3 px-3 py-2 sm:px-4 sm:py-3 rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                    activeView === 'floorplan' 
                      ? 'bg-green-600 text-white shadow-md' 
                      : 'bg-accent hover:bg-accent/80'
                  }`}
                  aria-pressed={activeView === 'floorplan'}
                  aria-current={activeView === 'floorplan' ? 'page' : undefined}
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
              </TooltipTrigger>
              <TooltipContent side="bottom">Interactive floor plan</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Access Control removed */}
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
                    <ModernFloorPlanView />
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
