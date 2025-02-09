
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { RoomLightingConfig } from "@/components/lighting/types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BasicConfigSection } from "./form-sections/BasicConfigSection";
import { ElectricalIssuesSection } from "./form-sections/ElectricalIssuesSection";
import { AdditionalSettingsSection } from "./form-sections/AdditionalSettingsSection";

interface RoomLightingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomId: string;
  initialData?: RoomLightingConfig;
}

export function RoomLightingDialog({ 
  open, 
  onOpenChange, 
  roomId, 
  initialData 
}: RoomLightingDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<RoomLightingConfig>({
    defaultValues: initialData || {
      room_id: roomId,
      name: `Room ${roomId} Lighting`,
      type: "standard",
      technology: "LED",
      bulb_count: 1,
      status: "functional",
      electrical_issues: {
        short_circuit: false,
        wiring_issues: false,
        voltage_problems: false
      },
      ballast_issue: false,
      emergency_circuit: false,
      maintenance_notes: "",
      ballast_check_notes: "",
      position: "ceiling" // Set a default position
    }
  });

  const onSubmit = async (values: RoomLightingConfig) => {
    setIsSubmitting(true);
    try {
      const fixtureData = {
        name: values.name,
        type: values.type,
        technology: values.technology,
        bulb_count: values.bulb_count,
        status: values.status,
        electrical_issues: values.electrical_issues,
        ballast_issue: values.ballast_issue,
        emergency_circuit: values.emergency_circuit,
        maintenance_notes: values.maintenance_notes,
        ballast_check_notes: values.ballast_check_notes,
        position: values.position as "ceiling" | "wall" | "floor" | "desk" | "recessed",
        id: values.id // Include if it exists (for updates)
      };

      const { error } = await supabase
        .from('lighting_fixtures')
        .upsert({
          ...fixtureData,
          id: values.id, // For updates
          space_id: roomId,
          space_type: 'room'
        });

      if (error) throw error;

      toast.success("Lighting configuration saved successfully");
      queryClient.invalidateQueries({ queryKey: ['room-lighting', roomId] });
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to save lighting configuration");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Configure Room Lighting</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-6">
              <BasicConfigSection form={form} />
              <ElectricalIssuesSection form={form} />
              <AdditionalSettingsSection form={form} />
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                Save Changes
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
