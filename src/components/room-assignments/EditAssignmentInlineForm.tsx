import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Check, X } from "lucide-react";
import { RoomAssignmentWithDetails } from "./hooks/useRoomAssignmentsList";

interface EditAssignmentInlineFormProps {
  assignment: RoomAssignmentWithDetails;
  onSave: (updates: Partial<RoomAssignmentWithDetails>) => Promise<void>;
  onCancel: () => void;
}

export function EditAssignmentInlineForm({
  assignment,
  onSave,
  onCancel,
}: EditAssignmentInlineFormProps) {
  const [assignmentType, setAssignmentType] = useState(assignment.assignment_type);
  const [isPrimary, setIsPrimary] = useState(assignment.is_primary);
  const [schedule, setSchedule] = useState(assignment.schedule || "");
  const [notes, setNotes] = useState(assignment.notes || "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({
        assignment_type: assignmentType,
        is_primary: isPrimary,
        schedule: schedule.trim() || null,
        notes: notes.trim() || null,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-3 p-3 border rounded-lg bg-background">
      <div className="space-y-2">
        <Select value={assignmentType} onValueChange={setAssignmentType}>
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="work_location">Work Location</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          checked={isPrimary}
          onCheckedChange={(checked) => setIsPrimary(checked === true)}
        />
        <label className="text-sm font-medium">Primary assignment</label>
      </div>

      <div className="space-y-2">
        <Input
          placeholder="e.g., Monday-Friday 9AM-5PM, Full-time"
          value={schedule}
          onChange={(e) => setSchedule(e.target.value)}
          className="h-8"
        />
      </div>

      <Textarea
        placeholder="Notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        className="min-h-[60px]"
      />

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          onClick={handleSave}
          disabled={isSaving}
        >
          <Check className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onCancel}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}