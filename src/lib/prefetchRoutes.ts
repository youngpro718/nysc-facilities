/**
 * Route prefetcher — warms up lazy() chunks before the user clicks.
 *
 * Each entry maps a route path to the same dynamic import() expression
 * used by React.lazy() in App.tsx. Calling prefetchRoute('/keys') on
 * hover/focus pulls the chunk into the browser cache so the subsequent
 * navigation feels instantaneous.
 *
 * The map intentionally only covers user-facing routes; admin-only chunks
 * stay cold for non-admins.
 */

type Importer = () => Promise<unknown>;

const ROUTE_LOADERS: Record<string, Importer> = {
  '/': () => import('@features/dashboard/pages/UserDashboard'),
  '/dashboard': () => import('@features/dashboard/pages/UserDashboard'),
  '/my-activity': () => import('@features/dashboard/pages/MyActivity'),
  '/my-issues': () => import('@features/issues/pages/MyIssues'),
  '/my-supply-requests': () => import('@features/supply/pages/MySupplyRequests'),
  '/my-requests': () => import('@features/dashboard/pages/MyRequests'),
  '/notifications': () => import('@features/dashboard/pages/Notifications'),
  '/profile': () => import('@features/profile/pages/Profile'),
  '/term-sheet': () => import('@features/court/pages/TermSheet'),
  '/keys': () => import('@features/keys/pages/Keys'),
  '/spaces': () => import('@features/spaces/pages/Spaces'),
  '/operations': () => import('@features/operations/pages/Operations'),
  '/tasks': () => import('@features/tasks/pages/Tasks'),
  '/supply-room': () => import('@features/supply/pages/SupplyRoom'),
  '/request/supplies': () => import('@features/supply/pages/request/SupplyOrderPage'),
};

const prefetched = new Set<string>();

export function prefetchRoute(path: string | undefined | null): void {
  if (!path) return;
  // Normalize: strip query/hash, collapse trailing slash.
  const clean = path.split('?')[0].split('#')[0].replace(/\/+$/, '') || '/';
  if (prefetched.has(clean)) return;
  const loader = ROUTE_LOADERS[clean];
  if (!loader) return;
  prefetched.add(clean);
  // Use requestIdleCallback when available so prefetch never blocks input.
  const run = () => {
    loader().catch(() => prefetched.delete(clean));
  };
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    (window as unknown as { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(run);
  } else {
    setTimeout(run, 0);
  }
}
