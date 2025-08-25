import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  LayoutDashboard, 
  Lightbulb, 
  MapPin, 
  Wrench, 
  BarChart3,
  Plus,
  Settings,
  Bell
} from "lucide-react";
import { useLightingTabs } from "./hooks/useLightingTabs";
import { EnhancedDashboard } from "./dashboard/EnhancedDashboard";
import { OverviewView } from "./overview/OverviewView";
import { SmartFixturesView } from "./fixtures/SmartFixturesView";
import { RoomCentricView } from "./rooms/RoomCentricView";
import { MaintenanceWorkflow } from "./maintenance/MaintenanceWorkflow";
import { ReportsView } from "./reports/ReportsView";
import { CreateLightingDialog } from "../CreateLightingDialog";
import { SettingsDialog } from "./settings/SettingsDialog";

export function LightingPageLayout() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [alertsExpanded, setAlertsExpanded] = useState(false);
  const { state, setActiveTab } = useLightingTabs();

  const tabConfig = [
    {
      id: 'overview',
      label: 'Overview',
      icon: LayoutDashboard,
      component: OverviewView,
      description: 'Executive dashboard with key metrics and alerts'
    },
    {
      id: 'fixtures',
      label: 'Fixtures',
      icon: Lightbulb,
      component: SmartFixturesView,
      description: 'Manage individual lighting fixtures by room or status'
    },
    {
      id: 'rooms',
      label: 'Zones',
      icon: MapPin,
      component: RoomCentricView,
      description: 'Organize fixtures into logical zones for better management'
    },
    {
      id: 'maintenance',
      label: 'Maintenance',
      icon: Wrench,
      component: MaintenanceWorkflow,
      description: 'Schedule and track maintenance work'
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: BarChart3,
      component: ReportsView,
      description: 'Analytics and insights for facilities management'
    }
  ];

  const activeTabConfig = tabConfig.find(tab => tab.id === state.activeTab);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Lightbulb className="h-8 w-8" />
            Lighting Management
          </h1>
          <p className="text-muted-foreground">
            {activeTabConfig?.description || 'Comprehensive lighting facilities management'}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setActiveTab('overview')}
          >
            <Bell className="h-4 w-4 mr-2" />
            View Alerts
          </Button>
          
          <CreateLightingDialog 
            onFixtureCreated={() => console.log('Fixture created')}
            onZoneCreated={() => console.log('Zone created')}
          />
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setSettingsOpen(true)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <Tabs value={state.activeTab} onValueChange={(value: any) => setActiveTab(value)}>
        <TabsList className="grid w-full grid-cols-5">
          {tabConfig.map((tab) => (
            <TabsTrigger 
              key={tab.id} 
              value={tab.id}
              className="flex items-center gap-2"
            >
              <tab.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Tab Content */}
        {tabConfig.map((tab) => (
          <TabsContent key={tab.id} value={tab.id} className="mt-6">
            <tab.component />
          </TabsContent>
        ))}
      </Tabs>

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}