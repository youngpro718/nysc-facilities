
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
      return data as LightingFixture[];
    }
  });

  const createMutation = useMutation({
    mutationFn: async (fixture: Omit<LightingFixture, 'id'>) => {
      const { data, error } = await supabase
        .from('lighting_fixtures')
        .insert([{ ...fixture, space_id: spaceId }])
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

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<LightingFixture> & { id: string }) => {
      const { error } = await supabase
        .from('lighting_fixtures')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lighting-fixtures', spaceId] });
      toast({
        title: "Success",
        description: "Lighting fixture updated successfully",
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

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('lighting_fixtures')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lighting-fixtures', spaceId] });
      toast({
        title: "Success",
        description: "Lighting fixture deleted successfully",
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
    fixtures,
    isLoading,
    addFixture: createMutation.mutateAsync,
    updateFixture: updateMutation.mutateAsync,
    deleteFixture: deleteMutation.mutateAsync,
    isAdding: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
