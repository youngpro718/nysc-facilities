
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getErrorMessage } from "@/lib/errorUtils";
import { toast } from "sonner";
import { LightStatus } from "@/types/lighting";
import {
  fetchLightingFixtures,
  supabase
} from "@/lib/supabase";

const deleteLightingFixture = async (id: string) => {
  const { error } = await supabase
    .from('lighting_fixtures')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
  return true;
};

const deleteLightingFixtures = async (fixtureIds: string[]) => {
  const { error } = await supabase
    .from('lighting_fixtures')
    .delete()
    .in('id', fixtureIds);
  
  if (error) throw error;
  return true;
};

const updateLightingFixturesStatus = async (fixtureIds: string[], status: LightStatus) => {
  const { error } = await supabase
    .from('lighting_fixtures')
    .update({ status })
    .in('id', fixtureIds);
  
  if (error) throw error;
  return true;
};

export function useLightingFixtures() {
  const queryClient = useQueryClient();

  const { data: fixtures, isLoading } = useQuery({
    queryKey: ['lighting-fixtures'],
    queryFn: fetchLightingFixtures,
  });

  const handleDelete = async (id: string) => {
    try {
      await deleteLightingFixture(id);
      toast.success("Lighting fixture deleted successfully");
      queryClient.invalidateQueries({ queryKey: ['lighting-fixtures'] });
      return true;
    } catch (error) {
      toast.error(getErrorMessage(error) || "Failed to delete lighting fixture");
      return false;
    }
  };

  const handleBulkDelete = async (selectedFixtures: string[]) => {
    try {
      await deleteLightingFixtures(selectedFixtures);
      toast.success(`${selectedFixtures.length} fixtures deleted successfully`);
      queryClient.invalidateQueries({ queryKey: ['lighting-fixtures'] });
      return true;
    } catch (error) {
      toast.error(getErrorMessage(error) || "Failed to delete fixtures");
      return false;
    }
  };

  const handleBulkStatusUpdate = async (fixtureIds: string[], status: LightStatus) => {
    try {
      await updateLightingFixturesStatus(fixtureIds, status);
      toast.success(`Updated status for ${fixtureIds.length} fixtures`);
      queryClient.invalidateQueries({ queryKey: ['lighting-fixtures'] });
      return true;
    } catch (error) {
      toast.error(getErrorMessage(error) || "Failed to update fixtures status");
      return false;
    }
  };

  return {
    fixtures: fixtures || [],
    isLoading,
    handleDelete,
    handleBulkDelete,
    handleBulkStatusUpdate,
    refetch: () => queryClient.invalidateQueries({ queryKey: ['lighting-fixtures'] })
  };
}

