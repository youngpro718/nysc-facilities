import { Fragment } from 'react';
import { ChevronLeft, Home } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Breadcrumb as ShadcnBreadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { getBreadcrumbTrail } from '@/config/routes';
import { cn } from '@/lib/utils';
import { useHomePath } from '@shared/hooks/useHomePath';

interface BreadcrumbProps {
  className?: string;
}

/**
 * Global Breadcrumb Component
 * Automatically generates breadcrumbs based on current route
 * Shows back button on mobile, full breadcrumb trail on desktop
 */
export function Breadcrumb({ className }: BreadcrumbProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const homePath = useHomePath();

  const trail = getBreadcrumbTrail(location.pathname);
  const parentRoutes = trail.slice(0, -1);
  const parentRoute = parentRoutes[parentRoutes.length - 1];
  const isHomePage = location.pathname === homePath;
  const canShowBack = !isHomePage && location.pathname !== '/';

  // Don't show breadcrumb/back controls on the user's own landing page.
  if (!canShowBack && parentRoutes.length === 0) {
    return null;
  }

  // Prefer real browser history so /supplies?tab=request can return to the
  // exact page that opened it. Direct links fall back to parent or role home.
  const handleBack = () => {
    const historyIndex = window.history.state?.idx;
    if (typeof historyIndex === 'number' && historyIndex > 0) {
      navigate(-1);
      return;
    }

    if (parentRoute) {
      navigate(parentRoute.path);
    } else {
      navigate(homePath, { replace: true });
    }
  };

  const backButton = (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleBack}
      className="gap-2 shrink-0"
    >
      <ChevronLeft className="h-4 w-4" />
      Back
    </Button>
  );

  return (
    <>
      {/* Mobile: Back button only */}
      <div className="md:hidden mb-4">
        {backButton}
      </div>

      {/* Desktop: parent links only. The page itself is named right below by
          PageHeader (and in the app top bar), so repeating it here made the
          same title appear three times on every screen. */}
      <div className={cn("hidden md:flex items-center gap-2 mb-1.5", className)}>
        {backButton}
        {parentRoutes.length > 0 && (
          <ShadcnBreadcrumb>
            <BreadcrumbList className="text-xs">
              {parentRoutes.map((route, index) => (
                <Fragment key={route.path}>
                  <BreadcrumbItem>
                    <BreadcrumbLink
                      onClick={() => navigate(route.path)}
                      className="flex items-center gap-1.5 cursor-pointer"
                    >
                      {index === 0 && <Home className="h-3.5 w-3.5" />}
                      {route.breadcrumbLabel}
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  {index < parentRoutes.length - 1 && <BreadcrumbSeparator />}
                </Fragment>
              ))}
            </BreadcrumbList>
          </ShadcnBreadcrumb>
        )}
      </div>
    </>
  );
}
