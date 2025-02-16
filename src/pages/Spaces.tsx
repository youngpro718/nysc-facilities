
import { useState } from "react";
import SpacesTabs from "@/components/spaces/SpacesTabs";
import { CreateSpaceDialog } from "@/components/spaces/CreateSpaceDialog";
import { BuildingFloorNav } from "@/components/spaces/navigation/BuildingFloorNav";
import { SpacesBreadcrumb } from "@/components/spaces/navigation/SpacesBreadcrumb";

const Spaces = () => {
  const [selectedBuilding, setSelectedBuilding] = useState<string>("all");
  const [selectedFloor, setSelectedFloor] = useState<string>("all");

  const handleBuildingChange = (buildingId: string) => {
    setSelectedBuilding(buildingId);
    setSelectedFloor("all"); // Reset floor when building changes
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">Space Management</h2>
          <SpacesBreadcrumb buildingId={selectedBuilding} floorId={selectedFloor} />
        </div>
        <CreateSpaceDialog />
      </div>
      
      <BuildingFloorNav
        selectedBuilding={selectedBuilding}
        selectedFloor={selectedFloor}
        onBuildingChange={handleBuildingChange}
        onFloorChange={setSelectedFloor}
      />
      
      <SpacesTabs
        selectedBuilding={selectedBuilding}
        selectedFloor={selectedFloor}
      />
    </div>
  );
};

export default Spaces;
