import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { Settings2 } from "lucide-react";
import { LightingFixture } from "@/components/lighting/types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { roomLightingSchema, type RoomLightingFormData } from "./schemas/roomLightingSchema";
import { BasicConfigSection } from "./form-sections/BasicConfigSection";
import { AdditionalSettingsSection } from "./form-sections/AdditionalSettingsSection";
import { ElectricalIssuesSection } from "./form-sections/ElectricalIssuesSection";

interface RoomLightingDialogProps {
  roomId: string;
  fixture?: LightingFixture;
}

type FormProps = any; // Temporary fix until we update all components

export function RoomLightingDialog({ roomId, fixture }: RoomLightingDialogProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  
  const form = useForm<RoomLightingFormData>({
    resolver: zodResolver(roomLightingSchema),
    defaultValues: {
      room_id: roomId,
      primary_lighting: fixture?.type === 'standard' || true,
      emergency_lighting: fixture?.type === 'emergency' || false,
      lighting_type: fixture?.type || 'standard',
      fixture_count: fixture?.bulb_count || 1,
      name: fixture?.name || '',
      type: fixture?.type || 'standard',
      status: fixture?.status || 'functional',
      position: fixture?.position || 'ceiling',
      space_type: fixture?.space_type || 'room',
      technology: (fixture?.technology || 'LED') as any,
      bulb_count: fixture?.bulb_count || 1,
      electrical_issues: fixture?.electrical_issues || {
        short_circuit: false,
        wiring_issues: false,
        voltage_problems: false
      },
      ballast_issue: fixture?.ballast_issue || false,
      ballast_check_notes: fixture?.ballast_check_notes || null,
      emergency_circuit: fixture?.emergency_circuit || false,
      maintenance_notes: fixture?.maintenance_notes || null
    }
  });

  const onSubmit = async (data: RoomLightingFormData) => {
    try {
      const fixtureData = {
        name: data.name,
        type: data.lighting_type,
        status: data.status,
        bulb_count: data.bulb_count,
        room_id: data.room_id,
        space_id: roomId,
        space_type: data.space_type,
        position: data.position,
        technology: data.technology,
        electrical_issues: data.electrical_issues,
        ballast_issue: data.ballast_issue,
        ballast_check_notes: data.ballast_check_notes,
        maintenance_notes: data.maintenance_notes
      };

      if (fixture) {
        const { error } = await supabase
          .from('lighting_fixtures')
          .update(fixtureData)
          .eq('id', fixture.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('lighting_fixtures')
          .insert([fixtureData]);

        if (error) throw error;
      }

      toast.success(`Lighting configuration ${fixture ? 'updated' : 'created'} successfully`);
      queryClient.invalidateQueries({ queryKey: ['lighting-fixtures'] });
      setOpen(false);
    } catch (error: any) {
      console.error('Error saving lighting configuration:', error);
      toast.error('Failed to save lighting configuration');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Settings2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {fixture ? 'Edit Lighting Configuration' : 'Add Lighting Configuration'}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <BasicConfigSection form={form as FormProps} />
            <AdditionalSettingsSection form={form as FormProps} />
            <ElectricalIssuesSection form={form as FormProps} />
            <Button type="submit">
              {fixture ? 'Update Configuration' : 'Add Configuration'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
