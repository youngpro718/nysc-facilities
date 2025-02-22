
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Issue } from "../../types/IssueTypes";
import { DatabaseIssue, transformIssue } from "../../utils/IssueTransformers";
import { isValidStatus, isValidPriority } from "../../utils/typeGuards";
import { PostgrestFilterBuilder } from "@supabase/postgrest-js";
import { IssueFiltersType } from "../../types/FilterTypes";

type IssueQueryResponse = DatabaseIssue[];
type IssueQueryBuilder = PostgrestFilterBuilder<any, any, IssueQueryResponse>;

export const useIssueList = (filters: IssueFiltersType, searchQuery: string) => {
  return useQuery({
    queryKey: ['issues', filters, searchQuery],
    queryFn: async () => {
      console.log("Executing query with filters:", filters);
      console.log("Search query:", searchQuery);

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

      // Apply text search if provided
      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }

      // Apply type filter
      if (filters.type && filters.type !== 'all_types') {
        console.log("Applying type filter:", filters.type);
        query = query.eq('type', filters.type);
      }

      // Apply status filter
      if (filters.status && filters.status !== 'all_statuses') {
        const validStatus = isValidStatus(filters.status) ? filters.status : undefined;
        if (validStatus) {
          console.log("Applying status filter:", validStatus);
          query = query.eq('status', validStatus);
        }
      }

      // Apply priority filter
      if (filters.priority && filters.priority !== 'all_priorities') {
        const validPriority = isValidPriority(filters.priority) ? filters.priority : undefined;
        if (validPriority) {
          console.log("Applying priority filter:", validPriority);
          query = query.eq('priority', validPriority);
        }
      }

      // Apply assignment filter
      if (filters.assigned_to && filters.assigned_to !== 'all_assignments') {
        console.log("Applying assignment filter:", filters.assigned_to);
        query = query.eq('assigned_to', filters.assigned_to);
      }

      // Apply lighting-specific filters only for lighting issues
      if (filters.type === 'LIGHTING') {
        if (filters.lightingType && filters.lightingType !== 'all_lighting_types') {
          console.log("Applying lighting type filter:", filters.lightingType);
          query = query.contains('lighting_details', { fixture_type: filters.lightingType });
        }
        
        if (filters.fixtureStatus && filters.fixtureStatus !== 'all_fixture_statuses') {
          console.log("Applying fixture status filter:", filters.fixtureStatus);
          query = query.contains('lighting_details', { fixture_status: filters.fixtureStatus });
        }
        
        if (filters.electricalIssue && filters.electricalIssue !== 'all_electrical_issues') {
          console.log("Applying electrical issue filter:", filters.electricalIssue);
          query = query.contains('lighting_details->detected_issues', [filters.electricalIssue]);
        }
      }

      const { data: queryData, error } = await query;

      if (error) {
        console.error("Query error:", error);
        throw error;
      }

      console.log("Query results:", queryData);
      
      return (queryData || []).map((item) => transformIssue(item as DatabaseIssue)) as Issue[];
    }
  });
};
