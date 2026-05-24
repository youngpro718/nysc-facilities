import { Gavel, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { RoomCourtAssignment } from "@features/spaces/hooks/queries/useCourtAssignmentsMap";

interface Props {
  assignment: RoomCourtAssignment;
}

export function CourtroomAssignmentHeader({ assignment }: Props) {
  const clerks = Array.isArray(assignment.clerks)
    ? assignment.clerks.filter(Boolean)
    : [];

  return (
    <div className="rounded-lg border bg-card p-3 flex flex-wrap items-center gap-2">
      <Gavel className="h-4 w-4 text-muted-foreground" />
      {assignment.part && (
        <Badge variant="secondary" className="text-xs">
          Part {assignment.part}
        </Badge>
      )}
      {assignment.justice && (
        <span className="text-sm font-medium text-foreground">
          {assignment.justice}
        </span>
      )}
      {clerks.length > 0 && (
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground ml-2">
          <Users className="h-3.5 w-3.5" />
          {clerks.join(", ")}
        </span>
      )}
      {assignment.sergeant && (
        <span className="text-xs text-muted-foreground ml-2">
          Sgt. {assignment.sergeant}
        </span>
      )}
    </div>
  );
}
