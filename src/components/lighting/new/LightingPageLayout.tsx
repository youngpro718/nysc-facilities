import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { logger } from "@/lib/logger";
import { 
  LayoutDashboard, 
  Lightbulb, 
  Building2
} from "lucide-react";
import { useLightingTabs } from "./hooks/useLightingTabs";
import { OverviewView } from "./overview/OverviewView";
import { CreateLightingDialog } from "../CreateLightingDialog";
import { FloorLightingView } from "./floors/FloorLightingView";
import type { LightingTab } from "./types";

export function LightingPageLayout() {
  const { state, setActiveTab } = useLightingTabs();

  const tabConfig = [
    {
      id: 'overview' as LightingTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
      component: OverviewView,
      description: 'Stats, health metrics, and fixture issues at a glance'
    },
    {
      id: 'floors' as LightingTab,
      label: 'Floor View',
      icon: Building2,
      component: FloorLightingView,
      description: 'Visual floor-by-floor lighting — tap any light to update'
    },
  ];

  const activeTabConfig = tabConfig.find(tab => tab.id === state.activeTab) || tabConfig[0];

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
            {activeTabConfig.description}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <CreateLightingDialog 
            onFixtureCreated={() => logger.debug('Fixture created')}
            onZoneCreated={() => logger.debug('Zone created')}
          />
        </div>
      </div>

      {/* Navigation Tabs — just 2 */}
      <Tabs value={state.activeTab} onValueChange={(value: string) => setActiveTab(value as LightingTab)}>
        <TabsList className="w-auto">
          {tabConfig.map((tab) => (
            <TabsTrigger 
              key={tab.id} 
              value={tab.id}
              className="flex items-center gap-2"
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
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