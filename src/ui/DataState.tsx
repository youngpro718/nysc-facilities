/**
 * DataState Component
 * 
 * Standardized component for handling all data states:
 * - Loading: Show skeleton or spinner
 * - Empty: Show empty state with optional action
 * - Error: Show error message with retry
 * - Ready: Render children with data
 * 
 * This reduces repeated complexity and makes latency/errors predictable.
 * 
 * @module ui/DataState
 */

import { ReactNode } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, RefreshCw, Inbox } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

export interface DataStateProps<T = any> {
  /** The data to render */
  data: T | null | undefined;
  
  /** Loading state */
  isLoading?: boolean;
  
  /** Error object */
  error?: Error | null;
  
  /** Function to retry loading data */
  onRetry?: () => void;
  
  /** Custom loading component */
  loadingComponent?: ReactNode;
  
  /** Custom empty state component */
  emptyComponent?: ReactNode;
  
  /** Custom error component */
  errorComponent?: ReactNode;
  
  /** Empty state configuration */
  emptyState?: {
    title?: string;
    description?: string;
    icon?: ReactNode;
    action?: {
      label: string;
      onClick: () => void;
    };
  };
  
  /** Loading skeleton configuration */
  loadingSkeleton?: {
    type?: 'card' | 'list' | 'table' | 'custom';
    count?: number;
    height?: string;
  };
  
  /** Function to check if data is empty (default checks array length or object) */
  isEmpty?: (data: T) => boolean;
  
  /** Children render function or component */
  children: ((data: T) => ReactNode) | ReactNode;
}

// ============================================================================
// DEFAULT COMPONENTS
// ============================================================================

function DefaultLoadingSkeleton({ 
  type = 'card', 
  count = 3, 
  height = '200px' 
}: { 
  type?: 'card' | 'list' | 'table' | 'custom'; 
  count?: number; 
  height?: string;
}) {
  if (type === 'card') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(count)].map((_, i) => (
          <Skeleton key={i} className="h-48" />
        ))}
      </div>
    );
  }

  if (type === 'list') {
    return (
      <div className="space-y-3">
        {[...Array(count)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (type === 'table') {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" /> {/* Header */}
        {[...Array(count)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return <Skeleton style={{ height }} className="w-full" />;
}

function DefaultEmptyState({
  title = 'No data found',
  description = 'There is no data to display at this time.',
  icon,
  action,
}: {
  title?: string;
  description?: string;
  icon?: ReactNode;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="rounded-full bg-muted p-3 mb-4">
        {icon || <Inbox className="h-6 w-6 text-muted-foreground" />}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-sm">
        {description}
      </p>
      {action && (
        <Button onClick={action.onClick} variant="outline">
          {action.label}
        </Button>
      )}
    </div>
  );
}

function DefaultErrorState({
  error,
  onRetry,
}: {
  error: Error;
  onRetry?: () => void;
}) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription className="flex items-center justify-between">
        <span>{error.message || 'An unexpected error occurred'}</span>
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="ml-4"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * DataState Component
 * 
 * Handles all data states in a consistent, predictable way.
 * 
 * @example
 * ```tsx
 * <DataState
 *   data={rooms}
 *   isLoading={isLoading}
 *   error={error}
 *   onRetry={refetch}
 *   emptyState={{
 *     title: 'No rooms found',
 *     description: 'Create your first room to get started',
 *     action: { label: 'Add Room', onClick: () => navigate('/rooms/new') }
 *   }}
 * >
 *   {(rooms) => <RoomList rooms={rooms} />}
 * </DataState>
 * ```
 */
export function DataState<T = any>({
  data,
  isLoading = false,
  error = null,
  onRetry,
  loadingComponent,
  emptyComponent,
  errorComponent,
  emptyState,
  loadingSkeleton,
  isEmpty: isEmptyFn,
  children,
}: DataStateProps<T>) {
  // ============================================================================
  // LOADING STATE
  // ============================================================================
  if (isLoading) {
    if (loadingComponent) {
      return <>{loadingComponent}</>;
    }

    return (
      <DefaultLoadingSkeleton
        type={loadingSkeleton?.type}
        count={loadingSkeleton?.count}
        height={loadingSkeleton?.height}
      />
    );
  }

  // ============================================================================
  // ERROR STATE
  // ============================================================================
  if (error) {
    if (errorComponent) {
      return <>{errorComponent}</>;
    }

    return <DefaultErrorState error={error} onRetry={onRetry} />;
  }

  // ============================================================================
  // EMPTY STATE
  // ============================================================================
  const isEmpty = isEmptyFn
    ? isEmptyFn(data as T)
    : data === null ||
      data === undefined ||
      (Array.isArray(data) && data.length === 0) ||
      (typeof data === 'object' && Object.keys(data).length === 0);

  if (isEmpty) {
    if (emptyComponent) {
      return <>{emptyComponent}</>;
    }

    return (
      <DefaultEmptyState
        title={emptyState?.title}
        description={emptyState?.description}
        icon={emptyState?.icon}
        action={emptyState?.action}
      />
    );
  }

  // ============================================================================
  // READY STATE (WITH DATA)
  // ============================================================================
  if (typeof children === 'function') {
    return <>{children(data as T)}</>;
  }

  return <>{children}</>;
}

// ============================================================================
// CONVENIENCE HOOKS
// ============================================================================

/**
 * Hook to create DataState props from React Query result
 * 
 * @example
 * ```tsx
 * const query = useRooms();
 * const dataStateProps = useDataState(query);
 * 
 * <DataState {...dataStateProps}>
 *   {(rooms) => <RoomList rooms={rooms} />}
 * </DataState>
 * ```
 */
export function useDataState<T>(queryResult: {
  data: T | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch?: () => void;
}) {
  return {
    data: queryResult.data,
    isLoading: queryResult.isLoading,
    error: queryResult.error,
    onRetry: queryResult.refetch,
  };
}
