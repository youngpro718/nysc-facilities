import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { UserIssue } from "@/types/dashboard";

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

export const useAdminIssuesData = () => {
  const { data: allIssues = [], isLoading, refetch } = useQuery({
    queryKey: ['adminIssues'],
    queryFn: async (): Promise<EnhancedIssue[]> => {
      try {
        // OPTIMIZED: Single query with available joins
        const { data, error } = await supabase
          .from('issues')
          .select(`
            *,
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
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        // Map to enhanced issues format (reporter info skipped for performance)
        const enhancedIssues: EnhancedIssue[] = (data || []).map(issue => ({
          ...issue,
          reporter: null, // Skip reporter for performance - no FK relationship
          room_occupants: [], // Skip occupants for performance - can be loaded on-demand
          comments_count: 0, // Skip comments count for performance - can be loaded on-demand
          last_activity: issue.updated_at || issue.created_at,
        }));

        return enhancedIssues;
      } catch (error) {
        console.error('Error fetching admin issues:', error);
        throw error;
      }
    },
    staleTime: 30000,
    refetchInterval: false, // Disabled - use manual refresh button instead
  });

  // Calculate statistics
  const issueStats: IssueStats = {
    total: allIssues?.length || 0,
    open: allIssues?.filter(issue => issue.status === 'open').length || 0,
    in_progress: allIssues?.filter(issue => issue.status === 'in_progress').length || 0,
    resolved: allIssues?.filter(issue => issue.status === 'resolved').length || 0,
    critical:
      allIssues?.filter((issue) => {
        const p = String(issue.priority || '').toLowerCase();
        const isCriticalPriority = ['high'].includes(p);
        const isActive = ['open', 'in_progress'].includes(issue.status);
        return isCriticalPriority && isActive;
      }).length || 0,
    high: allIssues?.filter(issue => issue.priority === 'high').length || 0,
    medium: allIssues?.filter(issue => issue.priority === 'medium').length || 0,
    low: allIssues?.filter(issue => issue.priority === 'low').length || 0,
    averageResolutionTime: 0, // TODO: Calculate from resolved issues
    todayReported: allIssues?.filter(issue => {
      const today = new Date().toDateString();
      return new Date(issue.created_at).toDateString() === today;
    }).length || 0,
    weekReported: allIssues?.filter(issue => {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return new Date(issue.created_at) > weekAgo;
    }).length || 0,
    roomsWithIssues: new Set(
      allIssues?.filter(issue => issue.room_id).map(issue => issue.room_id as string)
    ).size || 0,
  };

  // Critical issues (high priority and open/in_progress)
  const criticalIssues = allIssues?.filter(
    issue => issue.priority === 'high' && ['open', 'in_progress'].includes(issue.status)
  ) || [];

  return {
    allIssues,
    criticalIssues,
    issueStats,
    isLoading,
    refreshData: refetch,
  };
};