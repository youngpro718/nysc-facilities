
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { IssueTemplate, IssueType } from "../types/IssueTypes";

export function useIssueTemplate(type?: IssueType) {
  const { data: templates, isLoading } = useQuery({
    queryKey: ['issue-templates', type],
    queryFn: async () => {
      const query = supabase
        .from('issue_type_templates')
        .select('*')
        .order('template_order');

      if (type) {
        query.eq('type', type);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      
      // Transform the data to match our IssueTemplate type
      return (data as any[]).map(template => ({
        ...template,
        problem_types: template.problem_types || [],
        title_format: template.title_format || '[Problem Type] - [Location]'
      })) as IssueTemplate[];
    }
  });

  const generateTitle = (
    template: IssueTemplate,
    problemType: string,
    location: string
  ) => {
    if (!template.title_format) return `${template.subcategory} - ${location}`;
    
    return template.title_format
      .replace('[Problem Type]', problemType)
      .replace('[Location]', location);
  };

  return {
    templates,
    isLoading,
    generateTitle
  };
}
