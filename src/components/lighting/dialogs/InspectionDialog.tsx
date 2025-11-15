import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { ClipboardCheck, MapPin, Clock, Lightbulb } from "lucide-react";
import { LightingFixture } from "@/types/lighting";
import { BaseLightingDialog } from "../shared/BaseLightingDialog";
import { StandardFormSection } from "../shared/StandardFormSection";

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
          inspection_history: [...currentHistory, inspectionRecord] as any,
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

  const contextInfo = [
    { label: "Fixture Name", value: fixture.name, icon: <Lightbulb className="h-3 w-3" /> },
    { label: "Current Status", value: fixture.status, icon: <ClipboardCheck className="h-3 w-3" /> },
    { label: "Location", value: fixture.room_number || 'Unassigned', icon: <MapPin className="h-3 w-3" /> },
    { label: "Last Inspection", value: fixture.inspection_history?.length ? 
      new Date(fixture.inspection_history[fixture.inspection_history.length - 1].date).toLocaleDateString() : 'Never', 
      icon: <Clock className="h-3 w-3" /> }
  ];

  return (
    <BaseLightingDialog
      open={open}
      onOpenChange={setOpen}
      title={`Record Inspection: ${fixture.name}`}
      description="Document the results of lighting fixture inspection to ensure safety compliance and optimal performance."
      status={fixture.status}
      contextInfo={contextInfo}
      trigger={
        <Button variant="outline" size="sm" className="text-green-600 border-green-200 hover:bg-green-50">
          <ClipboardCheck className="h-4 w-4 mr-2" />
          Record Inspection
        </Button>
      }
    >
      <StandardFormSection
        title="Inspection Results"
        description="Record the inspection outcome and any observations or issues discovered during the inspection process."
        icon={<ClipboardCheck className="h-4 w-4 text-primary" />}
        variant="accent"
      >
        <div className="space-y-6">
          <div className="space-y-3">
            <label className="text-sm font-medium flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4" />
              Inspection Status *
            </label>
            <Select onValueChange={setStatus} value={status}>
              <SelectTrigger>
                <SelectValue placeholder="Select inspection outcome" />
              </SelectTrigger>
              <SelectContent>
                {INSPECTION_STATUSES.map((inspectionStatus) => (
                  <SelectItem key={inspectionStatus} value={inspectionStatus}>
                    {inspectionStatus}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Inspection Notes
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Record inspection findings, safety issues, performance observations, recommendations..."
              className="h-32 resize-none"
            />
            <div className="text-xs text-muted-foreground bg-muted/50 rounded p-2">
              💡 Document any safety concerns, performance issues, or recommendations for future maintenance.
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting || !status}
              className="flex items-center gap-2"
            >
              <ClipboardCheck className="h-4 w-4" />
              {isSubmitting ? "Recording..." : "Record Inspection"}
            </Button>
          </div>
        </div>
      </StandardFormSection>
    </BaseLightingDialog>
  );
} 