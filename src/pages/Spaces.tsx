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
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Space Management</h2>
          <SpacesBreadcrumb buildingId={selectedBuilding} floorId={selectedFloor} />
        </div>
        <div className="flex gap-2">
          <CreateSpaceDialog />
        </div>
      </div>
      
      <BuildingFloorNav
        selectedBuilding={selectedBuilding}
        selectedFloor={selectedFloor}
        onBuildingChange={handleBuildingChange}
        onFloorChange={setSelectedFloor}
      />
      
      <div className="mt-6">
        <SpacesTabs
          selectedBuilding={selectedBuilding}
          selectedFloor={selectedFloor}
        />
      </div>
    </div>
  );
};

export default Spaces;
