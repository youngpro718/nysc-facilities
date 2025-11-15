
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Issue } from '../../types/IssueTypes';
import { IssueFilters } from '../../types/FilterTypes';
import { transformIssue, DatabaseIssue } from '../../utils/IssueTransformers';
import { PostgrestFilterBuilder } from "@supabase/postgrest-js";

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
  }, {} as Record<string, any>);

  return ['issues', activeFilters, searchQuery];
}

export function useIssueList(filters: IssueFilters, searchQuery?: string) {
  return useQuery({
    queryKey: buildQueryKey(filters, searchQuery),
    queryFn: async (): Promise<QueryResponse> => {
      try {
        console.log('Building query with filters:', JSON.stringify(filters, null, 2));
        let query = supabase
          .from('issues')
          .select(`
            *,
            buildings:building_id (name),
            floors:floor_id (name),
            rooms:room_id (name)
          `) as any;

        // Apply filters
        if (filters.type && filters.type !== 'all_types') {
          console.log('Applying type filter:', filters.type);
          query = query.eq('issue_type', filters.type);
        }

        if (filters.status && filters.status !== 'all_statuses') {
          console.log('Applying status filter:', filters.status);
          if (Array.isArray(filters.status)) {
            query = query.in('status', filters.status);
          } else {
            query = query.eq('status', filters.status);
          }
        }

        if (filters.priority && filters.priority !== 'all_priorities') {
          console.log('Applying priority filter:', filters.priority);
          query = query.eq('priority', filters.priority);
        }

        // Handle assignment filters
        if (filters.assignedToMe) {
          console.log('Applying assignedToMe filter');
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            console.log('Found user ID for assignedToMe:', user.id);
            query = query.eq('assignee_id', user.id);
          } else {
            console.log('No user found for assignedToMe filter');
          }
        } else if (filters.assigned_to && filters.assigned_to !== 'all_assignments') {
          console.log('Applying assigned_to filter:', filters.assigned_to);
          if (filters.assigned_to === 'Self') {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              console.log('Found user ID for Self assignment:', user.id);
              query = query.eq('assignee_id', user.id);
            } else {
              console.log('No user found for Self assignment');
            }
          } else {
            query = query.eq('assigned_to', filters.assigned_to);
          }
        }

        // Apply lighting-specific filters
        if (filters.lightingType && filters.lightingType !== 'all_lighting_types') {
          console.log('Applying lighting type filter:', filters.lightingType);
          query = query.contains('lighting_fixtures', [{ type: filters.lightingType }]);
        }

        if (filters.fixtureStatus && filters.fixtureStatus !== 'all_fixture_statuses') {
          console.log('Applying fixture status filter:', filters.fixtureStatus);
          query = query.contains('lighting_fixtures', [{ status: filters.fixtureStatus }]);
        }

        if (filters.electricalIssue && filters.electricalIssue !== 'all_electrical_issues') {
          console.log('Applying electrical issue filter:', filters.electricalIssue);
          query = query.contains('lighting_fixtures', [{
            electrical_issues: { [filters.electricalIssue]: true }
          }]);
        }

        if (filters.hasOverdue) {
          console.log('Applying overdue filter');
          const now = new Date().toISOString();
          query = query.lt('due_date', now);
        }

        // Apply search query
        if (searchQuery?.trim()) {
          console.log('Applying search query:', searchQuery);
          query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
        }

        // Apply sorting
        if (filters.sortBy) {
          const order = filters.order || 'desc';
          console.log('Applying sort:', filters.sortBy, order);
          query = query.order(filters.sortBy, { ascending: order === 'asc' });
        } else {
          query = query.order('created_at', { ascending: false });
        }

        console.log('Executing query...');
        const { data, error } = await query;
        console.log('Query result - data length:', data?.length);
        console.log('Query result - error:', error);

        if (error) {
          console.error('Error fetching issues:', error);
          throw error;
        }

        return {
          data: data?.map(issue => transformIssue(issue)) || [],
          error: null,
        };
      } catch (error) {
        console.error('Error in useIssueList:', error);
        return {
          data: null,
          error: error as Error,
        };
      }
    },
    staleTime: 30000, // Consider data fresh for 30 seconds
    retry: 2, // Retry failed requests twice
  });
}
