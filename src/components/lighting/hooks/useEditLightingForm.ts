
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { editLightingFormSchema, type EditLightingFormData } from "../schemas/editLightingSchema";
import { LightingFixture, Space } from "../types";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { generateFixtureName } from "../schemas/lightingSchema";

export function useEditLightingForm(
  fixture: LightingFixture,
  onFixtureUpdated: () => void,
  onClose: () => void
) {
  const form = useForm<EditLightingFormData>({
    resolver: zodResolver(editLightingFormSchema),
    defaultValues: {
      name: fixture.name,
      type: fixture.type,
      status: fixture.status,
      maintenance_notes: fixture.maintenance_notes || null,
      technology: fixture.technology,
      bulb_count: fixture.bulb_count || 1,
      electrical_issues: fixture.electrical_issues || {
        short_circuit: false,
        wiring_issues: false,
        voltage_problems: false,
      },
      ballast_issue: fixture.ballast_issue || false,
      ballast_check_notes: fixture.ballast_check_notes || null,
      space_id: fixture.space_id!,
      space_type: fixture.space_type as 'room' | 'hallway',
      position: fixture.position as 'ceiling' | 'wall' | 'floor' | 'desk',
      zone_id: fixture.zone_id || null,
    },
  });

  // Query to get the space details
  const { data: space } = useQuery({
    queryKey: ['space', fixture.space_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('spaces')
        .select('*')
        .eq('id', fixture.space_id)
        .single();

      if (error) throw error;
      return data as Space;
    },
    enabled: !!fixture.space_id
  });

  // Watch for changes to update the name
  const spaceId = form.watch('space_id');
  const position = form.watch('position');
  const spaceType = space?.space_type || form.watch('space_type');

  const updateName = async () => {
    if (spaceId && position && space) {
      try {
        const { data: sequenceData, error } = await supabase
          .rpc('get_next_lighting_sequence', {
            p_space_id: spaceId
          });
        
        if (error) {
          console.error('Error getting sequence:', error);
          return;
        }

        const sequence = typeof sequenceData === 'number' ? sequenceData : 1;
        
        const name = generateFixtureName(
          space.space_type,
          space.name,
          space.room_number,
          position,
          sequence
        );

        form.setValue('name', name, {
          shouldValidate: true,
          shouldDirty: true,
          shouldTouch: true
        });
      } catch (error) {
        console.error('Error in updateName:', error);
      }
    }
  };

  const onSubmit = async (data: EditLightingFormData) => {
    try {
      // Convert lowercase technology values to uppercase if needed
      let normalizedTechnology = data.technology;
      if (normalizedTechnology === "led") normalizedTechnology = "LED";
      if (normalizedTechnology === "fluorescent") normalizedTechnology = "Fluorescent";
      
      // Make sure we're sending the exact fields the database expects
      const updateData = {
        name: data.name,
        type: data.type,
        status: data.status,
        maintenance_notes: data.maintenance_notes,
        bulb_count: data.bulb_count,
        technology: normalizedTechnology,
        electrical_issues: data.electrical_issues,
        ballast_issue: data.ballast_issue,
        ballast_check_notes: data.ballast_check_notes,
        space_id: data.space_id,
        space_type: data.space_type,
        position: data.position,
        zone_id: data.zone_id
      };

      const { error } = await supabase
        .from('lighting_fixtures')
        .update(updateData)
        .eq('id', fixture.id);

      if (error) throw error;

      onFixtureUpdated();
      onClose();
    } catch (error: any) {
      console.error('Error updating lighting fixture:', error);
      throw error;
    }
  };

  return {
    form,
    onSubmit: form.handleSubmit(onSubmit),
    updateName
  };
}
