import React from "react";
import {
  DndContext,
  useDraggable,
  useDroppable,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { EnhancedIssue } from "@/hooks/dashboard/useAdminIssuesData";
import { EnhancedIssueCard } from "../EnhancedIssueCard";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useBulkUpdateIssueMutation } from "@/components/issues/hooks/mutations/useBulkUpdateIssueMutation";

// Column identifiers map to issue_status_enum values
const COLUMNS: Array<{
  id: "open" | "in_progress" | "resolved";
  title: string;
  accent: string;
}> = [
  { id: "open", title: "Open", accent: "border-red-200 bg-red-50/50" },
  { id: "in_progress", title: "In Progress", accent: "border-amber-200 bg-amber-50/50" },
  { id: "resolved", title: "Resolved", accent: "border-emerald-200 bg-emerald-50/50" },
];

type StatusId = (typeof COLUMNS)[number]["id"];

interface KanbanBoardProps {
  issues: EnhancedIssue[];
  onIssueUpdate: () => void;
}

export function KanbanBoard({ issues, onIssueUpdate }: KanbanBoardProps) {
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 5 } })
  );

  const bulkUpdate = useBulkUpdateIssueMutation();

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const overId = String(over.id);
    if (!overId.startsWith("column:")) return;

    const newStatus = overId.replace("column:", "") as StatusId;
    const issueId = String(active.id);

    const issue = issues.find((i) => i.id === issueId);
    if (!issue || issue.status === newStatus) return;

    try {
      await bulkUpdate.mutateAsync({ issueIds: [issueId], updates: { status: newStatus } });
      onIssueUpdate();
    } catch (e) {
      // errors are handled by the hook's toast; no-op here
    }
  };

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="grid gap-4 md:grid-cols-3">
        {COLUMNS.map((col) => (
          <KanbanColumn
            key={col.id}
            id={col.id}
            title={col.title}
            accentClass={col.accent}
            issues={issues.filter((i) => i.status === col.id)}
            onIssueUpdate={onIssueUpdate}
          />
        ))}
      </div>
    </DndContext>
  );
}

interface KanbanColumnProps {
  id: StatusId;
  title: string;
  accentClass?: string;
  issues: EnhancedIssue[];
  onIssueUpdate: () => void;
}

function KanbanColumn({ id, title, accentClass, issues, onIssueUpdate }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: `column:${id}` });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col rounded-lg border p-3 min-h-[300px] bg-background/60",
        accentClass,
        isOver && "ring-2 ring-primary/40"
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold">{title}</h4>
        <Badge variant="secondary">{issues.length}</Badge>
      </div>
      <div className="space-y-3">
        {issues.map((issue) => (
          <DraggableIssueCard key={issue.id} issue={issue} onIssueUpdate={onIssueUpdate} />
        ))}
        {issues.length === 0 && (
          <div className="text-xs text-muted-foreground italic py-4 text-center">
            No issues
          </div>
        )}
      </div>
    </div>
  );
}

interface DraggableIssueCardProps {
  issue: EnhancedIssue;
  onIssueUpdate: () => void;
}

function DraggableIssueCard({ issue, onIssueUpdate }: DraggableIssueCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: issue.id });
  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.7 : 1,
    cursor: "grab",
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <EnhancedIssueCard
        issue={issue}
        isSelected={false}
        onSelect={() => {}}
        onUpdate={onIssueUpdate}
      />
    </div>
  );
}
