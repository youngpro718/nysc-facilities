
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreateLightingDialog } from "@/components/lighting/CreateLightingDialog";
import { LightingDashboard } from "@/components/lighting/dashboard/LightingDashboard";
import { LightingFixturesList } from "@/components/lighting/LightingFixturesList";
import { LightingZonesList } from "@/components/lighting/LightingZonesList";
import { MaintenanceView } from "@/components/lighting/MaintenanceView";
import { BuildingSelector } from "@/components/spaces/BuildingSelector";
import { FloorSelector } from "@/components/spaces/FloorSelector";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Lightbulb, 
  LayoutGrid, 
  CalendarClock, 
  AreaChart, 
  Settings2,
  AlertCircle 
} from "lucide-react";
import LightingIssuesSection from '@/components/lighting/issues/LightingIssuesSection';

export default function Lighting() {
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [selectedBuilding, setSelectedBuilding] = useState<string>("all");
  const [selectedFloor, setSelectedFloor] = useState<string>("all");
  
  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Lighting Management</h1>
          <p className="text-muted-foreground">
            Monitor and manage lighting fixtures and systems throughout the facility
          </p>
        </div>
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
        className="space-y-6"
      >
        <TabsList className="grid grid-cols-3 lg:grid-cols-6 h-auto bg-muted p-1 rounded-lg">
          <TabsTrigger value="dashboard" className="flex gap-2 py-3 px-2 lg:px-4 h-auto data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <AreaChart className="h-4 w-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="fixtures" className="flex gap-2 py-3 px-2 lg:px-4 h-auto data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Lightbulb className="h-4 w-4" />
            <span className="hidden sm:inline">Fixtures</span>
          </TabsTrigger>
          <TabsTrigger value="zones" className="flex gap-2 py-3 px-2 lg:px-4 h-auto data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <LayoutGrid className="h-4 w-4" />
            <span className="hidden sm:inline">Zones</span>
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="flex gap-2 py-3 px-2 lg:px-4 h-auto data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <CalendarClock className="h-4 w-4" />
            <span className="hidden sm:inline">Maintenance</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex gap-2 py-3 px-2 lg:px-4 h-auto data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Settings2 className="h-4 w-4" />
            <span className="hidden sm:inline">Settings</span>
          </TabsTrigger>
          <TabsTrigger value="issues" className="flex gap-2 py-3 px-2 lg:px-4 h-auto data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <AlertCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Issues</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard" className="space-y-6">
          <LightingDashboard />
        </TabsContent>
        
        <TabsContent value="fixtures" className="space-y-6">
          <LightingFixturesList
            selectedBuilding={selectedBuilding} 
            selectedFloor={selectedFloor} 
          />
        </TabsContent>
        
        <TabsContent value="issues" className="space-y-6">
          <LightingIssuesSection />
        </TabsContent>
        
        <TabsContent value="zones" className="space-y-6">
          <LightingZonesList
            selectedBuilding={selectedBuilding} 
            selectedFloor={selectedFloor} 
          />
        </TabsContent>
        
        <TabsContent value="maintenance" className="space-y-6">
          <MaintenanceView />
        </TabsContent>
        
        <TabsContent value="settings" className="space-y-6">
          <Card className="bg-card">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">Lighting System Settings</h3>
                  <p className="text-muted-foreground">
                    Configure system-wide settings for the lighting management system.
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Card className="p-4 bg-muted/50">
                    <h4 className="font-medium">Energy Management</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Configure energy saving schedules and automatic controls.
                    </p>
                  </Card>
                  <Card className="p-4 bg-muted/50">
                    <h4 className="font-medium">Maintenance Alerts</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Set up automatic maintenance reminders and notifications.
                    </p>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
