
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { LightStatus } from '@/types/lighting';
import { 
  fetchLightingFixtures, 
  deleteLightingFixture, 
  deleteLightingFixtures, 
  updateLightingFixturesStatus 
} from '@/services/supabase/lightingService';

export function useLightingFixtures() {
  const queryClient = useQueryClient();

  const { data: fixtures, isLoading, isFetching, dataUpdatedAt } = useQuery({
    queryKey: ['lighting-fixtures'],
    queryFn: fetchLightingFixtures,
    staleTime: 30_000,
    // keep previous data visible during background refetches
    placeholderData: (prev) => prev
  });

  const handleDelete = async (id: string) => {
    try {
      await deleteLightingFixture(id);
      toast.success("Lighting fixture deleted successfully");
      queryClient.invalidateQueries({ queryKey: ['lighting-fixtures'] });
      queryClient.invalidateQueries({ queryKey: ['room-lighting-stats'] });
      return true;
    } catch (error: any) {
      toast.error(error.message || "Failed to delete lighting fixture");
      return false;
    }
  };

  const handleBulkDelete = async (selectedFixtures: string[]) => {
    try {
      await deleteLightingFixtures(selectedFixtures);
      toast.success(`${selectedFixtures.length} fixtures deleted successfully`);
      queryClient.invalidateQueries({ queryKey: ['lighting-fixtures'] });
      queryClient.invalidateQueries({ queryKey: ['room-lighting-stats'] });
      return true;
    } catch (error: any) {
      toast.error(error.message || "Failed to delete fixtures");
      return false;
    }
  };

  const handleBulkStatusUpdate = async (fixtureIds: string[], status: LightStatus) => {
    try {
      await updateLightingFixturesStatus(fixtureIds, status);
      toast.success(`Updated status for ${fixtureIds.length} fixtures`);
      queryClient.invalidateQueries({ queryKey: ['lighting-fixtures'] });
      queryClient.invalidateQueries({ queryKey: ['room-lighting-stats'] });
      return true;
    } catch (error: any) {
      toast.error(error.message || "Failed to update fixtures status");
      return false;
    }
  };

  return {
    fixtures: fixtures || [],
    isLoading,
    isFetching,
    lastUpdated: dataUpdatedAt ? new Date(dataUpdatedAt) : null,
    handleDelete,
    handleBulkDelete,
    handleBulkStatusUpdate,
    refetch: () => {
      queryClient.invalidateQueries({ queryKey: ['lighting-fixtures'] });
      queryClient.invalidateQueries({ queryKey: ['room-lighting-stats'] });
    }
  };
}

