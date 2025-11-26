/**
 * LoadingState - Standardized loading state components
 * 
 * Use these instead of spinners for better perceived performance.
 */

import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface LoadingStateProps {
  className?: string;
}

/**
 * Loading skeleton for a list of cards
 */
export function CardListSkeleton({ count = 3, className }: LoadingStateProps & { count?: number }) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-1/4" />
              </div>
              <Skeleton className="h-8 w-16" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/**
 * Loading skeleton for stats cards
 */
export function StatsCardsSkeleton({ count = 4, className }: LoadingStateProps & { count?: number }) {
  return (
    <div className={cn("grid gap-4", `grid-cols-${Math.min(count, 4)}`, className)}>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Skeleton className="h-5 w-5 rounded" />
              <Skeleton className="h-6 w-8" />
            </div>
            <Skeleton className="h-4 w-20 mb-1" />
            <Skeleton className="h-3 w-16" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/**
 * Loading skeleton for a table
 */
export function TableSkeleton({ rows = 5, columns = 4, className }: LoadingStateProps & { rows?: number; columns?: number }) {
  return (
    <div className={cn("space-y-2", className)}>
      {/* Header */}
      <div className="flex gap-4 p-3 border-b">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4 p-3">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Loading skeleton for a form
 */
export function FormSkeleton({ fields = 4, className }: LoadingStateProps & { fields?: number }) {
  return (
    <div className={cn("space-y-6", className)}>
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <Skeleton className="h-10 w-32" />
    </div>
  );
}

/**
 * Loading skeleton for a dashboard
 */
export function DashboardSkeleton({ className }: LoadingStateProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      
      {/* Stats */}
      <StatsCardsSkeleton count={4} />
      
      {/* Content */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent>
            <CardListSkeleton count={3} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent>
            <CardListSkeleton count={3} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/**
 * Full page loading state
 */
export function PageLoadingSkeleton({ className }: LoadingStateProps) {
  return (
    <div className={cn("flex items-center justify-center min-h-[400px]", className)}>
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

/**
 * Inline loading indicator
 */
export function InlineLoading({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
      <span className="text-sm">{text}</span>
    </div>
  );
}
