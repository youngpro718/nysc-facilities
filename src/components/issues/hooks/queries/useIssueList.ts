
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Issue } from "../../types/IssueTypes";
import { DatabaseIssue, transformIssue } from "../../utils/IssueTransformers";
import { isValidStatus, isValidPriority } from "../../utils/typeGuards";
import { PostgrestFilterBuilder } from "@supabase/postgrest-js";

type IssueQueryResponse = DatabaseIssue[];
type IssueQueryBuilder = PostgrestFilterBuilder<any, any, IssueQueryResponse>;

export const useIssueList = () => {
  return useQuery({
    queryKey: ['issues'],
    queryFn: async () => {
      const urlParams = new URLSearchParams(window.location.search);
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

      const typeFilter = urlParams.get('type');
      const statusFilter = urlParams.get('status');
      const priorityFilter = urlParams.get('priority');
      const assignmentFilter = urlParams.get('assigned_to');

      if (typeFilter && typeFilter !== 'all_types') {
        query = query.eq('type', typeFilter);
      }
      
      if (statusFilter && statusFilter !== 'all_statuses') {
        const validStatus = isValidStatus(statusFilter) ? statusFilter : undefined;
        if (validStatus) {
          query = query.eq('status', validStatus);
        }
      }
      
      if (priorityFilter && priorityFilter !== 'all_priorities') {
        const validPriority = isValidPriority(priorityFilter) ? priorityFilter : undefined;
        if (validPriority) {
          query = query.eq('priority', validPriority);
        }
      }

      if (assignmentFilter && assignmentFilter !== 'all_assignments') {
        query = query.eq('assigned_to', assignmentFilter);
      }

      if (typeFilter === 'LIGHTING') {
        const lightingType = urlParams.get('lightingType');
        const fixtureStatus = urlParams.get('fixtureStatus');
        const electricalIssue = urlParams.get('electricalIssue');

        if (lightingType && lightingType !== 'all_lighting_types') {
          query = query.contains('lighting_details', { fixture_type: lightingType });
        }
        
        if (fixtureStatus && fixtureStatus !== 'all_fixture_statuses') {
          query = query.contains('lighting_details', { fixture_status: fixtureStatus });
        }
        
        if (electricalIssue && electricalIssue !== 'all_electrical_issues') {
          query = query.contains('lighting_details->detected_issues', [electricalIssue]);
        }
      }

      const { data: queryData, error } = await query;

      if (error) throw error;
      
      return (queryData || []).map((item) => transformIssue(item as DatabaseIssue)) as Issue[];
    }
  });
};
