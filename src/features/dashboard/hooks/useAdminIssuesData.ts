import { useQuery } from "@tanstack/react-query";
import { logger } from '@/lib/logger';
import { supabase } from "@/lib/supabase";
import type { UserIssue } from "@/types/dashboard";
import { QUERY_CONFIG } from '@/config';

export interface IssueStats {
  total: number;
  open: number;
  in_progress: number;
  resolved: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  averageResolutionTime: number;
  todayReported: number;
  weekReported: number;
  roomsWithIssues: number;
}

export interface EnhancedIssue extends UserIssue {
  room_id?: string;
  reporter?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    title?: string;
  };
  room_occupants?: Array<{
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    is_primary: boolean;
  }>;
  comments_count?: number;
  last_activity?: string;
  resolution_time?: number;
  similar_issues_count?: number;
}

const PAGE_SIZE = 50;

export const useAdminIssuesData = (page = 0) => {
  // Paginated issues list — fetches one page at a time instead of 500 rows
  const { data: allIssues = [], isLoading, refetch } = useQuery({
    queryKey: ['adminIssues', page],
    queryFn: async (): Promise<EnhancedIssue[]> => {
      try {
        const from = page * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        const { data, error } = await supabase
          .from('issues')
          .select(`
            id, title, description, status, priority,
            created_at, updated_at, building_id, room_id,
            seen, issue_type, assigned_to, photos,
            reported_by, created_by,
            rooms:room_id (
              id,
              name,
              room_number
            ),
            buildings:building_id (
              name
            ),
            floors:floor_id (
              name
            )
          `)
          .order('created_at', { ascending: false })
          .range(from, to);

        if (error) throw error;

        // Batch-fetch reporter profiles (at most PAGE_SIZE unique IDs)
        const reporterIds = [...new Set(
          (data || [])
            .map(issue => issue.reported_by || issue.created_by)
            .filter(Boolean)
        )] as string[];

        let reporterMap = new Map<string, { id: string; first_name: string; last_name: string; email: string; title?: string }>();
        if (reporterIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, email, title')
            .in('id', reporterIds);
          if (profiles) {
            for (const p of profiles) {
              reporterMap.set(p.id, p);
            }
          }
        }

        return (data || []).map(issue => {
          const reporterId = issue.reported_by || issue.created_by;
          return {
            ...issue,
            reporter: reporterId ? (reporterMap.get(reporterId) || null) : null,
            room_occupants: [],
            comments_count: 0,
            last_activity: issue.updated_at || issue.created_at,
          };
        }) as EnhancedIssue[];
      } catch (error) {
        logger.warn('Error fetching admin issues:', error);
        throw error;
      }
    },
    staleTime: QUERY_CONFIG.stale.realtime,
    refetchInterval: false,
  });

  // Separate stats query — server aggregates counts, avoids sending rows to client
  const { data: issueStats = defaultStats } = useQuery({
    queryKey: ['adminIssueStats'],
    queryFn: async (): Promise<IssueStats> => {
      try {
        const { data, error } = await supabase.rpc('get_issue_stats');
        if (error) throw error;
        return {
          total:               data.total        ?? 0,
          open:                data.open         ?? 0,
          in_progress:         data.in_progress  ?? 0,
          resolved:            data.resolved     ?? 0,
          critical:            data.critical     ?? 0,
          high:                data.high         ?? 0,
          medium:              data.medium       ?? 0,
          low:                 data.low          ?? 0,
          averageResolutionTime: 0,
          todayReported:       data.today        ?? 0,
          weekReported:        data.this_week    ?? 0,
          roomsWithIssues:     data.rooms_affected ?? 0,
        };
      } catch (error) {
        logger.warn('Error fetching issue stats:', error);
        return defaultStats;
      }
    },
    staleTime: QUERY_CONFIG.stale.realtime,
    refetchInterval: false,
  });

  // Critical issues on the current page (high priority + active)
  const criticalIssues = allIssues.filter(
    issue => issue.priority === 'high' && ['open', 'in_progress'].includes(issue.status)
  );

  return {
    allIssues,
    criticalIssues,
    issueStats,
    isLoading,
    refreshData: refetch,
  };
};

const defaultStats: IssueStats = {
  total: 0,
  open: 0,
  in_progress: 0,
  resolved: 0,
  critical: 0,
  high: 0,
  medium: 0,
  low: 0,
  averageResolutionTime: 0,
  todayReported: 0,
  weekReported: 0,
  roomsWithIssues: 0,
};
