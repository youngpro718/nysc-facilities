
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreateLightingDialog } from "@/components/lighting/CreateLightingDialog";
import { LightingDashboard } from "@/components/lighting/dashboard/LightingDashboard";
import { LightingFixturesList } from "@/components/lighting/LightingFixturesList";
import { LightingZonesList } from "@/components/lighting/LightingZonesList";
import { MaintenanceView } from "@/components/lighting/MaintenanceView";
import { BuildingSelector } from "@/components/spaces/BuildingSelector";
import { FloorSelector } from "@/components/spaces/FloorSelector";
import { Card } from "@/components/ui/card";
import { 
  Lightbulb, 
  LayoutGrid, 
  CalendarClock, 
  AreaChart, 
  Settings2 
} from "lucide-react";

export default function Lighting() {
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [selectedBuilding, setSelectedBuilding] = useState<string>("all");
  const [selectedFloor, setSelectedFloor] = useState<string>("all");
  
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Lighting Management</h1>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex gap-2">
            <BuildingSelector
              value={selectedBuilding}
              onChange={setSelectedBuilding}
              className="w-full sm:w-[200px]"
            />
            <FloorSelector
              buildingId={selectedBuilding !== "all" ? selectedBuilding : undefined}
              value={selectedFloor}
              onChange={setSelectedFloor}
              className="w-full sm:w-[200px]"
            />
          </div>
          <CreateLightingDialog 
            onFixtureCreated={() => {}}
            onZoneCreated={() => {}}
          />
        </div>
      </div>

      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid grid-cols-2 md:grid-cols-5 h-auto">
          <TabsTrigger value="dashboard" className="flex gap-2 py-2 h-auto">
            <AreaChart className="h-4 w-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="fixtures" className="flex gap-2 py-2 h-auto">
            <Lightbulb className="h-4 w-4" />
            <span className="hidden sm:inline">Fixtures</span>
          </TabsTrigger>
          <TabsTrigger value="zones" className="flex gap-2 py-2 h-auto">
            <LayoutGrid className="h-4 w-4" />
            <span className="hidden sm:inline">Zones</span>
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="flex gap-2 py-2 h-auto">
            <CalendarClock className="h-4 w-4" />
            <span className="hidden sm:inline">Maintenance</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex gap-2 py-2 h-auto">
            <Settings2 className="h-4 w-4" />
            <span className="hidden sm:inline">Settings</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard">
          <LightingDashboard />
        </TabsContent>
        
        <TabsContent value="fixtures">
          <LightingFixturesList
            selectedBuilding={selectedBuilding} 
            selectedFloor={selectedFloor} 
          />
        </TabsContent>
        
        <TabsContent value="zones">
          <LightingZonesList
            selectedBuilding={selectedBuilding} 
            selectedFloor={selectedFloor} 
          />
        </TabsContent>
        
        <TabsContent value="maintenance">
          <MaintenanceView />
        </TabsContent>
        
        <TabsContent value="settings">
          <Card className="p-6">
            <h3 className="text-lg font-medium mb-4">Lighting System Settings</h3>
            <p className="text-muted-foreground">
              Configure system-wide settings for the lighting management system.
            </p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
