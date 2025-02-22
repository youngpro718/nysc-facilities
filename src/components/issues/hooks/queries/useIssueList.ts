
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Issue } from "../../types/IssueTypes";
import { DatabaseIssue, transformIssue } from "../../utils/IssueTransformers";
import { isValidStatus, isValidPriority } from "../../utils/typeGuards";
import { PostgrestFilterBuilder } from "@supabase/postgrest-js";
import { IssueFiltersType } from "../../types/FilterTypes";

type IssueQueryResponse = DatabaseIssue[];
type IssueQueryBuilder = PostgrestFilterBuilder<any, any, IssueQueryResponse>;

export const useIssueList = (filters: IssueFiltersType) => {
  return useQuery({
    queryKey: ['issues', filters],
    queryFn: async () => {
      let query: IssueQueryBuilder = supabase
        .from('issues')
        .select(`
          id,
          title,
          description,
          type,
          status,
          priority,
          created_at,
          updated_at,
          photos,
          seen,
          buildings(name),
          floors(name),
          rooms(name),
          lighting_fixtures(
            name,
            type,
            status,
            position,
            electrical_issues
          )
        `)
        .order('created_at', { ascending: false });

      if (filters.type && filters.type !== 'all_types') {
        query = query.eq('type', filters.type);
      }
      
      if (filters.status && filters.status !== 'all_statuses') {
        const validStatus = isValidStatus(filters.status) ? filters.status : undefined;
        if (validStatus) {
          query = query.eq('status', validStatus);
        }
      }
      
      if (filters.priority && filters.priority !== 'all_priorities') {
        const validPriority = isValidPriority(filters.priority) ? filters.priority : undefined;
        if (validPriority) {
          query = query.eq('priority', validPriority);
        }
      }

      if (filters.assigned_to && filters.assigned_to !== 'all_assignments') {
        query = query.eq('assigned_to', filters.assigned_to);
      }

      if (filters.type === 'LIGHTING') {
        if (filters.lightingType && filters.lightingType !== 'all_lighting_types') {
          query = query.contains('lighting_details', { fixture_type: filters.lightingType });
        }
        
        if (filters.fixtureStatus && filters.fixtureStatus !== 'all_fixture_statuses') {
          query = query.contains('lighting_details', { fixture_status: filters.fixtureStatus });
        }
        
        if (filters.electricalIssue && filters.electricalIssue !== 'all_electrical_issues') {
          query = query.contains('lighting_details->detected_issues', [filters.electricalIssue]);
        }
      }

      const { data: queryData, error } = await query;

      if (error) throw error;
      
      return (queryData || []).map((item) => transformIssue(item as DatabaseIssue)) as Issue[];
    }
  });
};

