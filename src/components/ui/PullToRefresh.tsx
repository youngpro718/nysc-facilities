import { ReactNode } from 'react';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: ReactNode;
  enabled?: boolean;
  threshold?: number;
}

export function PullToRefresh({ 
  onRefresh, 
  children, 
  enabled = true,
  threshold = 80 
}: PullToRefreshProps) {
  const { isRefreshing, pullDistance, isPulling } = usePullToRefresh({ 
    onRefresh, 
    threshold,
    enabled 
  });

  const progress = Math.min((pullDistance / threshold) * 100, 100);
  const rotation = (pullDistance / threshold) * 360;

  return (
    <div className="relative">
      {/* Pull indicator */}
      {enabled && (
        <div
          className={cn(
            "fixed top-0 left-1/2 -translate-x-1/2 z-50",
            "transition-all duration-200",
            isPulling || isRefreshing ? "opacity-100" : "opacity-0"
          )}
          style={{
            transform: `translate(-50%, ${Math.min(pullDistance, threshold)}px)`
          }}
        >
          <div className="bg-background/95 backdrop-blur-sm border rounded-full p-3 shadow-lg">
            <RefreshCw 
              className={cn(
                "h-5 w-5 text-primary transition-transform",
                isRefreshing && "animate-spin"
              )}
              style={{
                transform: isRefreshing ? undefined : `rotate(${rotation}deg)`
              }}
            />
          </div>
        </div>
      )}

      {/* Progress indicator */}
      {enabled && isPulling && !isRefreshing && (
        <div 
          className="fixed top-0 left-0 right-0 h-1 bg-primary/20 z-40"
          style={{
            transform: `translateY(${Math.min(pullDistance, threshold)}px)`
          }}
        >
          <div 
            className="h-full bg-primary transition-all duration-150"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {children}
    </div>
  );
}
