import React, { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Lightbulb,
  AlertTriangle,
  CheckCircle,
  Clock,
  Settings,
  Filter,
  Download,
  Wrench,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { fetchLightingFixtures, markLightsFixed, markLightsOut, supabaseWithRetry, toggleElectricianRequired } from '@/lib/supabase';
import type { LightStatus, LightingFixture } from '@/types/lighting';
import { getFixtureFullLocationText } from '@/components/lighting/utils/location';

export function StatusCentricView() {
  const [selectedFixtures, setSelectedFixtures] = useState<Set<string>>(new Set());
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterHallway, setFilterHallway] = useState<string>('all');
  const queryClient = useQueryClient();

  const { data: fixtures = [], isLoading, isFetching } = useQuery({
    queryKey: ['lighting-fixtures'],
    queryFn: () => supabaseWithRetry.query(fetchLightingFixtures),
  });

  const allFixtures = fixtures as LightingFixture[];

  const fixturesByStatus = allFixtures.reduce(
    (acc, fixture) => {
      const status = fixture.status as LightStatus;
      if (!acc[status]) {
        acc[status] = [];
      }
      acc[status].push(fixture);
      return acc;
    },
    {
      functional: [] as LightingFixture[],
      non_functional: [] as LightingFixture[],
      maintenance_needed: [] as LightingFixture[],
      scheduled_replacement: [] as LightingFixture[],
      pending_maintenance: [] as LightingFixture[],
    }
  );

  const statusConfig = {
    functional: {
      label: 'Functional',
      icon: CheckCircle,
      color: 'bg-green-100 text-green-800',
      count: fixturesByStatus.functional.length,
    },
    non_functional: {
      label: 'Non-Functional',
      icon: AlertTriangle,
      color: 'bg-red-100 text-red-800',
      count: fixturesByStatus.non_functional.length,
    },
    maintenance_needed: {
      label: 'Maintenance Needed',
      icon: Clock,
      color: 'bg-yellow-100 text-yellow-800',
      count:
        fixturesByStatus.maintenance_needed.length +
        fixturesByStatus.pending_maintenance.length,
    },
    scheduled_replacement: {
      label: 'Scheduled Replacement',
      icon: Settings,
      color: 'bg-blue-100 text-blue-800',
      count: fixturesByStatus.scheduled_replacement.length,
    },
  } as const;

  const hallwayOptions = useMemo(
    () => {
      const optionsMap = new Map<string, string>();
      for (const fixture of allFixtures) {
        const key = fixture.space_name || fixture.room_number || fixture.id;
        if (!key) continue;
        const label = fixture.space_name || fixture.room_number || key;
        if (!optionsMap.has(key)) {
          optionsMap.set(key, label);
        }
      }
      const dynamicOptions = Array.from(optionsMap.entries()).map(([value, label]) => ({
        value,
        label,
      }));
      return [{ value: 'all', label: 'All Locations' }, ...dynamicOptions];
    },
    [allFixtures]
  );

  const getStatusFixtures = (status: keyof typeof statusConfig): LightingFixture[] => {
    if (status === 'maintenance_needed') {
      return [
        ...fixturesByStatus.maintenance_needed,
        ...fixturesByStatus.pending_maintenance,
      ];
    }
    return fixturesByStatus[status as keyof typeof fixturesByStatus] || [];
  };

  const toggleFixture = (fixtureId: string) => {
    const newSelected = new Set(selectedFixtures);
    if (newSelected.has(fixtureId)) {
      newSelected.delete(fixtureId);
    } else {
      newSelected.add(fixtureId);
    }
    setSelectedFixtures(newSelected);
  };

  const getFilteredFixtures = (fixtures: LightingFixture[]) => {
    if (filterHallway === 'all') return fixtures;
    return fixtures.filter((fixture) => {
      const key = fixture.space_name || fixture.room_number || fixture.id;
      return key === filterHallway;
    });
  };

  const handleMarkOut = async (requiresElectrician: boolean) => {
    const ids = Array.from(selectedFixtures);
    if (!ids.length) return;
    try {
      await markLightsOut(ids, requiresElectrician);
      toast.success(
        `Marked ${ids.length} light${ids.length > 1 ? 's' : ''} as out${
          requiresElectrician ? ' (electrician)' : ''
        }`
      );
      setSelectedFixtures(new Set());
      queryClient.invalidateQueries({ queryKey: ['lighting-fixtures'] });
    } catch (error) {
      toast.error(error?.message || 'Failed to update lights');
    }
  };

  const handleMarkFixed = async () => {
    const ids = Array.from(selectedFixtures);
    if (!ids.length) return;
    try {
      await markLightsFixed(ids);
      toast.success(
        `Marked ${ids.length} light${ids.length > 1 ? 's' : ''} as fixed`
      );
      setSelectedFixtures(new Set());
      queryClient.invalidateQueries({ queryKey: ['lighting-fixtures'] });
    } catch (error) {
      toast.error(error?.message || 'Failed to update lights');
    }
  };

  const handleToggleElectrician = async (required: boolean) => {
    const ids = Array.from(selectedFixtures);
    if (!ids.length) return;
    try {
      await toggleElectricianRequired(ids, required);
      toast.success(
        `Updated electrician requirement for ${ids.length} light${
          ids.length > 1 ? 's' : ''
        }`
      );
      setSelectedFixtures(new Set());
      queryClient.invalidateQueries({ queryKey: ['lighting-fixtures'] });
    } catch (error) {
      toast.error(error?.message || 'Failed to update electrician requirement');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const renderFixtureCard = (fixture: LightingFixture) => (
    <div key={fixture.id} className="border rounded-lg p-4 hover:bg-muted/50">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <Checkbox
            checked={selectedFixtures.has(fixture.id)}
            onCheckedChange={() => toggleFixture(fixture.id)}
          />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium">{fixture.name}</h4>
              {fixture.sequence_number != null && (
                <Badge variant="outline" className="text-xs">
                  Pos {fixture.sequence_number}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-2">
              {getFixtureFullLocationText(fixture)}
            </p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>{fixture.bulb_count} bulbs</span>
              <span>{fixture.technology || 'Unknown'}</span>
              {fixture.last_maintenance_date && (
                <span>Last: {fixture.last_maintenance_date}</span>
              )}
              {fixture.reported_out_date && (
                <span className="text-red-600">
                  Out since {new Date(fixture.reported_out_date).toLocaleDateString()}
                </span>
              )}
              {fixture.next_maintenance_date && (
                <span className="text-blue-600">
                  Next: {new Date(fixture.next_maintenance_date).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>
        <Button size="sm" variant="outline">
          <Settings className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Status-Based Lighting Management</h2>
          <p className="text-muted-foreground">
            Fixtures organized by functional status across all hallways
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedFixtures.size > 0 && (
            <div className="flex items-center gap-2 mr-4">
              <span className="text-sm text-muted-foreground">
                {selectedFixtures.size} selected
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleMarkOut(false)}
              >
                <Wrench className="h-4 w-4 mr-1" />
                Mark Out
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleMarkOut(true)}
              >
                <Wrench className="h-4 w-4 mr-1" />
                Out - Needs Electrician
              </Button>
              <Button size="sm" variant="outline" onClick={handleMarkFixed}>
                <CheckCircle className="h-4 w-4 mr-1" />
                Mark Fixed
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleToggleElectrician(true)}
              >
                <AlertTriangle className="h-4 w-4 mr-1" />
                Flag Electrician
              </Button>
            </div>
          )}
          <Button size="sm" variant="outline">
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span className="text-sm font-medium">Filters:</span>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {Object.entries(statusConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterHallway} onValueChange={setFilterHallway}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {hallwayOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Object.entries(statusConfig).map(([key, config]) => (
          <Card key={key} className="cursor-pointer hover:bg-muted/50" onClick={() => setFilterStatus(key)}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <config.icon className="h-8 w-8 text-muted-foreground" />
                <div>
                  <div className="text-2xl font-bold">{config.count}</div>
                  <div className="text-sm text-muted-foreground">{config.label}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Status-Grouped Fixtures */}
      {Object.entries(statusConfig)
        .filter(([key]) => filterStatus === 'all' || filterStatus === key)
        .map(([status, config]) => {
          const fixturesForStatus = getFilteredFixtures(
            getStatusFixtures(status as keyof typeof statusConfig)
          );

          if (fixturesForStatus.length === 0) return null;

          return (
            <Card key={status}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <config.icon className="h-5 w-5" />
                  {config.label}
                  <Badge className={config.color}>
                    {fixturesForStatus.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {fixturesForStatus.map((fixture) => renderFixtureCard(fixture))}
              </CardContent>
            </Card>
          );
        })}
    </div>
  );
}