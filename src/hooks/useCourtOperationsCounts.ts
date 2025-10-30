import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface CourtOperationsCounts {
  todaysSessions: number;
  dailySessions: number;
  assignments: number;
  maintenanceIssues: number;
  isLoading: boolean;
}

export function useCourtOperationsCounts(): CourtOperationsCounts {
  // Count today's sessions
  const { data: todaysCount = 0 } = useQuery({
    queryKey: ['court-operations-todays-count'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      
      const { count, error } = await supabase
        .from('court_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('session_date', today);

      if (error) {
        console.error('Error counting today sessions:', error);
        return 0;
      }

      return count || 0;
    },
    refetchInterval: 60000, // Refresh every minute
  });

  // Count daily sessions (upcoming/active)
  const { data: dailyCount = 0 } = useQuery({
    queryKey: ['court-operations-daily-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('court_sessions')
        .select('*', { count: 'exact', head: true })
        .in('status', ['scheduled', 'in_progress']);

      if (error) {
        console.error('Error counting daily sessions:', error);
        return 0;
      }

      return count || 0;
    },
    refetchInterval: 60000,
  });

  // Count assignments needing attention (rooms without assignments or incomplete)
  const { data: assignmentsCount = 0 } = useQuery({
    queryKey: ['court-operations-assignments-count'],
    queryFn: async () => {
      // Get total court rooms
      const { count: totalRooms, error: roomsError } = await supabase
        .from('court_rooms')
        .select('*', { count: 'exact', head: true });

      if (roomsError) {
        console.error('Error counting rooms:', roomsError);
        return 0;
      }

      // Get rooms with assignments
      const { count: assignedRooms, error: assignmentsError } = await supabase
        .from('court_assignments')
        .select('*', { count: 'exact', head: true });

      if (assignmentsError) {
        console.error('Error counting assignments:', assignmentsError);
        return 0;
      }

      // Return count of unassigned rooms
      return (totalRooms || 0) - (assignedRooms || 0);
    },
    refetchInterval: 60000,
  });

  // Count maintenance issues affecting courts
  const { data: maintenanceCount = 0, isLoading } = useQuery({
    queryKey: ['court-operations-maintenance-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('issues')
        .select('*', { count: 'exact', head: true })
        .in('status', ['open', 'in_progress'])
        .in('priority', ['high']);

      if (error) {
        console.error('Error counting maintenance issues:', error);
        return 0;
      }

      return count || 0;
    },
    refetchInterval: 60000,
  });

  return {
    todaysSessions: todaysCount,
    dailySessions: dailyCount,
    assignments: assignmentsCount,
    maintenanceIssues: maintenanceCount,
    isLoading,
  };
}
