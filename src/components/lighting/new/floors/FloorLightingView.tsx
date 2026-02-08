import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Building2, 
  ChevronDown, 
  Lightbulb, 
  AlertCircle, 
  CheckCircle, 
  Loader2,
  ArrowRight,
  Zap,
  Plus
} from 'lucide-react';
import { toast } from 'sonner';
import type { LightStatus } from '@/types/lighting';
import { WalkthroughMode } from '../hallways/WalkthroughMode';
import { useHallwayFixtures } from '@/hooks/useLightingHallways';

interface FloorWithHallways {
  floorId: string;
  floorName: string;
  floorNumber: number;
  buildingName: string;
  hallways: HallwayWithFixtures[];
}

interface HallwayWithFixtures {
  id: string;
  name: string;
  fixtures: FixtureSlot[];
}

interface FixtureSlot {
  id: string;
  name: string;
  sequence_number: number | null;
  status: string;
  ballast_issue: boolean;
  technology: string | null;
  bulb_count: number;
}

// Status colors for the visual dots — 3 states only
const STATUS_COLORS: Record<string, string> = {
  functional: 'bg-green-500 hover:bg-green-400 ring-green-300',
  non_functional: 'bg-red-500 hover:bg-red-400 ring-red-300 animate-pulse',
  maintenance_needed: 'bg-amber-500 hover:bg-amber-400 ring-amber-300',
  scheduled_replacement: 'bg-amber-500 hover:bg-amber-400 ring-amber-300',
  pending_maintenance: 'bg-amber-500 hover:bg-amber-400 ring-amber-300',
};

const STATUS_LABELS: Record<string, string> = {
  functional: 'Working',
  non_functional: 'Out',
  maintenance_needed: 'Ballast',
  scheduled_replacement: 'Ballast',
  pending_maintenance: 'Ballast',
};

