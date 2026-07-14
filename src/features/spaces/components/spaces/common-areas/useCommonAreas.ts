import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/errorUtils';
import type { CommonAreaInput } from './types';
import {
  createCommonArea,
  deleteCommonArea,
  fetchCommonAreas,
  updateCommonArea,
} from '../services/commonAreas';

interface CommonAreasFilters {
  buildingId?: string;
  floorId?: string;
}

export function useCommonAreas({ buildingId, floorId }: CommonAreasFilters = {}) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['common-areas', buildingId ?? 'all', floorId ?? 'all'],
    queryFn: () => fetchCommonAreas(buildingId, floorId),
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['common-areas'] });

  const createArea = useMutation({
    mutationFn: (input: CommonAreaInput) => createCommonArea(input),
    onSuccess: () => {
      toast.success('Common area created');
      refresh();
    },
    onError: (error: unknown) => {
      toast.error('Failed to create common area', { description: getErrorMessage(error) });
    },
  });

  const updateArea = useMutation({
    mutationFn: ({ id, input }: { id: string; input: CommonAreaInput }) => updateCommonArea(id, input),
    onSuccess: () => {
      toast.success('Common area updated');
      refresh();
    },
    onError: (error: unknown) => {
      toast.error('Failed to update common area', { description: getErrorMessage(error) });
    },
  });

  const deleteArea = useMutation({
    mutationFn: (id: string) => deleteCommonArea(id),
    onSuccess: () => {
      toast.success('Common area deleted');
      refresh();
    },
    onError: (error: unknown) => {
      toast.error('Failed to delete common area', { description: getErrorMessage(error) });
    },
  });

  return { ...query, createArea, updateArea, deleteArea };
}
