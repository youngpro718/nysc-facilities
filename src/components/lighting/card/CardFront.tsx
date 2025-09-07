
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { LightingFixture } from "@/types/lighting";
import { EditLightingDialog } from "../EditLightingDialog";
import { ReportIssueDialog } from "../issues/ReportIssueDialog";
import { cn } from "@/lib/utils";
import { Lightbulb, RotateCw, Trash2, Calendar, Clock, MoreHorizontal, Edit, AlertTriangle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import * as locationUtil from "@/components/lighting/utils/location";
import { StatusBadge } from "@/components/lighting/components/StatusBadge";
import { markLightsOut, markLightsFixed, toggleElectricianRequired, fetchSiblingFixturesForFixture } from "@/lib/supabase";



interface CardFrontProps {
  fixture: LightingFixture;
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
  onDelete: () => void;
  onFixtureUpdated: () => void;
  onFlip: () => void;
}

type DialogType = 'edit' | 'report' | null;

export function CardFront({ 
  fixture, 
  isSelected, 
  onSelect, 
  onDelete, 
  onFixtureUpdated,
  onFlip
}: CardFrontProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [openDialog, setOpenDialog] = useState<DialogType>(null);
  const navigate = useNavigate();

  // Mock issues query since the service was removed
  const { data: fixtureIssues } = useQuery({
    queryKey: ["lighting-fixture-issues", fixture.id],
    queryFn: async () => {
      // Return empty array since we're not using this functionality
      return [];
    }
  });

  // Fetch sibling fixtures within the same room/space to represent as bars
  const { data: roomFixtures = [] } = useQuery({
    queryKey: ["lighting-room-fixtures", fixture.id],
    enabled: !!fixture.id,
    queryFn: async () => fetchSiblingFixturesForFixture(fixture.id)
  });

  const openIssue = (fixtureIssues || []).find((i: any) => i.status !== "resolved" && (i.issue_id || i.id));

  // Helper to find the latest resolved issue
  const latestResolvedIssue = (fixtureIssues || [])
    .filter((i: any) => i.status === 'resolved' && i.resolved_at)
    .sort((a: any, b: any) => new Date(b.resolved_at).getTime() - new Date(a.resolved_at).getTime())[0];

  // Format compact duration like 2d 3h or 5h 12m
  const formatDuration = (startISO: string, endISO?: string) => {
    const start = new Date(startISO).getTime();
    const end = endISO ? new Date(endISO).getTime() : Date.now();
    if (Number.isNaN(start) || Number.isNaN(end) || end < start) return '—';
    const ms = end - start;
    const minutes = Math.floor(ms / 60000);
    const days = Math.floor(minutes / (60 * 24));
    const hours = Math.floor((minutes - days * 24 * 60) / 60);
    const mins = minutes % 60;
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  const formatIssueType = (issueType?: string) => {
    if (!issueType) return 'Unknown';
    if (issueType === 'blown_bulb' || issueType === 'bulb') return 'Bulb';
    if (issueType === 'ballast_issue' || issueType === 'balance' || issueType === 'ballast') return 'Ballast (Electrician)';
    return issueType.replace(/_/g, ' ');
  };

  // Quick actions
  const [isActing, setIsActing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  // Inline UI for choosing outage type when clicking a bar
  const [barChoiceIndex, setBarChoiceIndex] = useState<number | null>(null);
  const [selectedFixtureId, setSelectedFixtureId] = useState<string | null>(null);
  // Local overrides so the UI reflects changes immediately
  const [localStatuses, setLocalStatuses] = useState<Record<string, { status: 'functional' | 'non_functional'; requires_electrician?: boolean }>>({});
  const [showOutChoice, setShowOutChoice] = useState(false);
  const handleMarkOut = async (requiresElectrician: boolean) => {
    try {
      setIsActing(true);
      // Optimistic UI for the card's own fixture and ensure pill is visible
      setSelectedFixtureId(fixture.id);
      setLocalStatuses(prev => ({
        ...prev,
        [fixture.id]: { status: 'non_functional', requires_electrician: requiresElectrician }
      }));
      await markLightsOut([fixture.id], requiresElectrician);
      onFixtureUpdated();
    } finally {
      setIsActing(false);
    }
  };

  // When clicking a visual bar, decide how to classify outage
  const handleBarClick = async (index: number) => {
    setBarChoiceIndex(index);
    const target = roomFixtures[index] || fixture;
    setSelectedFixtureId(target.id);
    const tech = (target.technology || '').toString().toLowerCase();
    if (tech === 'led') {
      // Optimistic UI update
      setLocalStatuses(prev => ({ ...prev, [target.id]: { status: 'non_functional', requires_electrician: true } }));
      await markLightsOut([target.id], true);
      onFixtureUpdated();
      setShowOutChoice(false);
      return;
    }
    setShowOutChoice(true);
  };
  const handleMarkFixed = async () => {
    try {
      setIsActing(true);
      const ids = selectedFixtureId ? [selectedFixtureId] : [fixture.id];
      // Optimistic UI update
      setLocalStatuses(prev => ({ ...prev, [ids[0]]: { status: 'functional', requires_electrician: false } }));
      await markLightsFixed(ids);
      onFixtureUpdated();
    } finally {
      setIsActing(false);
    }
  };
  const handleToggleElectrician = async () => {
    try {
      setIsActing(true);
      await toggleElectricianRequired([fixture.id], !fixture.requires_electrician);
      onFixtureUpdated();
    } finally {
      setIsActing(false);
    }
  };

  // Status colors centralized in StatusBadge

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'emergency':
        return <Badge variant="destructive" className="text-xs">Emergency</Badge>;
      case 'motion_sensor':
        return <Badge variant="outline" className="text-xs bg-blue-50 text-blue-800">Motion Sensor</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">Standard</Badge>;
    }
  };

  const formatMaintenanceDate = (date: string | null | undefined) => {
    if (!date) return "No date scheduled";
    const maintenanceDate = new Date(date);
    return maintenanceDate.toLocaleDateString();
  };

  const isMaintenanceSoon = () => {
    if (!fixture.next_maintenance_date) return false;
    const nextMaintenance = new Date(fixture.next_maintenance_date);
    const today = new Date();
    const daysUntilMaintenance = Math.floor((nextMaintenance.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilMaintenance <= 7 && daysUntilMaintenance >= 0;
  };

  // Use shared location formatter for consistency across the module
  const getLocationText = () => locationUtil.getFixtureFullLocationText(fixture);

  // Map position to human-friendly mounting label
  const getMountLabel = () => {
    const map: Record<string, string> = {
      ceiling: 'Ceiling-mounted',
      wall: 'Wall-mounted',
      floor: 'Floor-mounted',
      desk: 'Desk-mounted',
    };
    return map[String(fixture.position)] ?? 'Ceiling-mounted';
  };

  // Prefer room/space label for title with robust fallbacks
  const getTitle = () => {
    // Use shared short formatter to ensure we include room name and number when present
    const short = locationUtil.getFixtureLocationText(fixture);
    if (short && !/^unknown room$/i.test(short)) return short;
    if (fixture.building_name && fixture.floor_name) return `${fixture.building_name} • ${fixture.floor_name}`;
    if (fixture.building_name) return fixture.building_name!;
    return fixture.name;
  };

  return (
    <Card className={cn(
      "w-full h-[280px] flex flex-col rounded-2xl border border-border/40 bg-card/80 backdrop-blur-sm shadow-sm transition-all duration-300 hover:shadow-md",
      isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background"
    )}>
      <CardHeader className="pt-4 pb-1 px-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Checkbox
              checked={isSelected}
              onCheckedChange={onSelect}
              className="rounded-sm data-[state=checked]:bg-primary"
            />
            <h3 className="font-semibold text-[17px] tracking-[-0.01em] truncate">{getTitle()}</h3>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-md hover:bg-muted/60"
              onClick={onFlip}
              title="Flip"
            >
              <RotateCw className="h-4 w-4" />
            </Button>
            <StatusBadge status={fixture.status} />
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-3 space-y-3 flex flex-col h-full">
        {/* Meta */}
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <span className="inline-flex items-center gap-1">
            <Lightbulb className="h-4 w-4 opacity-80" />
            {Math.max(1, Math.min(4, Number(fixture.bulb_count || 2)))}× {fixture.technology || 'Fluorescent Tube'}
          </span>
          <span className="text-muted-foreground/60">•</span>
          <span className="truncate">{getMountLabel()}</span>
        </div>

        {/* Middle row: bulb visual + status pill */}
        <div className="flex items-stretch gap-3">
          <div className="flex-1 rounded-xl border border-border/50 bg-muted/10 p-3">
            <div className="flex items-center gap-3">
              {/* simple two-bar representation */}
              <div className={`flex-1 grid gap-3`} style={{ gridTemplateColumns: `repeat(${Math.max(1, Math.min(4, roomFixtures.length || 1))}, minmax(0, 1fr))` }}>
                {(roomFixtures.length ? roomFixtures : [fixture]).slice(0, 4).map((fx, idx) => {
                  const override = localStatuses[fx.id];
                  const statusNow = override?.status ?? fx.status;
                  const reqElecNow = override?.requires_electrician ?? fx.requires_electrician;
                  const isOut = statusNow === 'non_functional';
                  const isSelected = barChoiceIndex === idx;
                  return (
                    <button
                      key={fx.id}
                      type="button"
                      onClick={() => handleBarClick(idx)}
                      disabled={isActing}
                      title={`Select fixture #${idx + 1}`}
                      className={`h-4 rounded-md relative overflow-hidden cursor-pointer focus:outline-none focus:ring-2 border border-border/60 ${isOut ? 'bg-muted/20 opacity-70' : 'bg-foreground/5'} focus:ring-ring ${isSelected ? 'ring-2 ring-primary' : ''}`}
                    >
                      {/* simple fill to mimic design - neutral only */}
                      {!isOut && (
                        <div className="absolute inset-0 flex items-center">
                          <div className="h-4 w-[85%] rounded-md bg-foreground/60" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="shrink-0 self-center">
            {(() => {
              // Show pill based on selected fixture if any; else fall back to card fixture
              const baseId = selectedFixtureId || fixture.id;
              const fallbackFx = selectedFixtureId ? roomFixtures.find(rf => rf.id === selectedFixtureId) : fixture;
              const override = localStatuses[baseId];
              const statusNow = override?.status ?? fallbackFx?.status;
              const reqElecNow = override?.requires_electrician ?? (fallbackFx as any)?.requires_electrician;
              if (statusNow !== 'non_functional') return null;
              return (
                <div className={`px-3 py-2 rounded-md text-sm font-medium shadow-sm ${reqElecNow ? 'bg-destructive text-destructive-foreground' : 'bg-amber-500/90 text-black'}`}>
                  {reqElecNow ? 'Ballast issue' : 'Bulb out'}
                </div>
              );
            })()}
          </div>
        </div>

        {showOutChoice && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Mark selected fixture as:</span>
            <Button size="sm" variant="secondary" disabled={isActing} onClick={async () => { if(selectedFixtureId) { setLocalStatuses(prev => ({ ...prev, [selectedFixtureId]: { status: 'non_functional', requires_electrician: false } })); await markLightsOut([selectedFixtureId], false); onFixtureUpdated(); } setShowOutChoice(false); }}>
              Bulb issue
            </Button>
            <Button size="sm" variant="destructive" disabled={isActing} onClick={async () => { if(selectedFixtureId) { setLocalStatuses(prev => ({ ...prev, [selectedFixtureId]: { status: 'non_functional', requires_electrician: true } })); await markLightsOut([selectedFixtureId], true); onFixtureUpdated(); } setShowOutChoice(false); }}>
              Ballast issue (Electrician)
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowOutChoice(false)}>Cancel</Button>
          </div>
        )}

        {/* Outage/repair chips */}
        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
          {openIssue ? (
            <>
              <span className="inline-flex items-center gap-1 rounded-full ring-1 ring-border bg-muted/50 px-2 py-0.5">
                <Clock className="h-3 w-3" />
                Out for {formatDuration(openIssue.reported_at)}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-secondary text-secondary-foreground ring-1 ring-border/50 px-2 py-0.5">
                Issue: {formatIssueType(openIssue.issue_type)}
              </span>
            </>
          ) : latestResolvedIssue ? (
            <>
              <span className="inline-flex items-center gap-1 rounded-full ring-1 ring-border bg-muted/50 px-2 py-0.5">
                <Clock className="h-3 w-3" />
                Repaired in {formatDuration(latestResolvedIssue.reported_at, latestResolvedIssue.resolved_at)}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-secondary text-secondary-foreground ring-1 ring-border/50 px-2 py-0.5">
                Issue: {formatIssueType(latestResolvedIssue.issue_type)}
              </span>
            </>
          ) : (
            // Fallback to fixture-level timestamps if no issue records
            <>
              {fixture.reported_out_date && !fixture.replaced_date && (
                <>
                  <span className="inline-flex items-center gap-1 rounded-full ring-1 ring-border bg-muted/50 px-2 py-0.5">
                    <Clock className="h-3 w-3" />
                    Out for {formatDuration(fixture.reported_out_date)}
                  </span>
                  {fixture.requires_electrician ? (
                    <span
                      role="button"
                      title="Toggle electrician required"
                      onClick={() => handleToggleElectrician()}
                      className="inline-flex items-center gap-1 rounded-full bg-secondary text-secondary-foreground ring-1 ring-border/50 px-2 py-0.5 cursor-pointer hover:opacity-90"
                    >
                      Issue: Ballast (Electrician)
                    </span>
                  ) : (
                    <span
                      role="button"
                      title="Mark as out - bulb"
                      onClick={() => handleMarkOut(false)}
                      className="inline-flex items-center gap-1 rounded-full bg-secondary text-secondary-foreground ring-1 ring-border/50 px-2 py-0.5 cursor-pointer hover:opacity-90"
                    >
                      Issue: Bulb
                    </span>
                  )}
                </>
              )}
              {fixture.reported_out_date && fixture.replaced_date && (
                <>
                  <span className="inline-flex items-center gap-1 rounded-full ring-1 ring-border bg-muted/50 px-2 py-0.5">
                    <Clock className="h-3 w-3" />
                    Repaired in {formatDuration(fixture.reported_out_date, fixture.replaced_date)}
                  </span>
                  {fixture.requires_electrician ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-secondary text-secondary-foreground ring-1 ring-border/50 px-2 py-0.5">
                      Issue: Ballast (Electrician)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-secondary text-secondary-foreground ring-1 ring-border/50 px-2 py-0.5">
                      Issue: Bulb
                    </span>
                  )}
                </>
              )}
            </>
          )}
        </div>

        {/* Footer actions */}
        <div className="mt-auto pt-2">
          {showDeleteConfirm ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-red-600">Confirm?</span>
              <Button variant="destructive" size="sm" onClick={onDelete}>Yes</Button>
              <Button variant="outline" size="sm" onClick={() => setShowDeleteConfirm(false)}>No</Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {fixture.status === 'non_functional' && (
                <Button className="w-full" size="sm" variant="default" disabled={isActing} onClick={handleMarkFixed}>
                  Mark Repaired
                </Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-md hover:bg-muted/60">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-background/95 backdrop-blur-sm border border-border shadow-lg">
                  {fixture.status === 'non_functional' && (
                    <DropdownMenuItem onClick={() => handleToggleElectrician()} disabled={isActing}>
                      {fixture.requires_electrician ? 'Unset Electrician' : 'Needs Electrician'}
                    </DropdownMenuItem>
                  )}
                  {openIssue ? (
                    <DropdownMenuItem onClick={() => {
                      const issueId = (openIssue as any).issue_id ?? (openIssue as any).id;
                      navigate(`/operations?tab=issues&issue_id=${issueId}`);
                    }}>
                      Issues
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onClick={() => setOpenDialog('report')}>
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Report Issue
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setOpenDialog('edit')}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowDeleteConfirm(true)}>
                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </CardContent>

      {/* Dialogs rendered outside dropdown to prevent conflicts */}
      <ReportIssueDialog 
        fixture={fixture} 
        open={openDialog === 'report'} 
        onOpenChange={(open) => setOpenDialog(open ? 'report' : null)} 
      />
      <EditLightingDialog 
        fixture={fixture} 
        onFixtureUpdated={onFixtureUpdated}
        open={openDialog === 'edit'} 
        onOpenChange={(open) => setOpenDialog(open ? 'edit' : null)} 
      />
    </Card>
  );
}
