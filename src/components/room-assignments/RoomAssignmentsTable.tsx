import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Edit2, Trash2, RefreshCw } from "lucide-react";
import { LoadingState } from "@/components/occupants/LoadingState";
import { ErrorState } from "@/components/occupants/ErrorState";
import { RoomAssignmentWithDetails } from "./hooks/useRoomAssignmentsList";
import { EditAssignmentInlineForm } from "./EditAssignmentInlineForm";

interface RoomAssignmentsTableProps {
  assignments: RoomAssignmentWithDetails[] | undefined;
  isLoading: boolean;
  error: Error | null;
  selectedAssignments: string[];
  onToggleSelect: (assignmentId: string) => void;
  onSelectAll: () => void;
  onUpdateAssignment: (assignmentId: string, updates: Partial<RoomAssignmentWithDetails>) => Promise<void>;
  onBulkDelete: () => Promise<void>;
  onRefresh: () => void;
}

export function RoomAssignmentsTable({
  assignments,
  isLoading,
  error,
  selectedAssignments,
  onToggleSelect,
  onSelectAll,
  onUpdateAssignment,
  onBulkDelete,
  onRefresh,
}: RoomAssignmentsTableProps) {
  const [editingAssignment, setEditingAssignment] = useState<string | null>(null);

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={onRefresh} />;
  }

  if (!assignments || assignments.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">No room assignments found</p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={onRefresh}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </Card>
    );
  }

  const getAssignmentTypeBadge = (type: string, isPrimary: boolean) => {
    const variant = isPrimary ? "default" : "secondary";
    const label = isPrimary ? "Primary" : "Secondary";
    
    return (
      <div className="flex items-center gap-2">
        <Badge variant={variant} className="text-xs">
          {label}
        </Badge>
        <span className="text-sm">{type.replace(/_/g, " ")}</span>
      </div>
    );
  };

  return (
    <Card>
      {/* Bulk Actions Header */}
      {selectedAssignments.length > 0 && (
        <div className="border-b p-4 bg-muted/50">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {selectedAssignments.length} assignment(s) selected
            </span>
            <Button
              variant="destructive"
              size="sm"
              onClick={onBulkDelete}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Selected
            </Button>
          </div>
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={
                  assignments.length > 0 && 
                  selectedAssignments.length === assignments.length
                }
                onCheckedChange={onSelectAll}
              />
            </TableHead>
            <TableHead>Occupant</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Room</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Assignment Type</TableHead>
            <TableHead>Assigned Date</TableHead>
            <TableHead>Schedule</TableHead>
            <TableHead>Notes</TableHead>
            <TableHead className="w-24">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {assignments.map((assignment) => (
            <TableRow
              key={assignment.id}
              className={selectedAssignments.includes(assignment.id) ? "bg-muted/50" : ""}
            >
              <TableCell>
                <Checkbox
                  checked={selectedAssignments.includes(assignment.id)}
                  onCheckedChange={() => onToggleSelect(assignment.id)}
                />
              </TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">{assignment.occupant_name}</div>
                  <div className="text-sm text-muted-foreground">
                    {assignment.occupant_email}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{assignment.department || "N/A"}</Badge>
              </TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">{assignment.room_number}</div>
                  <div className="text-sm text-muted-foreground">
                    {assignment.room_name}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  <div>{assignment.building_name}</div>
                  <div className="text-muted-foreground">{assignment.floor_name}</div>
                </div>
              </TableCell>
              <TableCell>
                {getAssignmentTypeBadge(assignment.assignment_type, assignment.is_primary)}
              </TableCell>
              <TableCell>
                {new Date(assignment.assigned_at).toLocaleDateString()}
              </TableCell>
              <TableCell>
                {editingAssignment === assignment.id ? (
                  <EditAssignmentInlineForm
                    assignment={assignment}
                    onSave={async (updates) => {
                      await onUpdateAssignment(assignment.id, updates);
                      setEditingAssignment(null);
                    }}
                    onCancel={() => setEditingAssignment(null)}
                  />
                ) : (
                  <div>
                    <div className="text-sm">{assignment.schedule || "Not specified"}</div>
                    <div className="text-xs text-muted-foreground">
                      {assignment.notes || "No notes"}
                    </div>
                  </div>
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingAssignment(
                      editingAssignment === assignment.id ? null : assignment.id
                    )}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}