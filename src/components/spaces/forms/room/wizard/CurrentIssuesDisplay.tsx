import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, AlertCircle, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

interface CurrentIssuesDisplayProps {
  roomId?: string;
}

export function CurrentIssuesDisplay({ roomId }: CurrentIssuesDisplayProps) {
  const { data: issues, isLoading } = useQuery({
    queryKey: ["room-current-issues", roomId],
    queryFn: async () => {
      if (!roomId) return [];

      const { data, error } = await supabase
        .from("issues")
        .select("id, title, description, status, priority, issue_type, created_at")
        .eq("room_id", roomId)
        .in("status", ["open", "in_progress"])
        .order("priority", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!roomId,
  });

  if (!roomId) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            Save the room first to view current issues.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Current Issues</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const openIssues = issues?.filter((i) => i.status === "open").length || 0;
  const inProgressIssues = issues?.filter((i) => i.status === "in_progress").length || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Current Issues</span>
          <div className="flex gap-2 text-sm font-normal">
            <Badge variant="destructive">{openIssues} Open</Badge>
            <Badge variant="default">{inProgressIssues} In Progress</Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!issues || issues.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle2 className="h-12 w-12 text-success mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              No current issues • Great job! 🎉
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {issues.map((issue) => (
              <Card key={issue.id} className="border-border">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-medium text-sm line-clamp-1">{issue.title}</h4>
                    <Badge
                      variant={issue.priority === "high" ? "destructive" : issue.priority === "medium" ? "default" : "secondary"}
                      className="shrink-0"
                    >
                      {issue.priority}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="capitalize">{issue.issue_type?.replace(/_/g, " ")}</span>
                    <span>•</span>
                    <span className="capitalize">{issue.status?.replace(/_/g, " ")}</span>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Created {format(new Date(issue.created_at), "MMM d, yyyy")}
                  </p>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => window.open(`/issues/${issue.id}`, "_blank")}
                  >
                    <ExternalLink className="h-3 w-3 mr-2" />
                    View Details
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Button
          variant="outline"
          className="w-full mt-4"
          onClick={() => window.open(`/issues?room=${roomId}`, "_blank")}
        >
          <AlertCircle className="h-4 w-4 mr-2" />
          Report New Issue for This Room
        </Button>
      </CardContent>
    </Card>
  );
}
