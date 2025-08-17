
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { LightingFixture } from "@/types/lighting";
import { EditLightingDialog } from "../EditLightingDialog";
import { ReportIssueDialog } from "../issues/ReportIssueDialog";
import { cn } from "@/lib/utils";
import { Lightbulb, RotateCw, Trash2, Calendar, Clock, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useQuery } from "@tanstack/react-query";
import { getLightingIssuesForFixture } from "@/services/supabase/lightingIssuesService";
import { useNavigate } from "react-router-dom";
import * as locationUtil from "@/components/lighting/utils/location";
import { StatusBadge } from "@/components/lighting/components/StatusBadge";
import { markLightsFixed, markLightsOut, toggleElectricianRequired } from "@/services/supabase/lightingService";

interface CardFrontProps {
  fixture: LightingFixture;
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
  onDelete: () => void;
  onFixtureUpdated: () => void;
  onFlip: () => void;
}

export function CardFront({ 
  fixture, 
  isSelected, 
  onSelect, 
  onDelete, 
  onFixtureUpdated,
  onFlip
}: CardFrontProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const navigate = useNavigate();

  // Fetch any issues related to this fixture
  const { data: fixtureIssues } = useQuery({
    queryKey: ["lighting-fixture-issues", fixture.id],
    queryFn: () => getLightingIssuesForFixture(fixture.id),
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
  const handleMarkOut = async (requiresElectrician: boolean) => {
    try {
      setIsActing(true);
      await markLightsOut([fixture.id], requiresElectrician);
      onFixtureUpdated();
    } finally {
      setIsActing(false);
    }
  };
  const handleMarkFixed = async () => {
    try {
      setIsActing(true);
      await markLightsFixed([fixture.id]);
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

  return (
    <Card className={cn(
      "w-full h-full min-h-[240px] flex flex-col rounded-xl border bg-card/80 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5",
      isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background"
    )}>
      <div className="absolute top-4 left-4 z-10">
        <Checkbox 
          checked={isSelected}
          onCheckedChange={onSelect}
          className="rounded-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
        />
      </div>
      
      <div className="absolute top-4 right-4 z-10">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-md hover:bg-muted/60"
          onClick={onFlip}
        >
          <RotateCw className="h-4 w-4" />
        </Button>
      </div>

      <CardHeader className="pt-4 pb-2">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-semibold text-[15px] truncate">{fixture.name}</h3>
          <StatusBadge status={fixture.status} />
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-3 space-y-3 flex flex-col h-full">
        {/* Meta: two lines */}
        <div className="text-xs text-muted-foreground truncate">
          {getLocationText()}
        </div>
        <div className="text-xs text-muted-foreground truncate">
          <span>{fixture.technology || 'N/A'}</span>
          <span className="mx-1">•</span>
          <span className="inline-flex items-center gap-1"><Lightbulb className="h-3 w-3" />{fixture.bulb_count ?? '—'}</span>
          <span className="mx-1">•</span>
          <span>{fixture.zone_name || 'Unassigned'}</span>
        </div>

        {fixture.next_maintenance_date && (
          <div className={cn(
            "flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ring-1 ring-border",
            isMaintenanceSoon() ? "bg-yellow-50 text-yellow-800" : "bg-blue-50 text-blue-800"
          )}>
            <Calendar className="h-3 w-3" />
            <span>Maintenance: {formatMaintenanceDate(fixture.next_maintenance_date)}</span>
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

        <div className="mt-auto flex justify-between items-center gap-2 pt-2 border-t bg-muted/30 rounded-b-xl backdrop-blur supports-[backdrop-filter]:bg-muted/20">
          {showDeleteConfirm ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-red-600">Confirm?</span>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={onDelete}
              >
                Yes
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowDeleteConfirm(false)}
              >
                No
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {/* Quick actions for outage / repair */}
              {fixture.status !== 'non_functional' ? (
                <>
                  <Button size="sm" variant="secondary" disabled={isActing} onClick={() => handleMarkOut(false)}>
                    Out - Bulb
                  </Button>
                  <Button size="sm" variant="destructive" disabled={isActing} onClick={() => handleMarkOut(true)}>
                    Out - Electrician
                  </Button>
                </>
              ) : (
                <>
                  <Button size="sm" variant="default" disabled={isActing} onClick={handleMarkFixed}>
                    Mark Repaired
                  </Button>
                </>
              )}

              {/* Secondary actions in menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-md hover:bg-muted/60">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {fixture.status === 'non_functional' && (
                    <DropdownMenuItem onClick={() => handleToggleElectrician()} disabled={isActing}>
                      {fixture.requires_electrician ? 'Unset Electrician' : 'Needs Electrician'}
                    </DropdownMenuItem>
                  )}
                  {openIssue ? (
                    <DropdownMenuItem onClick={() => {
                      const issueId = (openIssue as any).issue_id ?? (openIssue as any).id;
                      navigate(`/operations?issue_id=${issueId}`);
                    }}>
                      View Issue
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem asChild>
                      <div>
                        <ReportIssueDialog fixture={fixture} />
                      </div>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <div>
                      <EditLightingDialog fixture={fixture} onFixtureUpdated={onFixtureUpdated} />
                    </div>
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
    </Card>
  );
}
