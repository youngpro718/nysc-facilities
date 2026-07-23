import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, Lightbulb, Map, ListTodo, PlayCircle, ClipboardCheck } from 'lucide-react';
import { LightingStatsBar } from '../lighting/LightingStatsBar';
import { LightingFixtureTable } from '../lighting/LightingFixtureTable';
import { WalkthroughFlow } from '../lighting/WalkthroughFlow';
import { useLightingQueue } from '@/features/lighting/hooks/useLightingData';
import { LightingIssuesQueue } from '@features/lighting/components/LightingIssuesQueue';
import { LightingCoverageView } from '@features/lighting/components/LightingCoverageView';
import { LightingRoomsTable } from '@features/lighting/components/LightingRoomsTable';
import { listRoomsWithLightingProfiles } from '@features/lighting/services/roomLightingProfileService';

interface LightingTabProps {
  buildingId?: string;
  onRefresh: () => void;
}

export function LightingTab({ buildingId, onRefresh }: LightingTabProps) {
  const queryClient = useQueryClient();
  const [needsElectricianFilter, setNeedsElectricianFilter] = useState(false);
  const [subTab, setSubTab] = useState<'issues' | 'coverage' | 'rooms'>('issues');
  const [walkthroughOpen, setWalkthroughOpen] = useState(false);

  const { data: lightingIssues = [], isLoading, refetch } = useLightingQueue(buildingId);

  // How much of the building actually has fixtures logged at all — the real
  // explanation for a tab that otherwise looks "all clear" for the wrong
  // reason (nothing tracked yet, not nothing wrong).
  const { data: profiledRooms = [], isLoading: isCoverageLoading } = useQuery({
    queryKey: ['rooms-with-lighting-profiles'],
    queryFn: listRoomsWithLightingProfiles,
  });
  const totalRooms = profiledRooms.length;
  const roomsTracked = profiledRooms.filter(r => r.fixture_count > 0).length;
  const coveragePercent = totalRooms > 0 ? Math.round((roomsTracked / totalRooms) * 100) : 0;

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
    await Promise.all([
      refetch(),
      queryClient.invalidateQueries({ queryKey: ['rooms-with-lighting-profiles'] }),
    ]);
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
          <Button onClick={() => setWalkthroughOpen(true)} size="sm">
            <PlayCircle className="h-4 w-4 mr-2" />
            Start Walkthrough
          </Button>
          <Button onClick={handleRefresh} variant="outline" size="sm" disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {/* Fixtures are added per-room from the room editor (which carries the
              required space/floor/building context), or in bulk via a walkthrough. */}
        </div>
      </div>

      {/* Coverage banner — explains a quiet-looking tab honestly: is nothing
          wrong, or is nothing tracked yet? Only shown once we know there's a
          real gap, so it never nags once coverage is actually complete. */}
      {!isCoverageLoading && totalRooms > 0 && coveragePercent < 100 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="flex items-center gap-3">
              <ClipboardCheck className="h-5 w-5 shrink-0 text-amber-500" />
              <div>
                <p className="text-sm font-medium">
                  {roomsTracked} of {totalRooms} rooms have lighting tracked ({coveragePercent}%)
                </p>
                <p className="text-xs text-muted-foreground">
                  The rest have no fixtures logged, so there's nothing to flag even if a light is out.
                  Run a walkthrough to start logging real fixture status.
                </p>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={() => setWalkthroughOpen(true)} className="shrink-0">
              <PlayCircle className="h-4 w-4 mr-2" />
              Start Walkthrough
            </Button>
          </CardContent>
        </Card>
      )}

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
                hasTrackedFixtures={roomsTracked > 0}
                onStartWalkthrough={() => setWalkthroughOpen(true)}
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

      <WalkthroughFlow open={walkthroughOpen} onOpenChange={setWalkthroughOpen} />
    </div>
  );
}
