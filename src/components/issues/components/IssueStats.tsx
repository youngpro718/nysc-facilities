
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface IssueStats {
  total: number;
  active: number;
  resolved: number;
  high_priority: number;
}

export const IssueStats = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['issue-stats'],
    queryFn: async (): Promise<IssueStats> => {
      const { data, error } = await supabase
        .from('issues')
        .select('status, priority')
        .returns<{ status: string; priority: string }[]>();

      if (error) throw error;

      const summary = {
        total: data.length,
        active: data.filter(issue => issue.status !== 'resolved').length,
        resolved: data.filter(issue => issue.status === 'resolved').length,
        high_priority: data.filter(issue => issue.priority === 'high').length,
      };

      return summary;
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="bg-muted/50 rounded-lg p-4">
        <div className="text-sm font-medium text-muted-foreground mb-1">Total Issues</div>
        <div className="text-2xl font-bold">{stats.total}</div>
      </div>
      <div className="bg-muted/50 rounded-lg p-4">
        <div className="text-sm font-medium text-muted-foreground mb-1">Active Issues</div>
        <div className="text-2xl font-bold text-orange-500">{stats.active}</div>
      </div>
      <div className="bg-muted/50 rounded-lg p-4">
        <div className="text-sm font-medium text-muted-foreground mb-1">Resolved Issues</div>
        <div className="text-2xl font-bold text-green-500">{stats.resolved}</div>
      </div>
      <div className="bg-muted/50 rounded-lg p-4">
        <div className="text-sm font-medium text-muted-foreground mb-1">High Priority</div>
        <div className="text-2xl font-bold text-red-500">{stats.high_priority}</div>
      </div>
    </div>
  );
};
