import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  Lightbulb, 
  MapPin, 
  AlertCircle,
  BarChart3
} from "lucide-react";
import { useLightingTabs } from "./hooks/useLightingTabs";
import { OverviewView } from "./overview/OverviewView";
import { LocationCentricView } from "./location/LocationCentricView";
import { StatusCentricView } from "./status/StatusCentricView";
import { ReportsView } from "./reports/ReportsView";
import { CreateLightingDialog } from "../CreateLightingDialog";
import { HallwayWalkthroughTab } from "./hallways/HallwayWalkthroughTab";

export function LightingPageLayout() {
  const { state, setActiveTab } = useLightingTabs();

  const tabConfig = [
    {
      id: 'overview',
      label: 'Dashboard',
      icon: LayoutDashboard,
      component: OverviewView,
      description: 'Overview stats, health metrics, and priority alerts'
    },
    {
      id: 'hallways',
      label: 'Hallways',
      icon: MapPin,
      component: HallwayWalkthroughTab,
      description: 'Hallway-focused walkthrough mode for quick inspections'
    },
    {
      id: 'location',
      label: 'By Location',
      icon: MapPin,
      component: LocationCentricView,
      description: 'Hierarchical view: floors → hallways → rooms'
    },
    {
      id: 'status',
      label: 'Issues',
      icon: AlertCircle,
      component: StatusCentricView,
      description: 'All fixtures organized by status and issues'
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: BarChart3,
      component: ReportsView,
      description: 'Multi-dimensional reporting and analytics'
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
          <CreateLightingDialog 
            onFixtureCreated={() => console.log('Fixture created')}
            onZoneCreated={() => console.log('Zone created')}
          />
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
    </div>
  );
}