import { useQuery } from "@tanstack/react-query";
import { logger } from '@/lib/logger';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { AlertCircle, CheckCircle, Clock, Wrench } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface IssueStats {
  openCount: number;
  resolvedCount: number;
  deferredCount: number;
  totalCount: number;
}

export function LightingIssuesCard() {
  const { data: issueStats, isLoading } = useQuery<IssueStats>({
    queryKey: ['lighting-issues-stats'],
    queryFn: async () => {
      try {
        const { data: issues, error } = await supabase
          .from('issues')
          .select('status')
          .eq('issue_type', 'lighting');
        
        if (error) {
          logger.error('Error fetching lighting issues:', error);
          return {
            openCount: 0,
            resolvedCount: 0,
            deferredCount: 0,
            totalCount: 0
          };
        }
        
        if (!issues || !Array.isArray(issues)) {
          return {
            openCount: 0,
            resolvedCount: 0,
            deferredCount: 0,
            totalCount: 0
          };
        }
        
        const openCount = issues.filter(issue => issue.status === 'open').length;
        const resolvedCount = issues.filter(issue => issue.status === 'resolved').length;
        const inProgressCount = issues.filter(issue => issue.status === 'in_progress').length;
        
        return {
          openCount,
          resolvedCount,
          deferredCount: inProgressCount,
          totalCount: openCount + resolvedCount + inProgressCount
        };
      } catch (error) {
        logger.error('Error in lighting issues stats query:', error);
        return {
          openCount: 0,
          resolvedCount: 0,
          deferredCount: 0,
          totalCount: 0
        };
      }
    }
  });

  if (isLoading) {
    return (
      <Card className="border-none shadow-md">
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasIssues = (issueStats?.openCount || 0) > 0;

  return (
    <Card className={cn(
      "border-none shadow-md transition-colors",
      hasIssues ? "bg-amber-500/5 border-amber-500/20" : "bg-emerald-500/5 border-emerald-500/20"
    )}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <AlertCircle className={cn(
            "h-4 w-4",
            hasIssues ? "text-amber-500" : "text-emerald-500"
          )} />
          Lighting Issues Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          {/* Open Issues */}
          <div className={cn(
            "flex flex-col items-center justify-center p-4 rounded-xl",
            hasIssues ? "bg-amber-500/10" : "bg-muted/30"
          )}>
            <div className="flex items-center gap-2 mb-1">
              <Clock className={cn(
                "h-4 w-4",
                hasIssues ? "text-amber-500" : "text-muted-foreground"
              )} />
              <span className={cn(
                "text-2xl font-bold",
                hasIssues ? "text-amber-600" : "text-muted-foreground"
              )}>
                {issueStats?.openCount || 0}
              </span>
            </div>
            <span className="text-xs text-muted-foreground font-medium">Open</span>
          </div>

          {/* In Progress */}
          <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-muted/30">
            <div className="flex items-center gap-2 mb-1">
              <Wrench className="h-4 w-4 text-blue-500" />
              <span className="text-2xl font-bold">{issueStats?.deferredCount || 0}</span>
            </div>
            <span className="text-xs text-muted-foreground font-medium">In Progress</span>
          </div>

          {/* Resolved */}
          <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-emerald-500/10">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="h-4 w-4 text-emerald-500" />
              <span className="text-2xl font-bold text-emerald-600">{issueStats?.resolvedCount || 0}</span>
            </div>
            <span className="text-xs text-muted-foreground font-medium">Resolved</span>
          </div>
        </div>

        {/* Resolution Rate */}
        {(issueStats?.totalCount || 0) > 0 && (
          <div className="mt-4 pt-4 border-t border-border/50">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Resolution Rate</span>
              <span className="font-semibold">
                {Math.round(((issueStats?.resolvedCount || 0) / (issueStats?.totalCount || 1)) * 100)}%
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
