import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCcw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface LiveIndicatorProps {
  lastUpdated?: Date;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  autoRefreshInterval?: number; // in seconds
  showRefreshButton?: boolean;
}

export function LiveIndicator({
  lastUpdated = new Date(),
  onRefresh,
  isRefreshing = false,
  autoRefreshInterval,
  showRefreshButton = true,
}: LiveIndicatorProps) {
  const [timeAgo, setTimeAgo] = useState('just now');

  // Update time ago every second
  useEffect(() => {
    const updateTimeAgo = () => {
      const distance = formatDistanceToNow(lastUpdated, { addSuffix: false });
      setTimeAgo(distance === '0 seconds' ? 'just now' : `${distance} ago`);
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 1000);

    return () => clearInterval(interval);
  }, [lastUpdated]);

  return (
    <div className="flex items-center gap-2 text-xs">
      {/* Live Indicator Dot */}
      <div className="flex items-center gap-1.5">
        <div className="relative">
          <div className="h-2 w-2 rounded-full bg-green-500" />
          <div className="absolute inset-0 h-2 w-2 rounded-full bg-green-500 animate-ping opacity-75" />
        </div>
        <span className="font-medium text-green-600 dark:text-green-400">LIVE</span>
      </div>

      {/* Separator */}
      <span className="text-muted-foreground">•</span>

      {/* Last Updated */}
      <span className="text-muted-foreground">
        Updated {timeAgo}
      </span>

      {/* Auto-refresh info */}
      {autoRefreshInterval && (
        <>
          <span className="text-muted-foreground">•</span>
          <span className="text-muted-foreground">
            Auto-refresh: {autoRefreshInterval}s
          </span>
        </>
      )}

      {/* Manual Refresh Button */}
      {showRefreshButton && onRefresh && (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onRefresh}
          disabled={isRefreshing}
        >
          <RefreshCcw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      )}
    </div>
  );
}

// Compact version for tight spaces
export function LiveIndicatorCompact({
  lastUpdated = new Date(),
  onRefresh,
  isRefreshing = false,
}: Pick<LiveIndicatorProps, 'lastUpdated' | 'onRefresh' | 'isRefreshing'>) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
      {onRefresh && (
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5"
          onClick={onRefresh}
          disabled={isRefreshing}
        >
          <RefreshCcw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      )}
    </div>
  );
}
