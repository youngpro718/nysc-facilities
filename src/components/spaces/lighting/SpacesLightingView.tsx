
import { Button } from "@/components/ui/button";
import { CreateZoneDialog } from "../../../components/lighting/CreateZoneDialog";
import { LightingZonesList } from "../../../components/lighting/LightingZonesList";
import { LightingFixturesList } from "../../../components/lighting/LightingFixturesList";
import { MaintenanceView } from "../../../components/lighting/MaintenanceView";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

interface SpacesLightingViewProps {
  selectedBuilding: string;
  selectedFloor: string;
}

export function SpacesLightingView({ selectedBuilding, selectedFloor }: SpacesLightingViewProps) {
  return (
    <Tabs defaultValue="fixtures" className="w-full">
      <div className="flex items-center justify-between border-b px-6 py-4">
        <TabsList>
          <TabsTrigger value="fixtures">Fixtures</TabsTrigger>
          <TabsTrigger value="zones">Zones</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        </TabsList>
        <div className="flex items-center gap-2">
          <CreateZoneDialog />
        </div>
      </div>

      <TabsContent value="fixtures" className="mt-0">
        <LightingFixturesList selectedBuilding={selectedBuilding} selectedFloor={selectedFloor} />
      </TabsContent>

      <TabsContent value="zones" className="mt-0">
        <LightingZonesList selectedBuilding={selectedBuilding} selectedFloor={selectedFloor} />
      </TabsContent>

      <TabsContent value="maintenance" className="mt-0">
        <MaintenanceView />
      </TabsContent>
    </Tabs>
  );
}
