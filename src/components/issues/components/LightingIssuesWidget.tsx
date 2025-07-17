import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Lightbulb, AlertTriangle, ExternalLink, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";

interface LightingIssue {
  id: string;
  room_number: string;
  name: string;
  status: string;
  ballast_issue: boolean;
  reported_out_date: string | null;
  position: string;
}

export function LightingIssuesWidget() {
  const navigate = useNavigate();

  const { data: lightingIssues, isLoading } = useQuery<LightingIssue[]>({
    queryKey: ['lighting-issues-widget'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lighting_fixtures')
        .select('id, room_number, name, status, ballast_issue, reported_out_date, position')
        .in('status', ['non_functional', 'maintenance_needed'])
        .order('reported_out_date', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-semibold">Lighting Issues</CardTitle>
          <Lightbulb className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-5 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!lightingIssues || lightingIssues.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-semibold">Lighting Issues</CardTitle>
          <Lightbulb className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Lightbulb className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No lighting issues reported</p>
            <p className="text-xs text-muted-foreground">All fixtures are operational</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-semibold">Lighting Issues</CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant="destructive" className="text-xs">
            {lightingIssues.length} Active
          </Badge>
          <Lightbulb className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {lightingIssues.map((issue) => (
          <div key={issue.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">
                  Room {issue.room_number}
                </span>
                {issue.ballast_issue && (
                  <AlertTriangle className="h-3 w-3 text-orange-500" />
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                {issue.name} • {issue.position}
              </div>
              {issue.reported_out_date && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {formatDistanceToNow(new Date(issue.reported_out_date), { addSuffix: true })}
                </div>
              )}
            </div>
            <Badge 
              variant={issue.status === 'non_functional' ? 'destructive' : 'secondary'}
              className="text-xs"
            >
              {issue.status === 'non_functional' ? 'Down' : 'Maintenance'}
            </Badge>
          </div>
        ))}
        
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full mt-3"
          onClick={() => navigate('/lighting')}
        >
          <ExternalLink className="h-3 w-3 mr-1" />
          View All Lighting Issues
        </Button>
      </CardContent>
    </Card>
  );
}