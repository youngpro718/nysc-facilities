import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { UserCheck } from "lucide-react";
import { EnhancedRoom } from "../../types/EnhancedRoomTypes";

interface AssignmentsBadgeProps {
  room: EnhancedRoom;
}

export function AssignmentsBadge({ room }: AssignmentsBadgeProps) {
  const navigate = useNavigate();
  const occupants = room.current_occupants ?? [];

  const { primaryCount, secondaryCount, typeSummary } = useMemo(() => {
    let primary = 0;
    let secondary = 0;
    const typeCounts = new Map<string, number>();

    for (const occ of occupants) {
      const isPrimary = Boolean(occ?.is_primary);
      if (isPrimary) primary += 1; else secondary += 1;

      const t = typeof occ?.assignment_type === 'string' && occ.assignment_type.trim().length > 0
        ? occ.assignment_type.replace(/_/g, ' ').toLowerCase()
        : 'unspecified';
      typeCounts.set(t, (typeCounts.get(t) ?? 0) + 1);
    }

    const sortedTypes = Array.from(typeCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([t, c]) => `${t} (${c})`);

    return {
      primaryCount: primary,
      secondaryCount: secondary,
      typeSummary: sortedTypes.slice(0, 3).join(', '),
    };
  }, [occupants]);

  // Avoid redundancy when there are no occupants; OccupancyStatusBadge already shows vacancy
  if (occupants.length === 0) return null;

  const label = `${primaryCount}P${secondaryCount > 0 ? ` +${secondaryCount}S` : ''}`;
  const aria = `Assignments: ${primaryCount} primary${secondaryCount > 0 ? `, ${secondaryCount} secondary` : ''}`;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const q = room.id ?? room.room_number ?? room.name;
    navigate(`/occupants/room-assignments?room=${encodeURIComponent(String(q))}`);
  };

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
            title="Open room assignments"
          >
            <Badge variant="secondary" className="text-xs flex items-center gap-1">
              <UserCheck className="h-3 w-3" />
              {label}
            </Badge>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-xs">
          <div className="space-y-1">
            <p className="font-medium">Assignments</p>
            <p>
              {primaryCount} primary{secondaryCount > 0 ? `, ${secondaryCount} secondary` : ''}
            </p>
            {typeSummary && (
              <p className="text-muted-foreground">Types: {typeSummary}</p>
            )}
            <p className="text-muted-foreground">Click to manage assignments</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
