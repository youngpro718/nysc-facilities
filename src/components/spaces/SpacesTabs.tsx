
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RoomsList from "./RoomsList";
import DoorsList from "./DoorsList";
import { HallwaysList } from "./HallwaysList";

interface SpacesTabsProps {
  selectedBuilding: string;
  selectedFloor: string;
}

export default function SpacesTabs({ selectedBuilding, selectedFloor }: SpacesTabsProps) {
  return (
    <Tabs defaultValue="rooms">
      <TabsList className="mb-4">
        <TabsTrigger value="rooms">Rooms</TabsTrigger>
        <TabsTrigger value="hallways">Hallways</TabsTrigger>
        <TabsTrigger value="doors">Doors</TabsTrigger>
      </TabsList>
      <TabsContent value="rooms">
        <RoomsList selectedBuilding={selectedBuilding} selectedFloor={selectedFloor} />
      </TabsContent>
      <TabsContent value="hallways">
        <HallwaysList floorId={selectedFloor === 'all' ? undefined : selectedFloor} />
      </TabsContent>
      <TabsContent value="doors">
        <DoorsList selectedBuilding={selectedBuilding} selectedFloor={selectedFloor} />
      </TabsContent>
    </Tabs>
  );
}
