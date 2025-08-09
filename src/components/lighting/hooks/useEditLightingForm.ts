
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { editLightingFormSchema, type EditLightingFormData } from "../schemas/editLightingSchema";
import { type LightingFixture, type Space, LightingTechnology } from "@/types/lighting";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { generateFixtureName } from "../schemas/lightingSchema";

export function useEditLightingForm(
  fixture: LightingFixture,
  onFixtureUpdated: () => void,
  onClose: () => void
) {
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

  const form = useForm<EditLightingFormData>({
    resolver: zodResolver(editLightingFormSchema),
    defaultValues: {
      name: fixture.name,
      type: fixture.type,
      status: fixture.status,
      maintenance_notes: fixture.maintenance_notes || null,
      technology: normalizeTechnology(fixture.technology),
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
      room_number: fixture.room_number || null,
    },
  });

  // Query to get the space details from rooms or hallways
  const { data: space } = useQuery({
    queryKey: ['space', fixture.space_id],
    queryFn: async () => {
      // Try to find the space in rooms first, then hallways
      const roomResult = await supabase
        .from('rooms')
        .select('id, name, room_number, floor_id')
        .eq('id', fixture.space_id)
        .single();
      
      if (!roomResult.error && roomResult.data) {
        return {
          id: roomResult.data.id,
          name: roomResult.data.name,
          room_number: roomResult.data.room_number,
          floor_id: roomResult.data.floor_id,
          space_type: 'room'
        } as Space;
      }
      
      const hallwayResult = await supabase
        .from('hallways')
        .select('id, name, floor_id')
        .eq('id', fixture.space_id)
        .single();
        
      if (!hallwayResult.error && hallwayResult.data) {
        return {
          id: hallwayResult.data.id,
          name: hallwayResult.data.name,
          room_number: null,
          floor_id: hallwayResult.data.floor_id,
          space_type: 'hallway'
        } as Space;
      }
      
      throw new Error('Space not found');
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
      // Update with the correct data structure that matches database expectations
      const updateData = {
        name: data.name,
        type: data.type,
        status: data.status,
        maintenance_notes: data.maintenance_notes,
        technology: data.technology,
        bulb_count: data.bulb_count,
        electrical_issues: data.electrical_issues,
        ballast_issue: data.ballast_issue,
        ballast_check_notes: data.ballast_check_notes,
        space_id: data.space_id,
        space_type: data.space_type,
        position: data.position,
        zone_id: data.zone_id,
        room_number: data.room_number,
      };

      const { error } = await supabase
        .from('lighting_fixtures')
        .update(updateData as any) // Using type assertion to avoid complex type mapping
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
