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
import { useGoHome } from '@shared/hooks/useHomePath';

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
  const goHome = useGoHome();

  const trail = getBreadcrumbTrail(location.pathname);

  // Don't show breadcrumb on home/dashboard pages
  if (trail.length <= 1) {
    return null;
  }

  // Mobile view - deterministic back to parent route, or role-aware home as fallback
  const handleBack = () => {
    if (trail.length > 1) {
      const parentRoute = trail[trail.length - 2];
      navigate(parentRoute.path);
    } else {
      goHome();
    }
  };

  return (
    <>
      {/* Mobile: Back button only */}
      <div className="md:hidden mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      {/* Desktop: parent links only. The page itself is named right below by
          PageHeader (and in the app top bar), so repeating it here made the
          same title appear three times on every screen. */}
      <div className={`hidden md:block mb-1.5 ${className}`}>
        <ShadcnBreadcrumb>
          <BreadcrumbList className="text-xs">
            {trail.slice(0, -1).map((route, index) => (
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
                <BreadcrumbSeparator />
              </Fragment>
            ))}
          </BreadcrumbList>
        </ShadcnBreadcrumb>
      </div>
    </>
  );
}
