import { EnhancedRoom } from "../../types/EnhancedRoomTypes";
import { LightingStatusBadge } from "../lighting/LightingStatusBadge";
import { OccupancyStatusBadge } from "../occupancy/OccupancyStatusBadge";

import { AssignmentsBadge } from "./AssignmentsBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  AlertTriangle, 
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCourtIssuesIntegration } from "@/hooks/useCourtIssuesIntegration";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

interface SmartBadgesProps {
  room: EnhancedRoom;
  className?: string;
}

export function SmartBadges({ room, className }: SmartBadgesProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {/* Primary Status Badges */}
      <div className="flex flex-wrap gap-1.5">
        <LightingStatusBadge roomId={room.id} roomNumber={room.room_number} />
        <OccupancyStatusBadge room={room} />
        <AssignmentsBadge room={room} />
        <IssuesBadge room={room} />
      </div>
      
      {/* Secondary Information Badges */}
      <div className="flex flex-wrap gap-1.5">
        
        {/* Storage details badge - only show if storage has specific type/capacity info */}
        {room.is_storage && (room.storage_type || room.storage_capacity) && <StorageBadge room={room} />}
        
        {/* Persistent Issues Alert */}
        {room.has_persistent_issues && <PersistentIssuesBadge room={room} />}
      </div>
    </div>
  );
}

function RoomSizeDot({ room }: { room: EnhancedRoom }) {
  const sizeCategory = room.room_size_category || 'medium';

  let colorClasses = "bg-slate-500 ring-slate-500/40"; // medium
  if (sizeCategory === 'large') {
    colorClasses = "bg-purple-500 ring-purple-500/40";
  } else if (sizeCategory === 'small') {
    colorClasses = "bg-orange-500 ring-orange-500/40";
  }

  const label = `${sizeCategory.charAt(0).toUpperCase() + sizeCategory.slice(1)} room`;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            aria-label={`Room size: ${label}`}
            className={cn(
              "inline-block h-2 w-2 rounded-full ring-2",
              colorClasses
            )}
          />
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          Room size: {label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function PersistentIssuesBadge({ room }: { room: EnhancedRoom }) {
  const issueCount = room.persistent_issues?.open_issues || 0;
  
  return (
    <Badge 
      variant="destructive" 
      className="text-xs flex items-center gap-1 bg-red-500/20 text-red-700 ring-1 ring-red-500/30 animate-pulse"
    >
      <AlertTriangle className="h-3 w-3" />
      {issueCount} Recurring Issues
    </Badge>
  );
}

function StorageBadge({ room }: { room: EnhancedRoom }) {
  const storageType = room.simplified_storage_type || room.storage_type || 'general';
  const capacity = room.storage_capacity;
  
  return (
    <Badge 
      variant="secondary" 
      className="text-xs flex items-center gap-1 bg-amber-500/20 text-amber-700 ring-1 ring-amber-500/30"
    >
      <Package className="h-3 w-3" />
      {storageType.replace(/_/g, ' ')} {typeof capacity === 'number' && capacity > 0 ? `(${capacity})` : ''}
    </Badge>
  );
}

function IssuesBadge({ room }: { room: EnhancedRoom }) {
  const navigate = useNavigate();
  const { courtIssues, isLoading } = useCourtIssuesIntegration();

  const { totalCount, urgentCount } = useMemo(() => {
    const items = (courtIssues || []).filter(i => i.room_id === room.id);
    const urgent = items.filter(i => {
      const p = String(i.priority || '').toLowerCase();
      return p === 'urgent' || p === 'critical' || p === 'high';
    }).length;
    return { totalCount: items.length, urgentCount: urgent };
  }, [courtIssues, room.id]);

  // Keep UI clean if nothing to show and still loading
  if (!isLoading && totalCount === 0) return null;

  const buildingId = room.floor?.building?.id;
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const params = new URLSearchParams({ tab: 'issues', room_id: room.id });
    if (buildingId) params.set('building', buildingId);
    navigate(`/operations?${params.toString()}`);
  };

  const aria = `Issues: ${totalCount}${urgentCount > 0 ? `, ${urgentCount} urgent` : ''}`;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-1 hover:bg-accent/50"
            onClick={handleClick}
            aria-label={aria}
            title="Open issues for this room"
          >
            <Badge
              variant={urgentCount > 0 ? 'destructive' : 'secondary'}
              className={cn(
                'text-xs flex items-center gap-1',
                urgentCount > 0
                  ? 'bg-red-500/20 text-red-700 ring-1 ring-red-500/30'
                  : 'bg-slate-500/10 text-slate-700 ring-1 ring-slate-500/20'
              )}
            >
              <AlertTriangle className="h-3 w-3" />
              {urgentCount > 0 ? `${urgentCount} Urgent` : 'Issues'}
              {totalCount > 0 && urgentCount === 0 && (
                <span className="ml-0.5">{totalCount}</span>
              )}
            </Badge>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-xs">
          <div className="space-y-1">
            <p className="font-medium">Issues</p>
            <p>{totalCount} total{urgentCount > 0 ? ` • ${urgentCount} urgent` : ''}</p>
            <p className="text-muted-foreground">Click to view room issues</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}