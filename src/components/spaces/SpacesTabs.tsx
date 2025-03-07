
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Grid3X3 } from "lucide-react";
import { FloorPlan3D } from "./floorplan/FloorPlan3D";
import { RoomsList } from "./RoomsList";

interface SpacesTabsProps {
  selectedBuilding: string;
  selectedFloor: string;
}

const SpacesTabs = ({ selectedBuilding, selectedFloor }: SpacesTabsProps) => {
  const [activeTab, setActiveTab] = useState<string>("list");

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <div className="flex justify-between items-center mb-4">
        <TabsList>
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="3d" className="flex items-center gap-1">
            <Grid3X3 className="h-4 w-4" />
            <span>3D View</span>
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="list" className="space-y-4">
        <RoomsList 
          buildingId={selectedBuilding === "all" ? undefined : selectedBuilding}
          floorId={selectedFloor === "all" ? undefined : selectedFloor}
        />
      </TabsContent>

      <TabsContent value="3d">
        <FloorPlan3D
          floorId={selectedFloor === "all" ? null : selectedFloor}
        />
      </TabsContent>
    </Tabs>
  );
};

export default SpacesTabs;
