
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Settings2, Home, Lightbulb, MapPin, Clock } from "lucide-react";
import { LightingFixture, LightingTechnology } from "@/types/lighting";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { roomLightingSchema, type RoomLightingFormData } from "./schemas/roomLightingSchema";
import { BasicConfigSection } from "./form-sections/BasicConfigSection";
import { AdditionalSettingsSection } from "./form-sections/AdditionalSettingsSection";
import { ElectricalIssuesSection } from "./form-sections/ElectricalIssuesSection";
import { BaseLightingDialog } from "../../../lighting/shared/BaseLightingDialog";
import { StandardFormSection } from "../../../lighting/shared/StandardFormSection";

interface RoomLightingDialogProps {
  roomId: string;
  fixture?: LightingFixture;
}

type FormProps = any; // Temporary fix until we update all components

export function RoomLightingDialog({ roomId, fixture }: RoomLightingDialogProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  
  // Normalize technology to match our enum
  const normalizeTechnology = (tech: string | null): LightingTechnology | null => {
    if (!tech) return null;
    
    switch(tech.toLowerCase()) {
      case 'led': return 'LED';
      case 'fluorescent': return 'Fluorescent';
      case 'bulb':
      case 'incandescent':
      case 'halogen':
      case 'metal_halide':
        return 'Bulb';
      default:
        return null;
    }
  };
  
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
      technology: normalizeTechnology(fixture?.technology) || 'LED',
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
      // Create a properly typed object for database insertion
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
          .update(fixtureData as any)  // Using type assertion to avoid complex type mapping
          .eq('id', fixture.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('lighting_fixtures')
          .insert([fixtureData as any]);  // Using type assertion to avoid complex type mapping

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

  const contextInfo = fixture ? [
    { label: "Current Status", value: fixture.status, icon: <Lightbulb className="h-3 w-3" /> },
    { label: "Room ID", value: roomId, icon: <Home className="h-3 w-3" /> },
    { label: "Technology", value: fixture.technology || 'Unknown', icon: <Lightbulb className="h-3 w-3" /> },
    { label: "Last Updated", value: new Date(fixture.updated_at || Date.now()).toLocaleDateString(), icon: <Clock className="h-3 w-3" /> }
  ] : [
    { label: "Room ID", value: roomId, icon: <Home className="h-3 w-3" /> },
    { label: "Action", value: "Adding new configuration", icon: <Settings2 className="h-3 w-3" /> }
  ];

  return (
    <BaseLightingDialog
      open={open}
      onOpenChange={setOpen}
      title={fixture ? 'Edit Lighting Configuration' : 'Add Lighting Configuration'}
      description={fixture ? 
        "Update the lighting configuration for this room with enhanced technical settings." : 
        "Set up new lighting configuration for this room with proper technical specifications."
      }
      status={fixture?.status}
      contextInfo={contextInfo}
      trigger={
        <Button variant="outline" size="icon" className="text-blue-600 border-blue-200 hover:bg-blue-50">
          <Settings2 className="h-4 w-4" />
        </Button>
      }
    >
      <div className="space-y-6">
        <StandardFormSection
          title="Basic Configuration"
          description="Configure the primary lighting settings and room assignment for this fixture."
          icon={<Home className="h-4 w-4 text-primary" />}
        >
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <BasicConfigSection form={form as FormProps} />
            </form>
          </Form>
        </StandardFormSection>

        <StandardFormSection
          title="Additional Settings"
          description="Configure advanced features and special lighting requirements."
          icon={<Settings2 className="h-4 w-4 text-primary" />}
          variant="muted"
        >
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <AdditionalSettingsSection form={form as FormProps} />
            </form>
          </Form>
        </StandardFormSection>

        <StandardFormSection
          title="Electrical Issues"
          description="Report and track any electrical problems or maintenance needs."
          icon={<Lightbulb className="h-4 w-4 text-amber-600" />}
          variant="accent"
        >
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <ElectricalIssuesSection form={form as FormProps} />
              
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex items-center gap-2">
                  <Settings2 className="h-4 w-4" />
                  {fixture ? 'Update Configuration' : 'Add Configuration'}
                </Button>
              </div>
            </form>
          </Form>
        </StandardFormSection>
      </div>
    </BaseLightingDialog>
  );
}
