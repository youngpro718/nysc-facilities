
import { format } from "date-fns";
import { User, Calendar, ArrowLeftRight, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { KeyAssignment } from "../types/assignmentTypes";
import { KeyDetails } from "./KeyDetails";

interface KeyAssignmentTableProps {
  assignments: KeyAssignment[] | undefined;
  isProcessing: boolean;
  onReturnKey: (assignmentId: string, keyId: string) => void;
  onEditAssignment?: (assignment: KeyAssignment) => void;
}

export function KeyAssignmentTable({ 
  assignments, 
  isProcessing, 
  onReturnKey,
  onEditAssignment
}: KeyAssignmentTableProps) {
  const getOccupantFullName = (occupant: KeyAssignment['occupant']) => {
    if (!occupant) return 'Unknown';
    return `${occupant.first_name} ${occupant.last_name}`;
  };

  const getRecipientName = (assignment: KeyAssignment) => {
    if (assignment.occupant) {
      return `${assignment.occupant.first_name} ${assignment.occupant.last_name}`;
    }
    return assignment.recipient_name || 'Unknown';
  };

  const getRecipientLocation = (assignment: KeyAssignment) => {
    if (assignment.occupant?.department) {
      return assignment.occupant.department;
    }
    return 'External recipient';
  };

  if (!assignments || assignments.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No active key assignments found.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Key Details</TableHead>
            <TableHead>Assigned To</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Assignment Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {assignments.map((assignment) => (
            <TableRow key={assignment.id}>
              <TableCell>
                <KeyDetails assignment={assignment} />
              </TableCell>
              <TableCell>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span className="font-medium">
                        {getRecipientName(assignment)}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {getRecipientLocation(assignment)}
                    </div>
                  </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {getRecipientLocation(assignment)}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div className="text-sm">
                    <div>
                      {format(new Date(assignment.assigned_at), "MMM d, yyyy")}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(assignment.assigned_at), "h:mm a")}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center gap-2 justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEditAssignment?.(assignment)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onReturnKey(assignment.id, assignment.keys?.id || '')}
                    disabled={isProcessing}
                  >
                    <ArrowLeftRight className="mr-2 h-4 w-4" />
                    Return
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
