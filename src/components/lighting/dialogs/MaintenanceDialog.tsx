import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Wrench } from "lucide-react";
import { LightingFixture } from "../types";

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
          maintenance_history: [...currentHistory, maintenanceRecord],
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Wrench className="h-4 w-4 mr-2" />
          Record Maintenance
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Maintenance</DialogTitle>
          <DialogDescription>
            Record maintenance work performed on this lighting fixture.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Maintenance Type</Label>
            <Select onValueChange={setType} value={type}>
              <SelectTrigger>
                <SelectValue placeholder="Select type of maintenance" />
              </SelectTrigger>
              <SelectContent>
                {MAINTENANCE_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
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
              placeholder="Enter maintenance details..."
              className="h-32"
            />
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Recording..." : "Record Maintenance"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 