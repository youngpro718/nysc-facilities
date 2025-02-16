
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LightingFixturesList } from "./LightingFixturesList";
import { LightingZonesList } from "./LightingZonesList";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { AssignFixtureDialog } from "@/components/spaces/rooms/lighting/AssignFixtureDialog";

interface SpacesLightingViewProps {
  selectedBuilding: string;
  selectedFloor: string;
}

export function SpacesLightingView({ selectedBuilding, selectedFloor }: SpacesLightingViewProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Tabs defaultValue="fixtures" className="w-full">
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="fixtures">Fixtures</TabsTrigger>
              <TabsTrigger value="zones">Zones</TabsTrigger>
              <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
            </TabsList>
            
            <div className="flex items-center gap-2">
              {/* Remove AssignFixtureDialog since it requires a roomId context */}
              <Button variant="secondary" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Create Zone
              </Button>
            </div>
          </div>

          <TabsContent value="fixtures" className="mt-0">
            <LightingFixturesList selectedBuilding={selectedBuilding} selectedFloor={selectedFloor} />
          </TabsContent>

          <TabsContent value="zones" className="mt-0">
            <LightingZonesList selectedBuilding={selectedBuilding} selectedFloor={selectedFloor} />
          </TabsContent>

          <TabsContent value="maintenance" className="mt-0">
            <div className="text-center py-4 text-muted-foreground">
              Maintenance schedule coming soon...
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
