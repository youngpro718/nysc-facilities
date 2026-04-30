/**
 * RouteSkeleton — layout-aware fallback for <Suspense> route boundaries.
 *
 * Instead of a centered spinner that flashes the screen white, this renders
 * a header band + a few content blocks so the page feels continuous while
 * the new chunk loads. Used by the top-level Suspense in App.tsx.
 */

import { Skeleton } from '@/components/ui/skeleton';

export function RouteSkeleton() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading page"
      data-testid="route-skeleton"
      className="w-full px-4 sm:px-6 py-6 space-y-6 animate-fade-in"
    >
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-72" />
      </div>

      {/* Stat cards */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>

      {/* Content list */}
      <div className="space-y-3">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 rounded-lg" />
        ))}
      </div>

      <span className="sr-only">Loading…</span>
    </div>
  );
}