export function FloorLightingView() {
  const [expandedFloor, setExpandedFloor] = useState<string | null>(null);
  const [walkthroughHallway, setWalkthroughHallway] = useState<string | null>(null);
  const [addSectionFloor, setAddSectionFloor] = useState<{ floorId: string; floorName: string } | null>(null);
  const queryClient = useQueryClient();

  // Fetch hallway fixtures for walkthrough mode
  const { data: walkthroughFixtures } = useHallwayFixtures(walkthroughHallway);

  // Fetch all floors with their hallways and fixtures
  const { data: floors = [], isLoading } = useQuery({
    queryKey: ['floor-lighting-view'],
    queryFn: async () => {
      // Get all hallways with their floor info
      const { data: hallways, error: hError } = await supabase
        .from('hallways')
        .select(`
          id,
          name,
          floor_id,
          floors(id, name, floor_number, buildings(name))
        `)
        .order('name');

      if (hError) throw hError;

      // Get all hallway fixtures
      const { data: fixtures, error: fError } = await supabase
        .from('lighting_fixtures')
        .select('id, name, sequence_number, status, ballast_issue, technology, bulb_count, space_id')
        .eq('space_type', 'hallway')
        .order('sequence_number', { ascending: true });

      if (fError) throw fError;

      // Group fixtures by hallway
      const fixturesByHallway = new Map<string, FixtureSlot[]>();
      for (const f of (fixtures || [])) {
        const list = fixturesByHallway.get(f.space_id) || [];
        list.push({
          id: f.id,
          name: f.name,
          sequence_number: f.sequence_number,
          status: f.status,
          ballast_issue: f.ballast_issue || false,
          technology: f.technology,
          bulb_count: f.bulb_count || 1,
        });
        fixturesByHallway.set(f.space_id, list);
      }

      // Build floor structure
      const floorMap = new Map<string, FloorWithHallways>();

      for (const h of (hallways || [])) {
        const hallwayFixtures = fixturesByHallway.get(h.id);
        if (!hallwayFixtures || hallwayFixtures.length === 0) continue;

        const floor = h.floors as unknown as { id: string; name: string; floor_number: number; buildings: { name: string } | null } | null;
        const floorId = floor?.id as string;

        if (!floorMap.has(floorId)) {
          floorMap.set(floorId, {
            floorId,
            floorName: floor?.name || 'Unknown',
            floorNumber: floor?.floor_number || 0,
            buildingName: floor?.buildings?.name || 'Unknown',
            hallways: [],
          });
        }

        floorMap.get(floorId)!.hallways.push({
          id: h.id,
          name: h.name,
          fixtures: hallwayFixtures,
        });
      }

      // Sort by floor number descending
      return Array.from(floorMap.values()).sort((a, b) => b.floorNumber - a.floorNumber);
    },
    staleTime: 30_000,
  });

  // Cycle: Working → Out → Ballast → Working
  const getNextStatus = (current: string): LightStatus => {
    if (current === 'functional') return 'non_functional';
    if (current === 'non_functional') return 'maintenance_needed';
    return 'functional';
  };

  // Quick toggle mutation with optimistic update
  const toggleMutation = useMutation({
    mutationFn: async ({ fixtureId, currentStatus }: { fixtureId: string; currentStatus: string }) => {
      const newStatus = getNextStatus(currentStatus);

      const { error, status, statusText } = await supabase
        .from('lighting_fixtures')
        .update({
          status: newStatus,
          ballast_issue: newStatus === 'maintenance_needed',
        })
        .eq('id', fixtureId);

      if (error) {
        console.error('Fixture update failed:', { message: error.message, details: error.details, hint: error.hint, code: error.code, status, statusText });
        throw new Error(error.message || 'Update failed');
      }

      return { fixtureId, newStatus };
    },
    onMutate: async ({ fixtureId, currentStatus }) => {
      // Cancel outgoing refetches so they don't overwrite optimistic update
      await queryClient.cancelQueries({ queryKey: ['floor-lighting-view'] });

      // Snapshot previous value
      const previous = queryClient.getQueryData<FloorWithHallways[]>(['floor-lighting-view']);

      // Optimistically update the fixture status in cache
      const newStatus = getNextStatus(currentStatus);
      queryClient.setQueryData<FloorWithHallways[]>(['floor-lighting-view'], (old) => {
        if (!old) return old;
        return old.map((floor) => ({
          ...floor,
          hallways: floor.hallways.map((hw) => ({
            ...hw,
            fixtures: hw.fixtures.map((f) =>
              f.id === fixtureId ? { ...f, status: newStatus } : f
            ),
          })),
        }));
      });

      return { previous };
    },
    onSuccess: ({ newStatus }) => {
      // Also invalidate other caches that depend on fixture data
      queryClient.invalidateQueries({ queryKey: ['lighting-fixtures'] });
      queryClient.invalidateQueries({ queryKey: ['lighting-hallways'] });
      const label = STATUS_LABELS[newStatus] || newStatus;
      toast.success(`Light marked as ${label}`);
    },
    onError: (_err, _vars, context) => {
      // Roll back on error
      if (context?.previous) {
        queryClient.setQueryData(['floor-lighting-view'], context.previous);
      }
      toast.error('Failed to update fixture');
    },
  });

  // If walkthrough is active
  if (walkthroughHallway && walkthroughFixtures) {
    return (
      <WalkthroughMode
        hallwayId={walkthroughHallway}
        fixtures={walkthroughFixtures}
        onComplete={() => {
          setWalkthroughHallway(null);
          queryClient.invalidateQueries({ queryKey: ['floor-lighting-view'] });
        }}
        onCancel={() => setWalkthroughHallway(null)}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (floors.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50" />
          <p className="mt-4 text-muted-foreground">No hallway lighting fixtures found</p>
          <p className="text-sm text-muted-foreground mt-1">Add fixtures to hallways to see them here</p>
        </CardContent>
      </Card>
    );
  }

  // Auto-expand first floor if none expanded
  const effectiveExpanded = expandedFloor || floors[0]?.floorId;

  return (
    <>
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground px-1">
        <span className="font-medium">Tap to cycle:</span>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span>Working</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span>Out</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <span>Ballast</span>
        </div>
      </div>

      {/* Floor Accordion */}
      {floors.map((floor) => {
        const isExpanded = effectiveExpanded === floor.floorId;
        const totalFixtures = floor.hallways.reduce((sum, h) => sum + h.fixtures.length, 0);
        const outFixtures = floor.hallways.reduce(
          (sum, h) => sum + h.fixtures.filter((f) => f.status !== 'functional').length, 0
        );
        const healthPct = totalFixtures > 0
          ? Math.round(((totalFixtures - outFixtures) / totalFixtures) * 100)
          : 100;

        return (
          <Card key={floor.floorId} className={isExpanded ? 'ring-1 ring-primary/20' : ''}>
            {/* Floor Header */}
            <button
              className="w-full text-left"
              onClick={() => setExpandedFloor(isExpanded ? null : floor.floorId)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <CardTitle className="text-base">{floor.floorName}</CardTitle>
                      <p className="text-xs text-muted-foreground">{floor.buildingName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Lightbulb className="h-4 w-4 text-muted-foreground" />
                      <span>{totalFixtures}</span>
                    </div>
                    {outFixtures > 0 ? (
                      <Badge variant="destructive" className="gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {outFixtures} out
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800">
                        <CheckCircle className="h-3 w-3" />
                        {healthPct}%
                      </Badge>
                    )}
                    <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </div>
              </CardHeader>
            </button>

            {/* Expanded: Hallways with fixture grids */}
            {isExpanded && (
              <CardContent className="pt-0 space-y-4">
                {floor.hallways.map((hallway) => {
                  const hwOut = hallway.fixtures.filter((f) => f.status !== 'functional').length;
                  return (
                    <div key={hallway.id} className="rounded-lg border p-4 space-y-3">
                      {/* Hallway header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-sm">{hallway.name}</h4>
                          <span className="text-xs text-muted-foreground">
                            {hallway.fixtures.length} fixtures
                          </span>
                          {hwOut > 0 && (
                            <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                              {hwOut} out
                            </Badge>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs gap-1 h-7"
                          onClick={() => setWalkthroughHallway(hallway.id)}
                        >
                          Walkthrough
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      </div>

                      {/* Fixture Grid — the visual dots */}
                      <div className="flex flex-wrap gap-2">
                        {hallway.fixtures.map((fixture) => {
                          const colorClass = STATUS_COLORS[fixture.status] || STATUS_COLORS.functional;
                          const label = fixture.sequence_number
                            ? `#${fixture.sequence_number}`
                            : fixture.name;
                          const statusLabel = STATUS_LABELS[fixture.status] || fixture.status;

                          return (
                            <button
                              key={fixture.id}
                              onClick={() =>
                                toggleMutation.mutate({
                                  fixtureId: fixture.id,
                                  currentStatus: fixture.status,
                                })
                              }
                              disabled={toggleMutation.isPending}
                              className={`
                                relative group flex items-center justify-center
                                w-10 h-10 rounded-full transition-all duration-150
                                ${colorClass}
                                ring-0 hover:ring-4 focus:ring-4 focus:outline-none
                                cursor-pointer active:scale-90
                              `}
                              title={`${label} — ${statusLabel}. Click to change.`}
                            >
                              <span className="text-[10px] font-bold text-white drop-shadow-sm">
                                {fixture.sequence_number || '•'}
                              </span>

                              {/* Ballast indicator */}
                              {fixture.ballast_issue && (
                                <Zap className="absolute -top-1 -right-1 h-3.5 w-3.5 text-yellow-300 drop-shadow" />
                              )}

                              {/* Tooltip on hover */}
                              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 
                                opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none
                                bg-popover text-popover-foreground text-[10px] px-2 py-1 rounded shadow-md whitespace-nowrap z-10 border">
                                {label} — {statusLabel}
                                {fixture.ballast_issue && ' ⚡ Ballast'}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {/* Add Section button */}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2 border-dashed"
                  onClick={(e) => {
                    e.stopPropagation();
                    setAddSectionFloor({ floorId: floor.floorId, floorName: floor.floorName });
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Add Section to {floor.floorName}
                </Button>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>

    {/* Add Section Dialog */}
    <AddSectionDialog
      floor={addSectionFloor}
      onOpenChange={(open) => { if (!open) setAddSectionFloor(null); }}
      onSuccess={() => {
        setAddSectionFloor(null);
        queryClient.invalidateQueries({ queryKey: ['floor-lighting-view'] });
      }}
    />
    </>
  );
}

/**
 * Dialog for adding a new hallway section to a floor with a specified number of fixtures.
 */
function AddSectionDialog({
  floor,
  onOpenChange,
  onSuccess,
}: {
  floor: { floorId: string; floorName: string } | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [sectionName, setSectionName] = useState('');
  const [fixtureCount, setFixtureCount] = useState('10');
  const [technology, setTechnology] = useState('LED');

  const DIRECTION_PRESETS = ['North', 'South', 'East', 'West', 'Northeast', 'Northwest', 'Southeast', 'Southwest', 'Center'];

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!floor || !sectionName.trim()) throw new Error('Name is required');
      const count = parseInt(fixtureCount) || 0;
      if (count < 1 || count > 100) throw new Error('Fixture count must be 1-100');

      // Ensure technology matches DB enum exactly
      const validTech = ['LED', 'Fluorescent', 'Bulb'];
      const safeTech = validTech.includes(technology) ? technology : 'LED';

      // 1. Create the hallway
      const { data: hallway, error: hErr } = await supabase
        .from('hallways')
        .insert({
          name: sectionName.trim(),
          floor_id: floor.floorId,
          type: 'public_main',
          status: 'active',
        })
        .select('id')
        .single();

      if (hErr) throw hErr;

      // 2. Create fixtures for this hallway
      // Name must match: "Hallway XYZ - Light N" (valid_fixture_name constraint)
      // electrical_issues must have required keys (electrical_issues_check constraint)
      const hallwayLabel = sectionName.trim();
      const fixtures = Array.from({ length: count }, (_, i) => ({
        name: `Hallway ${hallwayLabel} - Light ${i + 1}`,
        type: 'standard' as const,
        status: 'functional' as const,
        technology: safeTech,
        bulb_count: 2,
        space_id: hallway.id,
        space_type: 'hallway',
        floor_id: floor.floorId,
        sequence_number: i + 1,
        ballast_issue: false,
        electrical_issues: { short_circuit: false, wiring_issues: false, voltage_problems: false },
      }));

      const { error: fErr } = await supabase
        .from('lighting_fixtures')
        .insert(fixtures);

      if (fErr) throw fErr;
    },
    onSuccess: () => {
      toast.success(`Added "${sectionName}" with ${fixtureCount} fixtures`);
      setSectionName('');
      setFixtureCount('10');
      onSuccess();
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to create section');
    },
  });

  return (
    <Dialog open={!!floor} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Section
          </DialogTitle>
          <DialogDescription>
            Add a hallway or corridor section to {floor?.floorName}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Section Name</Label>
            <Input
              value={sectionName}
              onChange={(e) => setSectionName(e.target.value)}
              placeholder="e.g. Southwest Corridor - Floor 16"
              autoFocus
            />
            <div className="flex flex-wrap gap-1.5 pt-1">
              {DIRECTION_PRESETS.map((dir) => (
                <button
                  key={dir}
                  type="button"
                  onClick={() => {
                    const floorNum = floor?.floorName.match(/\d+/)?.[0] || '';
                    setSectionName(`${dir} Corridor - Floor ${floorNum}`);
                  }}
                  className="text-[10px] px-2 py-0.5 rounded-full border hover:bg-muted transition-colors"
                >
                  {dir}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Number of Fixtures</Label>
            <Input
              type="number"
              min="1"
              max="100"
              value={fixtureCount}
              onChange={(e) => setFixtureCount(e.target.value)}
              placeholder="10"
            />
            <p className="text-[10px] text-muted-foreground">How many lights are in this section?</p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Bulb Technology</Label>
            <div className="flex gap-2">
              {['LED', 'Fluorescent', 'Bulb'].map((tech) => (
                <button
                  key={tech}
                  type="button"
                  onClick={() => setTechnology(tech)}
                  className={`text-xs px-3 py-1.5 rounded-md border transition-colors ${
                    technology === tech
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'hover:bg-muted'
                  }`}
                >
                  {tech}
                </button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} size="sm">
            Cancel
          </Button>
          <Button
            onClick={() => createMutation.mutate()}
            disabled={!sectionName.trim() || createMutation.isPending}
            size="sm"
          >
            {createMutation.isPending ? 'Creating...' : `Add ${fixtureCount} Fixtures`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
