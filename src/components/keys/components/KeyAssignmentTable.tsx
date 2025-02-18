
import { format } from "date-fns";
import { User, Calendar, ArrowLeftRight } from "lucide-react";
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
  getOccupantFullName: (occupant: KeyAssignment['occupant']) => string;
}

export function KeyAssignmentTable({ 
  assignments, 
  isProcessing, 
  onReturnKey,
  getOccupantFullName 
}: KeyAssignmentTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Key</TableHead>
            <TableHead>Assigned To</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Assigned Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {assignments?.map((assignment) => (
            <TableRow key={assignment.id}>
              <TableCell>
                <KeyDetails assignment={assignment} />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {getOccupantFullName(assignment.occupant)}
                </div>
              </TableCell>
              <TableCell>{assignment.occupant?.department}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  {format(new Date(assignment.assigned_at), "MMMM d, yyyy 'at' h:mm a")}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onReturnKey(assignment.id, assignment.keys?.id || '')}
                  disabled={isProcessing}
                >
                  <ArrowLeftRight className="mr-2 h-4 w-4" />
                  Return Key
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
