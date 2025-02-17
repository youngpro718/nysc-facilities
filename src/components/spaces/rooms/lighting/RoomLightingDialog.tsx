
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
import { LightingFixture, LightingType } from "@/components/lighting/types";
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

export function RoomLightingDialog({ roomId, fixture }: RoomLightingDialogProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  
  const form = useForm<RoomLightingFormData>({
    resolver: zodResolver(roomLightingSchema),
    defaultValues: fixture ? {
      id: fixture.id,
      room_id: roomId,
      primary_lighting: fixture.type === 'standard',
      emergency_lighting: fixture.type === 'emergency',
      lighting_type: fixture.type,
      fixture_count: fixture.bulb_count,
      last_inspection: fixture.inspection_history?.[0]?.date,
      emergency_circuit: fixture.emergency_circuit,
      backup_duration_minutes: fixture.emergency_duration_minutes || undefined,
      electrical_issues: fixture.electrical_issues,
      technology: fixture.technology,
      status: fixture.status,
      position: fixture.position || 'ceiling',
      space_type: fixture.space_type || 'room',
      name: fixture.name,
      bulb_count: fixture.bulb_count,
      ballast_issue: fixture.ballast_issue,
      ballast_check_notes: fixture.ballast_check_notes,
      maintenance_notes: fixture.maintenance_notes
    } : {
      room_id: roomId,
      primary_lighting: true,
      emergency_lighting: false,
      lighting_type: 'standard' as LightingType,
      fixture_count: 1,
      emergency_circuit: false,
      technology: 'LED',
      status: 'functional',
      position: 'ceiling',
      space_type: 'room',
      electrical_issues: {
        short_circuit: false,
        wiring_issues: false,
        voltage_problems: false
      },
      name: '',
      bulb_count: 1,
      ballast_issue: false
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
        emergency_circuit: data.emergency_circuit,
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
    } catch (error) {
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
            <BasicConfigSection form={form} />
            <AdditionalSettingsSection form={form} />
            <ElectricalIssuesSection form={form} />
            <Button type="submit">
              {fixture ? 'Update Configuration' : 'Add Configuration'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
