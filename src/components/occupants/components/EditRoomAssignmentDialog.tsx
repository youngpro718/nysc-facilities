import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AssignmentTypeSelection } from "./AssignmentTypeSelection";

interface RoomAssignment {
  id: string;
  room_id: string;
  assignment_type: string;
  is_primary: boolean;
  schedule?: string;
  notes?: string;
  room_number: string;
  room_name: string;
  building_name?: string;
  floor_name?: string;
}

interface EditRoomAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignment: RoomAssignment | null;
  occupantId: string;
  onSuccess: () => void;
}

export function EditRoomAssignmentDialog({
  open,
  onOpenChange,
  assignment,
  occupantId,
  onSuccess,
}: EditRoomAssignmentDialogProps) {
  const [assignmentType, setAssignmentType] = useState<string>("work_location");
  const [isPrimaryAssignment, setIsPrimaryAssignment] = useState(false);
  const [schedule, setSchedule] = useState("");
  const [notes, setNotes] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Initialize form when assignment changes
  useEffect(() => {
    if (assignment) {
      setAssignmentType(assignment.assignment_type || "work_location");
      setIsPrimaryAssignment(assignment.is_primary || false);
      setSchedule(assignment.schedule || "");
      setNotes(assignment.notes || "");
    }
  }, [assignment]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setAssignmentType("work_location");
      setIsPrimaryAssignment(false);
      setSchedule("");
      setNotes("");
    }
  }, [open]);

  const handleUpdate = async () => {
    if (!assignment) return;

    try {
      setIsUpdating(true);

      // If setting as primary office, demote any existing primary offices
      if (assignmentType === 'primary_office' && isPrimaryAssignment) {
        await supabase
          .from("occupant_room_assignments")
          .update({ is_primary: false })
          .eq("occupant_id", occupantId)
          .eq("is_primary", true)
          .neq("id", assignment.id);
      }

      const { error } = await supabase
        .from("occupant_room_assignments")
        .update({
          assignment_type: assignmentType,
          is_primary: assignmentType === 'primary_office' ? isPrimaryAssignment : false,
          schedule: schedule.trim() || null,
          notes: notes.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq("id", assignment.id);

      if (error) throw error;

      toast.success("Room assignment updated successfully");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Failed to update room assignment:', error);
      toast.error(error.message || "Failed to update room assignment");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!assignment) return;

    try {
      setIsDeleting(true);

      const { error } = await supabase
        .from("occupant_room_assignments")
        .delete()
        .eq("id", assignment.id);

      if (error) throw error;

      toast.success("Room assignment removed successfully");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Failed to delete room assignment:', error);
      toast.error(error.message || "Failed to remove room assignment");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!assignment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Room Assignment</DialogTitle>
          <DialogDescription>
            Modify the assignment details for Room {assignment.room_number}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Room Info */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="font-medium">Room {assignment.room_number}</div>
            <div className="text-sm text-muted-foreground">
              {assignment.building_name && assignment.floor_name && 
                `${assignment.building_name} > ${assignment.floor_name}`
              }
            </div>
          </div>

          {/* Assignment Type Selection */}
          <AssignmentTypeSelection
            assignmentType={assignmentType}
            onAssignmentTypeChange={setAssignmentType}
            isPrimaryAssignment={isPrimaryAssignment}
            onPrimaryAssignmentChange={setIsPrimaryAssignment}
          />

          {/* Schedule */}
          <div className="space-y-2">
            <Label htmlFor="schedule">Schedule (Optional)</Label>
            <Input
              id="schedule"
              value={schedule}
              onChange={(e) => setSchedule(e.target.value)}
              placeholder="e.g., Mon-Fri 9AM-5PM"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes about this assignment"
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-between">
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting || isUpdating}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Removing...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Remove
              </>
            )}
          </Button>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={isUpdating || isDeleting}>
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Update
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}