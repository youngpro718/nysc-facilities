import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Wrench, MapPin, Clock, Lightbulb } from "lucide-react";
import { LightingFixture } from "@/types/lighting";
import { BaseLightingDialog } from "../shared/BaseLightingDialog";
import { StandardFormSection } from "../shared/StandardFormSection";
import { StandardFormField } from "../shared/StandardFormField";

interface MaintenanceDialogProps {
  fixture: LightingFixture;
  onComplete: () => void;
}

const MAINTENANCE_TYPES = [
  "Routine Check",
  "Bulb Replacement",
  "Ballast Repair",
  "Wiring Repair",
  "Emergency System Check",
  "Motion Sensor Calibration",
  "Cleaning",
  "Other"
] as const;

export function MaintenanceDialog({ fixture, onComplete }: MaintenanceDialogProps) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const handleSubmit = async () => {
    if (!type) {
      toast.error("Please select a maintenance type");
      return;
    }

    setIsSubmitting(true);
    try {
      // Create the maintenance record
      const maintenanceRecord = {
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        type,
        notes
      };

      // Get current maintenance history
      const currentHistory = fixture.maintenance_history || [];

      // Update the fixture with the new maintenance record
      const { error } = await supabase
        .from('lighting_fixtures')
        .update({
          maintenance_history: [...currentHistory, maintenanceRecord] as any,
          status: 'functional', // Reset status to functional after maintenance
          maintenance_notes: notes || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', fixture.id);

      if (error) throw error;

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['lighting-fixtures'] });
      queryClient.invalidateQueries({ queryKey: ['lighting-stats'] });

      toast.success("Maintenance record added successfully");
      onComplete();
      setOpen(false);
    } catch (error: any) {
      console.error('Error adding maintenance record:', error);
      toast.error(error.message || "Failed to add maintenance record");
    } finally {
      setIsSubmitting(false);
    }
  };

  const contextInfo = [
    { label: "Fixture Name", value: fixture.name, icon: <Lightbulb className="h-3 w-3" /> },
    { label: "Current Status", value: fixture.status, icon: <Wrench className="h-3 w-3" /> },
    { label: "Location", value: fixture.room_number || 'Unassigned', icon: <MapPin className="h-3 w-3" /> },
    { label: "Last Maintenance", value: fixture.maintenance_history?.length ? 
      new Date(fixture.maintenance_history[fixture.maintenance_history.length - 1].date).toLocaleDateString() : 'Never', 
      icon: <Clock className="h-3 w-3" /> }
  ];

  return (
    <BaseLightingDialog
      open={open}
      onOpenChange={setOpen}
      title={`Record Maintenance: ${fixture.name}`}
      description="Document maintenance work performed on this lighting fixture to track service history and maintain optimal performance."
      status={fixture.status}
      contextInfo={contextInfo}
      trigger={
        <Button variant="outline" size="sm" className="text-blue-600 border-blue-200 hover:bg-blue-50">
          <Wrench className="h-4 w-4 mr-2" />
          Record Maintenance
        </Button>
      }
    >
      <StandardFormSection
        title="Maintenance Details"
        description="Select the type of maintenance performed and provide detailed notes for future reference."
        icon={<Wrench className="h-4 w-4 text-primary" />}
        variant="accent"
      >
        <div className="space-y-6">
          <div className="space-y-3">
            <label className="text-sm font-medium flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              Maintenance Type *
            </label>
            <Select onValueChange={setType} value={type}>
              <SelectTrigger>
                <SelectValue placeholder="Select type of maintenance performed" />
              </SelectTrigger>
              <SelectContent>
                {MAINTENANCE_TYPES.map((maintenanceType) => (
                  <SelectItem key={maintenanceType} value={maintenanceType}>
                    {maintenanceType}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Maintenance Notes
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Describe the maintenance work performed, parts replaced, issues found, etc..."
              className="h-32 resize-none"
            />
            <div className="text-xs text-muted-foreground bg-muted/50 rounded p-2">
              💡 Include details about parts replaced, procedures followed, and any issues discovered during maintenance.
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
              disabled={isSubmitting || !type}
              className="flex items-center gap-2"
            >
              <Wrench className="h-4 w-4" />
              {isSubmitting ? "Recording..." : "Record Maintenance"}
            </Button>
          </div>
        </div>
      </StandardFormSection>
    </BaseLightingDialog>
  );
} 