import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { GripVertical, AlertTriangle, XCircle, Users, FileText, AlertCircle } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";

interface ConflictInfo {
  id: string;
  type: string;
  severity?: string;
  title: string;
  description: string;
}

interface CourtAssignmentRow {
  room_id: string;
  room_number: string;
  courtroom_number: string | null;
  court_room_id?: string | null;
  assignment_id: string | null;
  part: string | null;
  justice: string | null;
  clerks: string[] | null;
  sergeant: string | null;
  tel: string | null;
  fax: string | null;
  calendar_day: string | null;
  is_active: boolean;
  sort_order: number;
  judge_present?: boolean;
  clerks_present_count?: number;
  justice_departed?: boolean;
  justice_inactive?: boolean;
}

interface AssignmentListItemProps {
  row: CourtAssignmentRow;
  isSelected: boolean;
  onClick: () => void;
  hasIssues: boolean;
  urgentIssues: boolean;
  hasMaintenance: boolean;
  isIncomplete: boolean;
  isRecentlyAffected: boolean;
  conflicts?: ConflictInfo[];
}

export const AssignmentListItem = ({
  row,
  isSelected,
  onClick,
  hasIssues,
  urgentIssues,
  hasMaintenance,
  isIncomplete,
  isRecentlyAffected,
  conflicts = [],
}: AssignmentListItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: row.room_id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Left border accent color (the "glow" effect)
  const borderColor = hasMaintenance
    ? 'border-l-red-500 shadow-[inset_4px_0_8px_-4px_rgba(239,68,68,0.4)]'
    : !row.is_active
      ? 'border-l-blue-500 shadow-[inset_4px_0_8px_-4px_rgba(59,130,246,0.4)]'
      : urgentIssues
        ? 'border-l-yellow-500 shadow-[inset_4px_0_8px_-4px_rgba(234,179,8,0.4)]'
        : row.justice_departed || row.justice_inactive
          ? 'border-l-orange-500 shadow-[inset_4px_0_8px_-4px_rgba(249,115,22,0.4)]'
          : isIncomplete
            ? 'border-l-purple-500 shadow-[inset_4px_0_8px_-4px_rgba(168,85,247,0.4)]'
            : 'border-l-emerald-500';

  // Glow animation class
  const glowAnim = hasMaintenance
    ? 'animate-red-glow'
    : !row.is_active
      ? 'animate-blue-glow'
      : hasIssues
        ? 'animate-yellow-glow'
        : isIncomplete
          ? 'animate-purple-glow'
          : '';

  // Status text
  const statusBadge = () => {
    if (hasMaintenance) return <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4">Maint.</Badge>;
    if (!row.is_active) return <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">Inactive</Badge>;
    if (row.justice_departed) return <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4">Departed</Badge>;
    if (row.justice_inactive) return <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-orange-400 text-orange-600 dark:text-orange-400">Inactive Judge</Badge>;
    if (!row.justice || !row.justice.trim()) return <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">Open</Badge>;
    return null;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      id={`row-${row.room_id}`}
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-2 py-2.5 border-b border-l-4 cursor-pointer transition-all",
        borderColor,
        glowAnim,
        isSelected
          ? "bg-accent/60 dark:bg-accent/30"
          : "hover:bg-muted/50",
        isRecentlyAffected && "ring-1 ring-amber-400"
      )}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-0.5 hover:bg-muted rounded touch-manipulation"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
      </div>

      {/* Room info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm tabular-nums">{row.room_number}</span>
          {row.part && (
            <span className="text-xs text-muted-foreground font-medium">Pt {row.part}</span>
          )}
          {urgentIssues && <AlertTriangle className="h-3 w-3 text-destructive shrink-0" />}
          {/* Inline conflict markers */}
          {conflicts.length > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="flex items-center gap-0.5 shrink-0">
                  {conflicts.some(c => (c as any).severity === 'critical') ? (
                    <XCircle className="h-3.5 w-3.5 text-red-500" />
                  ) : conflicts.some(c => c.type === 'double_booked_judge' || c.type === 'missing_required_staff') ? (
                    <Users className="h-3.5 w-3.5 text-amber-500" />
                  ) : conflicts.some(c => c.type === 'duplicate_part') ? (
                    <FileText className="h-3.5 w-3.5 text-amber-500" />
                  ) : (
                    <AlertCircle className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                  {conflicts.length > 1 && (
                    <span className="text-[10px] font-bold text-amber-500">{conflicts.length}</span>
                  )}
                </span>
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-xs">
                <div className="space-y-1">
                  {conflicts.map(c => (
                    <div key={c.id} className="text-xs">
                      <span className="font-medium">{c.title}</span>
                    </div>
                  ))}
                </div>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          {row.justice && (
            <>
              <span className={`inline-block h-2 w-2 rounded-full shrink-0 ${row.judge_present ? 'bg-emerald-500' : 'bg-muted-foreground/40'}`} />
              <span className={cn(
                "text-xs truncate",
                (row.justice_departed || row.justice_inactive) && "line-through text-muted-foreground"
              )}>
                {row.justice}
              </span>
            </>
          )}
          {!row.justice && (
            <span className="text-xs text-muted-foreground italic">No justice</span>
          )}
        </div>
      </div>

      {/* Status badge */}
      <div className="shrink-0">
        {statusBadge()}
      </div>
    </div>
  );
};
