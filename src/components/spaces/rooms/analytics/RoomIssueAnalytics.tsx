
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { RoomIssue } from "../types/RoomTypes";

interface RoomIssueAnalyticsProps {
  roomId: string;
}

export function RoomIssueAnalytics({ roomId }: RoomIssueAnalyticsProps) {
  const { data: issues, isLoading } = useQuery({
    queryKey: ['room-issues', roomId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('issues')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as RoomIssue[];
    }
  });

  if (isLoading) {
    return <div className="p-4">Loading issue history...</div>;
  }

  if (!issues?.length) {
    return <div className="p-4 text-muted-foreground">No issue history found</div>;
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
    }
  };

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4">Issue History</h3>
      <ScrollArea className="h-[300px]">
        <div className="space-y-4">
          {issues.map((issue) => (
            <div
              key={issue.id}
              className="border rounded-lg p-3 flex flex-col gap-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(issue.status)}
                  <h4 className="font-medium">{issue.title}</h4>
                </div>
                <Badge variant={issue.status === 'resolved' ? 'default' : 'destructive'}>
                  {issue.status}
                </Badge>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm text-muted-foreground">
                <Badge variant="outline">{issue.type}</Badge>
                <span>{format(new Date(issue.created_at), 'MMM d, yyyy')}</span>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
}
