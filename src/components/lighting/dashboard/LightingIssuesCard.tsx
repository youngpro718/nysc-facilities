import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { AlertCircle, CheckCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

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
        // Direct query approach with type assertions to avoid TypeScript errors
        // Get all lighting issues and count them client-side
        const { data: issues, error } = await supabase
          .from('issues')
          .select('status')
          .eq('issue_type', 'lighting');
        
        if (error) {
          console.error('Error fetching lighting issues:', error);
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
        
        // Count issues by status (unified issues table uses different status values)
        const openCount = issues.filter(issue => issue.status === 'open').length;
        const resolvedCount = issues.filter(issue => issue.status === 'resolved').length;
        const inProgressCount = issues.filter(issue => issue.status === 'in_progress').length;
        
        return {
          openCount,
          resolvedCount,
          deferredCount: inProgressCount, // Map in_progress to deferred for compatibility
          totalCount: openCount + resolvedCount + inProgressCount
        };
      } catch (error) {
        console.error('Error in lighting issues stats query:', error);
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
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center">
            <AlertCircle className="h-4 w-4 mr-2 text-amber-500" />
            <Skeleton className="h-4 w-32" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-4 w-24" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center">
          <AlertCircle className="h-4 w-4 mr-2 text-amber-500" />
          Lighting Issues
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center">
          <span className="text-2xl font-bold">{issueStats?.openCount || 0}</span>
          <div className="flex flex-col items-end">
            <span className="text-sm text-muted-foreground flex items-center">
              <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
              {issueStats?.resolvedCount || 0} resolved
            </span>
            <span className="text-xs text-muted-foreground">
              {issueStats?.deferredCount || 0} deferred
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
