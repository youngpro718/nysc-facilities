
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, DoorClosed, GitFork, LayoutPanelLeft, Lightbulb } from "lucide-react";
import RoomsList from "./RoomsList";
import HallwaysList from "./HallwaysList";
import DoorsList from "./DoorsList";
import { FloorPlanView } from "./floorplan/FloorPlanView";
import { Suspense } from "react";
import { SpacesLightingView } from "./lighting/SpacesLightingView";

export interface SpaceViewProps {
  selectedBuilding: string;
  selectedFloor: string;
}

const SpacesTabs = ({ selectedBuilding, selectedFloor }: SpaceViewProps) => {
  return (
    <div className="space-y-4">
      <Tabs defaultValue="rooms" className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="rooms" className="flex items-center gap-2">
            <Building2 size={16} />
            Rooms
          </TabsTrigger>
          <TabsTrigger value="hallways" className="flex items-center gap-2">
            <GitFork size={16} />
            Hallways
          </TabsTrigger>
          <TabsTrigger value="doors" className="flex items-center gap-2">
            <DoorClosed size={16} />
            Doors
          </TabsTrigger>
          <TabsTrigger value="lighting" className="flex items-center gap-2">
            <Lightbulb size={16} />
            Lighting
          </TabsTrigger>
          <TabsTrigger value="floorplan" className="flex items-center gap-2">
            <LayoutPanelLeft size={16} />
            Floor Plan
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rooms" className="mt-4">
          <RoomsList selectedBuilding={selectedBuilding} selectedFloor={selectedFloor} />
        </TabsContent>

        <TabsContent value="hallways" className="mt-4">
          <HallwaysList selectedBuilding={selectedBuilding} selectedFloor={selectedFloor} />
        </TabsContent>

        <TabsContent value="doors" className="mt-4">
          <DoorsList selectedBuilding={selectedBuilding} selectedFloor={selectedFloor} />
        </TabsContent>

        <TabsContent value="lighting" className="mt-4">
          <SpacesLightingView selectedBuilding={selectedBuilding} selectedFloor={selectedFloor} />
        </TabsContent>

        <TabsContent value="floorplan" className="mt-4">
          <Suspense fallback={<div>Loading floor plan...</div>}>
            <FloorPlanView />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SpacesTabs;
