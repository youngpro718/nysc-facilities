
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { AlertCircle, Clock, CheckCircle2, Activity } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type IssueStats = {
  total_open: number;
  high_priority: number;
  overdue: number;
  avg_resolution_time: string;
};

export const IssueStatsBanner = () => {
  const { data: stats } = useQuery<IssueStats>({
    queryKey: ['issue-stats'],
    queryFn: async () => {
      const { data: issuesData, error } = await supabase
        .from('issues')
        .select('status, priority, due_date, resolution_time');
      
      if (error) throw error;

      const now = new Date();
      const stats = {
        total_open: 0,
        high_priority: 0,
        overdue: 0,
        avg_resolution_time: '0'
      };

      issuesData.forEach(issue => {
        if (issue.status !== 'resolved') {
          stats.total_open++;
          if (issue.priority === 'high') stats.high_priority++;
          if (issue.due_date && new Date(issue.due_date) < now) stats.overdue++;
        }
      });

      const resolutionTimes = issuesData
        .filter(i => i.resolution_time)
        .map(i => i.resolution_time as number); // Type assertion to number
      
      if (resolutionTimes.length > 0) {
        const avgTimeMs = resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length;
        const avgDate = new Date(Date.now() - avgTimeMs);
        stats.avg_resolution_time = formatDistanceToNow(avgDate);
      }

      return stats;
    }
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card className="p-4 flex items-center space-x-4">
        <Activity className="h-8 w-8 text-blue-500" />
        <div>
          <p className="text-sm text-muted-foreground">Open Issues</p>
          <p className="text-2xl font-bold">{stats?.total_open || 0}</p>
        </div>
      </Card>

      <Card className="p-4 flex items-center space-x-4">
        <AlertCircle className="h-8 w-8 text-red-500" />
        <div>
          <p className="text-sm text-muted-foreground">High Priority</p>
          <p className="text-2xl font-bold">{stats?.high_priority || 0}</p>
        </div>
      </Card>

      <Card className="p-4 flex items-center space-x-4">
        <Clock className="h-8 w-8 text-yellow-500" />
        <div>
          <p className="text-sm text-muted-foreground">Overdue</p>
          <p className="text-2xl font-bold">{stats?.overdue || 0}</p>
        </div>
      </Card>

      <Card className="p-4 flex items-center space-x-4">
        <CheckCircle2 className="h-8 w-8 text-green-500" />
        <div>
          <p className="text-sm text-muted-foreground">Avg Resolution Time</p>
          <p className="text-2xl font-bold">{stats?.avg_resolution_time || '-'}</p>
        </div>
      </Card>
    </div>
  );
};
