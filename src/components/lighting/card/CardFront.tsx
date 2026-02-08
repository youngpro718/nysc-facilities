
import { useState, useCallback } from "react";
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

  const openIssue = (fixtureIssues || []).find((i: Record<string, unknown>) => i.status !== "resolved" && (i.issue_id || i.id));

  // Helper to find the latest resolved issue
  const latestResolvedIssue = (fixtureIssues || [])
    .filter((i: Record<string, unknown>) => i.status === 'resolved' && i.resolved_at)
    .sort((a: Record<string, unknown>, b: Record<string, unknown>) => new Date(b.resolved_at).getTime() - new Date(a.resolved_at).getTime())[0];

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
  const [actionError, setActionError] = useState<string | null>(null);
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
    if (isActing) return; // avoid repeated clicks while in-flight
    setBarChoiceIndex(index);
    const target = roomFixtures[index] || fixture;
    setSelectedFixtureId(target.id);
    const tech = (target.technology || '').toString().toLowerCase();
    if (tech === 'led') {
      // Optimistic UI update with rollback on failure
      const prevStatuses = localStatuses;
      setIsActing(true);
      setActionError(null);
      try {
        setLocalStatuses(prev => ({ ...prev, [target.id]: { status: 'non_functional', requires_electrician: true } }));
        await markLightsOut([target.id], true);
        onFixtureUpdated();
        setShowOutChoice(false);
      } catch (e) {
        // Roll back optimistic changes and surface error
        setLocalStatuses(prevStatuses);
        setActionError('Failed to mark light as out. Please try again.');
        setShowOutChoice(true);
      } finally {
        setIsActing(false);
      }
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
  
  // Handle inline outage choice with rollback on failure
  const handleOutChoice = useCallback(async (requiresElectrician: boolean) => {
    if (!selectedFixtureId || isActing) return;
    const targetId = selectedFixtureId;
    const prevStatuses = localStatuses;
    setIsActing(true);
    setActionError(null);
    try {
      setLocalStatuses(prev => ({ ...prev, [targetId]: { status: 'non_functional', requires_electrician: requiresElectrician } }));
      await markLightsOut([targetId], requiresElectrician);
      onFixtureUpdated();
      setShowOutChoice(false);
    } catch (e) {
      setLocalStatuses(prevStatuses);
      setActionError('Failed to update fixture status. Please try again.');
      setShowOutChoice(true);
    } finally {
      setIsActing(false);
    }
  }, [selectedFixtureId, isActing, localStatuses, onFixtureUpdated]);

  const handleBulbIssue = useCallback(async () => {
    if (!selectedFixtureId || isActing) return;
    await handleOutChoice(false);
  }, [selectedFixtureId, isActing, handleOutChoice]);

  const handleBallastIssue = useCallback(async () => {
    if (!selectedFixtureId || isActing) return;
    await handleOutChoice(true);
  }, [selectedFixtureId, isActing, handleOutChoice]);

  const handleCancel = useCallback(() => {
    setShowOutChoice(false);
  }, []);
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
        return <Badge variant="outline" className="text-xs bg-blue-50 dark:bg-blue-950/30 text-blue-800">Motion Sensor</Badge>;
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

  // Compute safe fixtures list and columns for grid rendering
  const fixtures = (roomFixtures && roomFixtures.length ? roomFixtures : [fixture]).slice(0, 4);
  const columns = Math.max(1, Math.min(4, fixtures.length || 1));

  const statusBorderColor = 
    fixture.status === 'functional' ? 'border-emerald-500/30' :
    fixture.status === 'non_functional' ? 'border-destructive/30' :
    'border-amber-500/30';

  const statusBgGlow = 
    fixture.status === 'functional' ? 'hover:shadow-emerald-500/10' :
    fixture.status === 'non_functional' ? 'hover:shadow-destructive/10' :
    'hover:shadow-amber-500/10';

  return (
    <Card className={cn(
      "w-full h-[320px] flex flex-col rounded-2xl border-2 bg-card/95 backdrop-blur-sm shadow-sm transition-all duration-300 hover:shadow-lg",
      statusBorderColor,
      statusBgGlow,
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

        {/* Middle row: visual bulb icons + status pill */}
        <div className="flex items-stretch gap-3">
          <div className="flex-1 rounded-xl border border-border/50 bg-gradient-to-br from-muted/20 to-muted/5 p-4">
            <div className="flex items-center justify-center gap-2">
              {fixtures.map((fx, idx) => {
                const override = localStatuses[fx.id];
                const statusNow = override?.status ?? fx.status;
                const reqElecNow = override?.requires_electrician ?? fx.requires_electrician;
                const isOut = statusNow === 'non_functional';
                const isMaint = statusNow === 'maintenance_needed' || statusNow === 'pending_maintenance';
                const isBarSelected = barChoiceIndex === idx;
                
                return (
                  <button
                    key={fx.id}
                    type="button"
                    onClick={() => handleBarClick(idx)}
                    disabled={isActing}
                    title={`Select fixture #${idx + 1}`}
                    className={cn(
                      "relative w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200",
                      "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                      isBarSelected ? "ring-2 ring-primary scale-110" : "",
                      isOut ? "bg-muted/30" : isMaint ? "bg-amber-500/20" : "bg-emerald-500/20"
                    )}
                  >
                    <Lightbulb 
                      className={cn(
                        "h-5 w-5 transition-all",
                        isOut ? "text-muted-foreground/50" : 
                        isMaint ? "text-amber-500" : 
                        "text-emerald-500"
                      )}
                      fill={isOut ? "none" : isMaint ? "rgba(245, 158, 11, 0.3)" : "rgba(16, 185, 129, 0.3)"}
                    />
                    {!isOut && !isMaint && (
                      <div className="absolute inset-0 rounded-full bg-emerald-400/20 animate-pulse" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="shrink-0 self-center">
            {(() => {
              // Show pill based on selected fixture if any; else fall back to card fixture
              const baseId = selectedFixtureId || fixture.id;
              const fallbackFx = selectedFixtureId ? roomFixtures.find(rf => rf.id === selectedFixtureId) : fixture;
              const override = localStatuses[baseId];
              const statusNow = override?.status ?? fallbackFx?.status;
              const reqElecNow = override?.requires_electrician ?? (fallbackFx as Record<string, unknown>)?.requires_electrician;
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
            <Button size="sm" variant="secondary" disabled={isActing || !selectedFixtureId} onClick={handleBulbIssue}>
              Bulb issue
            </Button>
            <Button size="sm" variant="destructive" disabled={isActing || !selectedFixtureId} onClick={handleBallastIssue}>
              Ballast issue (Electrician)
            </Button>
            <Button size="sm" variant="ghost" onClick={handleCancel}>Cancel</Button>
            {actionError && (
              <span className="text-xs text-destructive ml-2">{actionError}</span>
            )}
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
              <span className="text-xs text-red-600 dark:text-red-400">Confirm?</span>
              <Button variant="destructive" size="sm" onClick={onDelete}>Yes</Button>
              <Button variant="outline" size="sm" onClick={() => setShowDeleteConfirm(false)}>No</Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {fixture.status === 'non_functional' ? (
                <Button className="w-full" size="sm" variant="default" disabled={isActing} onClick={handleMarkFixed}>
                  Mark Repaired
                </Button>
              ) : (
                <Button className="flex-1" size="sm" variant="outline" onClick={() => handleBarClick(0)}>
                  Report Outage
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
                      const issueId = (openIssue as Record<string, unknown>).issue_id ?? (openIssue as Record<string, unknown>).id;
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
