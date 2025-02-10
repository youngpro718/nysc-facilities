
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { type IssueFiltersType, type SortOption, type GroupingOption } from "../types/FilterTypes";
import { type Issue } from "../types/IssueTypes";

export type GroupedIssues = {
  grouped: Record<string, Issue[]>;
  grouping: GroupingOption;
}

export const useIssueData = (
  filters: IssueFiltersType,
  sort: SortOption,
  grouping: GroupingOption
) => {
  return useQuery<GroupedIssues>({
    queryKey: ['issues', filters, sort, grouping],
    queryFn: async () => {
      try {
        let query = supabase
          .from('issues')
          .select(`
            *,
            buildings:building_id(name),
            floors:floor_id(name),
            rooms:room_id(name)
          `)
          .order(sort.field, { ascending: sort.direction === 'asc' });

        // For enum type, use eq instead of ilike
        if (filters.type && filters.type !== 'all_types') {
          query = query.eq('type', filters.type);
        }
        if (filters.status && filters.status !== 'all_statuses') {
          query = query.eq('status', filters.status);
        }
        if (filters.priority && filters.priority !== 'all_priorities') {
          query = query.eq('priority', filters.priority);
        }
        if (filters.assigned_to && filters.assigned_to !== 'all_assignments') {
          query = query.eq('assigned_to', filters.assigned_to);
        }

        const { data: issuesData, error: issuesError } = await query;
        
        if (issuesError) {
          if (issuesError.code === '503') {
            toast.error('Service temporarily unavailable. Please try again in a few moments.');
          } else if (issuesError.code === 'PGRST116') {
            toast.error('Database connection error. Please try again.');
          } else {
            toast.error(issuesError.message || 'Failed to fetch issues');
          }
          throw issuesError;
        }

        const transformedIssues = (issuesData || []).map((issue: any) => ({
          ...issue,
          buildingName: issue.buildings?.name,
          floorName: issue.floors?.name,
          roomName: issue.rooms?.name,
          status_history: Array.isArray(issue.status_history) 
            ? issue.status_history.map((history: any) => ({
                status: history.status,
                changed_at: history.changed_at,
                previous_status: history.previous_status
              }))
            : null
        }));

        if (grouping === 'building') {
          const grouped = transformedIssues.reduce((acc, issue) => {
            const key = issue.buildingName || 'Unassigned';
            if (!acc[key]) acc[key] = [];
            acc[key].push(issue);
            return acc;
          }, {} as Record<string, Issue[]>);
          return { grouped, grouping };
        } else if (grouping === 'floor') {
          const grouped = transformedIssues.reduce((acc, issue) => {
            const key = issue.floorName || 'Unassigned';
            if (!acc[key]) acc[key] = [];
            acc[key].push(issue);
            return acc;
          }, {} as Record<string, Issue[]>);
          return { grouped, grouping };
        }

        return { 
          grouped: { 'All Issues': transformedIssues }, 
          grouping: 'none' 
        };
      } catch (error: any) {
        if (error.code === 20 || error.name === 'AbortError') {
          toast.error('Network connection error. Please check your internet connection.');
        } else if (error.name === 'TimeoutError') {
          toast.error('Request timed out. Please try again.');
        } else {
          toast.error(error.message || "Failed to fetch issues");
        }
        throw error;
      }
    },
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 30000,
  });
};
