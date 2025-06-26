
import { supabase } from "@/integrations/supabase/client";

interface IssueReportData {
  type: string;
  location: string;
  description: string;
  user_id: string;
}

export const issueReportService = {
  async submitIssueReport(data: IssueReportData) {
    try {
      const issueData = {
        type: data.type as any, // This will need proper type casting
        title: `Issue Report: ${data.type}`,
        location: data.location,
        description: data.description,
        created_by: data.user_id,
        status: 'open' as const,
        priority: 'medium' as const
      };

      const { data: issue, error } = await supabase
        .from('issues')
        .insert([issueData])
        .select()
        .single();

      if (error) throw error;
      return issue;
    } catch (error) {
      console.error('Error submitting issue report:', error);
      throw error;
    }
  }
};
