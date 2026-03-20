import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RefreshCw, Plus, Lightbulb } from 'lucide-react';
import { LightingStatsBar } from '../lighting/LightingStatsBar';
import { LightingFixtureTable } from '../lighting/LightingFixtureTable';
import { useLightingQueue } from '@/features/lighting/hooks/useLightingData';

interface LightingTabProps {
  buildingId?: string;
  onRefresh: () => void;
}

export function LightingTab({ buildingId, onRefresh }: LightingTabProps) {
  const [needsElectricianFilter, setNeedsElectricianFilter] = useState(false);
  
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
          <Button size="sm" disabled>
            <Plus className="h-4 w-4 mr-2" />
            Add Fixture
          </Button>
        </div>
      </div>

      {/* Stats Bar */}
      <LightingStatsBar stats={stats} isLoading={isLoading} />

      {/* Filter Toggle */}
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
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setNeedsElectricianFilter(false)}
          >
            Clear Filter
          </Button>
        )}
      </div>

      {/* Fixture Table */}
      <Card>
        <CardContent className="p-0">
          <LightingFixtureTable
            fixtures={filteredIssues}
            isLoading={isLoading}
            onRefresh={handleRefresh}
          />
        </CardContent>
      </Card>
    </div>
  );
}
