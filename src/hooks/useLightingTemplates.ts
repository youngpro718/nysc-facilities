import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LightingTemplate, FloorLightingMetadata } from '@/types/lightingTemplates';
import { toast } from 'sonner';

export const useLightingTemplates = () => {
  return useQuery({
    queryKey: ['lighting-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lighting_templates')
        .select('*')
        .order('template_type', { ascending: true });

      if (error) throw error;
      return data as LightingTemplate[];
    },
  });
};

export const useFloorLightingMetadata = (floorId?: string) => {
  return useQuery({
    queryKey: ['floor-lighting-metadata', floorId],
    queryFn: async () => {
      if (!floorId) return null;
      
      const { data, error } = await supabase
        .from('floor_lighting_metadata')
        .select('*')
        .eq('floor_id', floorId)
        .maybeSingle();

      if (error) throw error;
      return data as FloorLightingMetadata | null;
    },
    enabled: !!floorId,
  });
};

export const useCreateFixturesFromTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      templateId, 
      hallwayId, 
      floorNumber,
      bankNumber 
    }: { 
      templateId: string; 
      hallwayId: string; 
      floorNumber: number;
      bankNumber?: number;
    }) => {
      // Get template details
      const { data: template, error: templateError } = await supabase
        .from('lighting_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (templateError) throw templateError;

      // Get hallway details
      const { data: hallway, error: hallwayError } = await supabase
        .from('hallways')
        .select('*, floors(name)')
        .eq('id', hallwayId)
        .single();

      if (hallwayError) throw hallwayError;

      // Generate fixtures based on template
      const fixtures = [];
      for (let i = 1; i <= template.fixture_count; i++) {
        let fixtureName = template.special_config.naming_pattern || 'Fixture-{sequence}';
        
        // Replace placeholders in naming pattern
        fixtureName = fixtureName
          .replace('{floor}', floorNumber.toString())
          .replace('{sequence}', i.toString())
          .replace('{bank}', bankNumber?.toString() || '1');

        fixtures.push({
          name: fixtureName,
          type: template.template_type === 'elevator_bank' ? 'emergency' : 'standard',
          status: 'functional',
          space_id: hallwayId,
          space_type: 'hallway',
          position: 'ceiling',
          technology: 'LED',
          bulb_count: template.bulbs_per_fixture,
          ballast_issue: false,
          requires_electrician: false,
          notes: `Generated from template: ${template.name}`,
        });
      }

      // Insert fixtures
      const { data, error } = await supabase
        .from('lighting_fixtures')
        .insert(fixtures)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lighting-fixtures'] });
      toast.success('Fixtures created successfully from template');
    },
    onError: (error) => {
      toast.error(`Failed to create fixtures: ${error.message}`);
    },
  });
};

export const useUpdateFloorMetadata = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (metadata: Omit<FloorLightingMetadata, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('floor_lighting_metadata')
        .upsert(metadata, { onConflict: 'floor_id' })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['floor-lighting-metadata'] });
      toast.success('Floor lighting metadata updated');
    },
    onError: (error) => {
      toast.error(`Failed to update metadata: ${error.message}`);
    },
  });
};