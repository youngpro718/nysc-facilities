
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Json } from '@/integrations/supabase/types';

interface LightingFixture {
  id: string;
  name: string;
  type: string;
  status: string;
  space_type: string;
  zone_id?: string;
  maintenance_history?: MaintenanceRecord[];
  electrical_issues?: Json;
  backup_power_source?: string;
  bulb_count?: number;
  connected_fixtures?: string[];
  created_at?: string;
  space_id?: string;
}

interface MaintenanceRecord {
  id: string;
  date: string;
  type: string;
  notes: string;
}

export function useLightingFixtures() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: fixtures, isLoading } = useQuery({
    queryKey: ['lighting-fixtures'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lighting_fixtures')
        .select('*');

      if (error) throw error;
      return data as LightingFixture[];
    }
  });

  const createMutation = useMutation({
    mutationFn: async (fixture: Omit<LightingFixture, 'id'>) => {
      const { data, error } = await supabase
        .from('lighting_fixtures')
        .insert({
          name: fixture.name,
          type: fixture.type,
          status: fixture.status,
          space_type: fixture.space_type,
          zone_id: fixture.zone_id,
          electrical_issues: fixture.electrical_issues || {},
          backup_power_source: fixture.backup_power_source,
          bulb_count: fixture.bulb_count || 1,
          connected_fixtures: fixture.connected_fixtures || [],
          maintenance_history: []
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lighting-fixtures'] });
      toast({
        title: "Success",
        description: "Lighting fixture added successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    fixtures: fixtures || [],
    isLoading,
    addFixture: createMutation.mutateAsync,
    updateFixture: async () => {}, // Implement if needed
    deleteFixture: async () => {}, // Implement if needed
    isAdding: createMutation.isPending,
    isUpdating: false,
    isDeleting: false,
  };
}
