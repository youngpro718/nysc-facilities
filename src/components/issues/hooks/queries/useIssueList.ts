import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Issue } from '../../types/IssueTypes';
import { IssueFilters } from '../../types/FilterTypes';
import { transformIssue } from '../../utils/IssueTransformers';

type QueryResponse = {
  data: Issue[] | null;
  error: Error | null;
};

function buildQueryKey(filters: IssueFilters, searchQuery?: string) {
  const activeFilters = Object.entries(filters).reduce((acc, [key, value]) => {
    if (value !== undefined && value !== null && value !== '' && value !== 'all_assignments' && !key.includes('all_')) {
      acc[key] = value;
    }
    return acc;
  }, {} as Record<string, unknown>);

  return ['issues', activeFilters, searchQuery];
}

export function useIssueList(filters: IssueFilters, searchQuery?: string) {
  return useQuery({
    queryKey: buildQueryKey(filters, searchQuery),
    queryFn: async (): Promise<QueryResponse> => {
      try {
        let query = supabase
          .from('issues')
          .select(`
            *,
            buildings:building_id (name),
            floors:floor_id (name),
            rooms:room_id (name)
          `);

        // Apply filters
        if (filters.type && filters.type !== 'all_types') {
          query = query.eq('issue_type', filters.type);
        }

        if (filters.status && filters.status !== 'all_statuses') {
          if (Array.isArray(filters.status)) {
            query = query.in('status', filters.status);
          } else {
            query = query.eq('status', filters.status);
          }
        }

        if (filters.priority && filters.priority !== 'all_priorities') {
          query = query.eq('priority', filters.priority);
        }

        // Handle assignment filters
        if (filters.assignedToMe) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            query = query.eq('assignee_id', user.id);
          }
        } else if (filters.assigned_to && filters.assigned_to !== 'all_assignments') {
          if (filters.assigned_to === 'Self') {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              query = query.eq('assignee_id', user.id);
            }
          } else {
            query = query.eq('assigned_to', filters.assigned_to);
          }
        }

        // Apply lighting-specific filters
        if (filters.lightingType && filters.lightingType !== 'all_lighting_types') {
          query = query.contains('lighting_fixtures', [{ type: filters.lightingType }]);
        }

        if (filters.fixtureStatus && filters.fixtureStatus !== 'all_fixture_statuses') {
          query = query.contains('lighting_fixtures', [{ status: filters.fixtureStatus }]);
        }

        if (filters.electricalIssue && filters.electricalIssue !== 'all_electrical_issues') {
          query = query.contains('lighting_fixtures', [{
            electrical_issues: { [filters.electricalIssue]: true }
          }]);
        }

        if (filters.hasOverdue) {
          const now = new Date().toISOString();
          query = query.lt('due_date', now);
        }

        // Apply search query
        if (searchQuery?.trim()) {
          query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
        }

        // Apply sorting
        if (filters.sortBy) {
          const order = filters.order || 'desc';
          query = query.order(filters.sortBy, { ascending: order === 'asc' });
        } else {
          query = query.order('created_at', { ascending: false });
        }

        const { data, error } = await query;

        if (error) throw error;

        return {
          data: data?.map(issue => transformIssue(issue)) || [],
          error: null,
        };
      } catch (error) {
        return {
          data: null,
          error: error as Error,
        };
      }
    },
    staleTime: 30000,
    retry: 2,
  });
}
