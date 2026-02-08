import { useQuery } from '@tanstack/react-query';
import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';

export interface CourtOperationsCounts {
  /** Number of court sessions scheduled for today */
  todaysSessions: number;
  /** Total upcoming/active sessions (scheduled or in_progress) */
  dailySessions: number;
  /** Number of assignments needing attention (incomplete staff, missing coverage) */
  assignmentsNeedingAttention: number;
  /** Number of high-priority maintenance issues */
  maintenanceIssues: number;
  /** Number of staff absences today without coverage */
  uncoveredAbsences: number;
  /** Tooltip descriptions for each count */
  tooltips: {
    todaysSessions: string;
    dailySessions: string;
    assignments: string;
    maintenance: string;
  };
  isLoading: boolean;
}

export function useCourtOperationsCounts(): CourtOperationsCounts {
  const today = format(new Date(), 'yyyy-MM-dd');

  // Count today's sessions
  const { data: todaysCount = 0 } = useQuery({
    queryKey: ['court-operations-todays-count', today],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('court_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('session_date', today);

      if (error) {
        logger.error('Error counting today sessions:', error);
        return 0;
      }

      return count || 0;
    },
    staleTime: 60000, // 1 minute
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
        logger.error('Error counting daily sessions:', error);
        return 0;
      }

      return count || 0;
    },
    staleTime: 60000,
  });

  // Count assignments needing attention (incomplete assignments)
  const { data: assignmentsData = { needAttention: 0, details: '' } } = useQuery({
    queryKey: ['court-operations-assignments-attention'],
    queryFn: async () => {
      // Get assignments missing required staff
      const { data: assignments, error } = await supabase
        .from('court_assignments')
        .select('id, justice, clerks, sergeant, room_number');

      if (error) {
        logger.error('Error fetching assignments:', error);
        return { needAttention: 0, details: '' };
      }

      // Count incomplete assignments
      let missingJudge = 0;
      let missingClerks = 0;
      let missingSgt = 0;

      assignments?.forEach(a => {
        if (!a.justice || a.justice.trim() === '') missingJudge++;
        if (!a.clerks || a.clerks.length === 0) missingClerks++;
        if (!a.sergeant || a.sergeant.trim() === '') missingSgt++;
      });

      const needAttention = missingJudge + missingClerks + missingSgt;
      
      const parts = [];
      if (missingJudge > 0) parts.push(`${missingJudge} missing judge`);
      if (missingClerks > 0) parts.push(`${missingClerks} missing clerk`);
      if (missingSgt > 0) parts.push(`${missingSgt} missing sergeant`);
      
      return { 
        needAttention,
        details: parts.length > 0 ? parts.join(', ') : 'All assignments complete'
      };
    },
    staleTime: 60000,
  });

  // Count uncovered absences
  const { data: uncoveredCount = 0 } = useQuery({
    queryKey: ['court-operations-uncovered-absences', today],
    queryFn: async () => {
      // Get today's absences
      const { data: absences, error: absError } = await supabase
        .from('staff_absences')
        .select('id, staff_id')
        .lte('starts_on', today)
        .gte('ends_on', today);

      if (absError || !absences) return 0;

      // Get today's coverage assignments
      const { data: coverages, error: covError } = await supabase
        .from('coverage_assignments')
        .select('absent_staff_id')
        .eq('coverage_date', today);

      if (covError) return 0;

      const coveredStaffIds = new Set(coverages?.map(c => c.absent_staff_id) || []);
      const uncovered = absences.filter(a => !coveredStaffIds.has(a.staff_id));

      return uncovered.length;
    },
    staleTime: 60000,
  });

  // Count maintenance issues affecting courts
  const { data: maintenanceCount = 0, isLoading } = useQuery({
    queryKey: ['court-operations-maintenance-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('issues')
        .select('*', { count: 'exact', head: true })
        .in('status', ['open', 'in_progress'])
        .eq('priority', 'high');

      if (error) {
        logger.error('Error counting maintenance issues:', error);
        return 0;
      }

      return count || 0;
    },
    staleTime: 60000,
  });

  return {
    todaysSessions: todaysCount,
    dailySessions: dailyCount,
    assignmentsNeedingAttention: assignmentsData.needAttention,
    maintenanceIssues: maintenanceCount,
    uncoveredAbsences: uncoveredCount,
    tooltips: {
      todaysSessions: `${todaysCount} sessions scheduled for today`,
      dailySessions: `${dailyCount} total scheduled or in-progress sessions`,
      assignments: assignmentsData.details,
      maintenance: `${maintenanceCount} high-priority issues`,
    },
    isLoading,
  };
}
