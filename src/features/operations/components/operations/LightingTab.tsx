import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, Lightbulb, Map, ListTodo } from 'lucide-react';
import { LightingStatsBar } from '../lighting/LightingStatsBar';
import { LightingFixtureTable } from '../lighting/LightingFixtureTable';
import { useLightingQueue } from '@/features/lighting/hooks/useLightingData';
import { LightingIssuesQueue } from '@features/lighting/components/LightingIssuesQueue';
import { LightingCoverageView } from '@features/lighting/components/LightingCoverageView';
import { LightingRoomsTable } from '@features/lighting/components/LightingRoomsTable';

interface LightingTabProps {
  buildingId?: string;
  onRefresh: () => void;
}

export function LightingTab({ buildingId, onRefresh }: LightingTabProps) {
  const [needsElectricianFilter, setNeedsElectricianFilter] = useState(false);
  const [subTab, setSubTab] = useState<'issues' | 'coverage' | 'rooms'>('issues');

  const { data: lightingIssues = [], isLoading, refetch } = useLightingQueue(buildingId);

  // Calculate stats
  const stats = {
    fixturesOut: lightingIssues.filter(f => f.status === 'non_functional').length,
    ballastIssues: lightingIssues.filter(f => f.ballast_issue).length,
    needsElectrician: lightingIssues.filter(f => f.requires_electrician).length,
    emergencyNonFunctional: lightingIssues.filter(f => f.emergency_circuit && f.status === 'non_functional').length,
  };

  // Filter fixtures if electrician filter is active
  const filteredIssues = needsElectricianFilter
    ? lightingIssues.filter(f => f.requires_electrician)
    : lightingIssues;

  const handleRefresh = async () => {
    await refetch();
    onRefresh();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Lighting Management
          </h3>
          <p className="text-sm text-muted-foreground">
            Track and manage lighting fixtures across the facility
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleRefresh} variant="outline" size="sm" disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {/* Fixtures are added per-room from the room editor (which carries the
              required space/floor/building context) — no standalone add here. */}
        </div>
      </div>

      <Tabs value={subTab} onValueChange={(v) => setSubTab(v as typeof subTab)} className="w-full">
        <TabsList>
          <TabsTrigger value="issues" className="gap-1.5">
            <ListTodo className="h-4 w-4" /> Issues
          </TabsTrigger>
          <TabsTrigger value="coverage" className="gap-1.5">
            <Lightbulb className="h-4 w-4" /> Coverage
          </TabsTrigger>
          <TabsTrigger value="rooms" className="gap-1.5">
            <Map className="h-4 w-4" /> Rooms
          </TabsTrigger>
        </TabsList>

        <TabsContent value="issues" className="mt-4 space-y-6">
          {/* User-reported queue first — the FC's daily inbox */}
          <LightingIssuesQueue />

          <LightingStatsBar stats={stats} isLoading={isLoading} />

          <div className="flex items-center gap-2">
            <Button
              variant={needsElectricianFilter ? 'default' : 'outline'}
              size="sm"
              onClick={() => setNeedsElectricianFilter(!needsElectricianFilter)}
            >
              {needsElectricianFilter ? 'Showing: ' : 'Filter: '}Needs Electrician
              {needsElectricianFilter && ` (${stats.needsElectrician})`}
            </Button>
            {needsElectricianFilter && (
              <Button variant="ghost" size="sm" onClick={() => setNeedsElectricianFilter(false)}>
                Clear Filter
              </Button>
            )}
          </div>

          <Card>
            <CardContent className="p-0">
              <LightingFixtureTable
                fixtures={filteredIssues}
                isLoading={isLoading}
                onRefresh={handleRefresh}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="coverage" className="mt-4">
          <LightingCoverageView />
        </TabsContent>

        <TabsContent value="rooms" className="mt-4">
          <LightingRoomsTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}
