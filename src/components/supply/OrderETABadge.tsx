/**
 * ETA Badge component for supply orders
 * Shows estimated fulfillment time with confidence indicator
 */
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Clock, Zap, Hourglass } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getFulfillmentStats, calculateETA, getETAColor } from '@/lib/supplyEtaUtils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface OrderETABadgeProps {
  order: {
    status: string;
    created_at: string;
    work_started_at?: string | null;
    priority?: string;
  };
  className?: string;
  showIcon?: boolean;
  variant?: 'badge' | 'inline';
}

export function OrderETABadge({ 
  order, 
  className,
  showIcon = true,
  variant = 'badge',
}: OrderETABadgeProps) {
  const { data: stats } = useQuery({
    queryKey: ['fulfillment-stats'],
    queryFn: getFulfillmentStats,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Don't show ETA for completed/cancelled orders
  if (['completed', 'cancelled', 'rejected'].includes(order.status)) {
    return null;
  }

  const defaultStats = { averageMinutes: 30, medianMinutes: 25, sampleSize: 0 };
  const eta = calculateETA(order, stats || defaultStats);

  if (eta.label === 'Ready now') {
    return (
      <Badge variant="outline" className={cn('bg-accent text-accent-foreground', className)}>
        {showIcon && <Zap className="h-3 w-3 mr-1" />}
        Ready now
      </Badge>
    );
  }

  const Icon = order.priority === 'urgent' ? Zap : 
               eta.confidence === 'high' ? Clock : Hourglass;

  const content = (
    <div className={cn(
      'flex items-center gap-1',
      getETAColor(eta.confidence),
      variant === 'inline' && 'text-sm',
      className
    )}>
      {showIcon && <Icon className="h-3.5 w-3.5" />}
      <span className="font-medium">{eta.label}</span>
    </div>
  );

  if (variant === 'badge') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant="outline" 
              className={cn(
                'cursor-default',
                eta.confidence === 'high' && 'border-green-300 dark:border-green-700',
                eta.confidence === 'medium' && 'border-amber-300 dark:border-amber-700',
                eta.confidence === 'low' && 'border-border',
                className
              )}
            >
              {content}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Estimated time to ready</p>
            <p className="text-xs text-muted-foreground">
              {stats && stats.sampleSize > 0 
                ? `Based on ${stats.sampleSize} recent orders`
                : 'Estimate based on defaults'}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return content;
}
