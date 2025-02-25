import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ClipboardCheck } from "lucide-react";
import { LightingFixture } from "../types";

interface InspectionDialogProps {
  fixture: LightingFixture;
  onComplete: () => void;
}

const INSPECTION_STATUSES = [
  "Passed",
  "Minor Issues",
  "Major Issues",
  "Failed",
  "Needs Immediate Attention"
] as const;

export function InspectionDialog({ fixture, onComplete }: InspectionDialogProps) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const handleSubmit = async () => {
    if (!status) {
      toast.error("Please select an inspection status");
      return;
    }

    setIsSubmitting(true);
    try {
      // Create the inspection record
      const inspectionRecord = {
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        status,
        notes
      };

      // Get current inspection history
      const currentHistory = fixture.inspection_history || [];

      // Determine fixture status based on inspection
      let newStatus = fixture.status;
      if (status === "Failed" || status === "Needs Immediate Attention") {
        newStatus = "maintenance_needed";
      } else if (status === "Major Issues") {
        newStatus = "pending_maintenance";
      }

      // Update the fixture with the new inspection record
      const { error } = await supabase
        .from('lighting_fixtures')
        .update({
          inspection_history: [...currentHistory, inspectionRecord],
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', fixture.id);

      if (error) throw error;

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['lighting-fixtures'] });
      queryClient.invalidateQueries({ queryKey: ['lighting-stats'] });

      toast.success("Inspection record added successfully");
      onComplete();
      setOpen(false);
    } catch (error: any) {
      console.error('Error adding inspection record:', error);
      toast.error(error.message || "Failed to add inspection record");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <ClipboardCheck className="h-4 w-4 mr-2" />
          Record Inspection
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Inspection</DialogTitle>
          <DialogDescription>
            Record the results of a lighting fixture inspection.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Inspection Status</Label>
            <Select onValueChange={setStatus} value={status}>
              <SelectTrigger>
                <SelectValue placeholder="Select inspection status" />
              </SelectTrigger>
              <SelectContent>
                {INSPECTION_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter inspection details..."
              className="h-32"
            />
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Recording..." : "Record Inspection"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 