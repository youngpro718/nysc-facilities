
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface LightingFixture {
  id: string;
  name: string;
  type: string;
  status: string;
  location: string;
  zone_id?: string;
  maintenance_history?: MaintenanceRecord[];
}

interface MaintenanceRecord {
  id: string;
  date: string;
  type: string;
  notes: string;
}

export function useLightingFixtures(spaceId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: fixtures, isLoading } = useQuery({
    queryKey: ['lighting-fixtures', spaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lighting_fixtures')
        .select('*')
        .eq('space_id', spaceId);

      if (error) throw error;
      
      // Transform the data to match our LightingFixture type
      return (data as any[]).map(fixture => ({
        id: fixture.id,
        name: fixture.name,
        type: fixture.type,
        status: fixture.status,
        location: fixture.space_type || 'unknown',
        zone_id: fixture.zone_id,
        maintenance_history: fixture.maintenance_history || []
      })) as LightingFixture[];
    }
  });

  const createMutation = useMutation({
    mutationFn: async (fixture: Omit<LightingFixture, 'id'>) => {
      const { data, error } = await supabase
        .from('lighting_fixtures')
        .insert([{ 
          name: fixture.name,
          type: fixture.type,
          status: fixture.status,
          space_type: fixture.location,
          zone_id: fixture.zone_id,
          space_id: spaceId
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lighting-fixtures', spaceId] });
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
