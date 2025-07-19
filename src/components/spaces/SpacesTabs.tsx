
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, DoorClosed, GitFork, LayoutPanelLeft, Users } from "lucide-react";
import RoomsPage from "./views/RoomsPage";
import HallwaysList from "./HallwaysList";
import DoorsList from "./DoorsList";
import { FloorPlanView } from "./floorplan/FloorPlanView";
import { RoomAccessManager } from "./RoomAccessManager";
import { Suspense, useState } from "react";

export interface SpaceViewProps {
  selectedBuilding: string;
  selectedFloor: string;
}

const SpacesTabs = ({ selectedBuilding, selectedFloor }: SpaceViewProps) => {
  const [activeTab, setActiveTab] = useState("rooms");

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
          <TabsTrigger value="floorplan" className="flex items-center gap-2">
            <LayoutPanelLeft size={16} />
            Floor Plan
          </TabsTrigger>
          <TabsTrigger value="access" className="flex items-center gap-2">
            <Users size={16} />
            Room Access
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rooms" className="mt-4">
          <RoomsPage selectedBuilding={selectedBuilding} selectedFloor={selectedFloor} />
        </TabsContent>

        <TabsContent value="hallways" className="mt-4">
          <HallwaysList selectedBuilding={selectedBuilding} selectedFloor={selectedFloor} />
        </TabsContent>

        <TabsContent value="doors" className="mt-4">
          <DoorsList selectedBuilding={selectedBuilding} selectedFloor={selectedFloor} />
        </TabsContent>

        <TabsContent value="floorplan" className="mt-4 h-[calc(100vh-16rem)]">
          <Suspense fallback={<div className="flex items-center justify-center h-full">Loading floor plan...</div>}>
            <FloorPlanView />
          </Suspense>
        </TabsContent>

        <TabsContent value="access" className="mt-4">
          <RoomAccessManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SpacesTabs;
