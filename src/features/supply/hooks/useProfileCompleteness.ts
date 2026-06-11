import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useUserRoomAssignments } from '@features/spaces/hooks/useUserRoomAssignments';

export interface ProfileCompleteness {
  isLoading: boolean;
  isComplete: boolean;
  hasDepartment: boolean;
  hasHomeRoom: boolean;
  hasName: boolean;
  /** All issues phrased for user-facing copy. */
  missing: string[];
  department: string | null;
  homeRoomNumber: string | null;
}

/**
 * Tells callers whether the signed-in user's profile is complete enough
 * for downstream features like supply ordering. Used by the order form
 * to prompt people to fill in their department and home room so that
 * staff aren't routing orders with "not specified" all over them.
 */
export function useProfileCompleteness(userId?: string): ProfileCompleteness {
  const profileQuery = useQuery({
    queryKey: ['profileCompleteness', userId],
    enabled: !!userId,
    staleTime: 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, department, department_id')
        .eq('id', userId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: assignments = [], isLoading: assignmentsLoading } =
    useUserRoomAssignments(userId);

  const profile = profileQuery.data;
  const department = (profile?.department as string | null) ?? null;
  const hasDepartment = !!department?.trim() || !!profile?.department_id;
  const hasName = !!profile?.first_name?.trim() && !!profile?.last_name?.trim();

  const primary = assignments.find(a => a.is_primary);
  const firstRoom = assignments[0];
  const homeRoomNumber =
    primary?.rooms?.room_number || firstRoom?.rooms?.room_number || null;
  const hasHomeRoom = !!homeRoomNumber;

  const missing: string[] = [];
  if (!hasName) missing.push('your name');
  if (!hasDepartment) missing.push('your department');
  if (!hasHomeRoom) missing.push('your home room');

  return {
    isLoading: profileQuery.isLoading || assignmentsLoading,
    isComplete: missing.length === 0,
    hasDepartment,
    hasHomeRoom,
    hasName,
    missing,
    department,
    homeRoomNumber,
  };
}
