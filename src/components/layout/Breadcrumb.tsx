import { Fragment } from 'react';
import { ChevronLeft, Home } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Breadcrumb as ShadcnBreadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { getBreadcrumbTrail } from '@/config/routes';
import { usePermissions } from '@/hooks/common/usePermissions';

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
  const { isAdmin } = usePermissions();
  
  const trail = getBreadcrumbTrail(location.pathname);
  
  // Don't show breadcrumb on home/dashboard pages
  if (trail.length <= 1) {
    return null;
  }

  // Mobile view - just show back button
  const handleBack = () => {
    if (trail.length > 1) {
      const parentRoute = trail[trail.length - 2];
      navigate(parentRoute.path);
    } else {
      navigate(-1);
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

      {/* Desktop: Full breadcrumb trail */}
      <div className={`hidden md:block mb-4 ${className}`}>
        <ShadcnBreadcrumb>
          <BreadcrumbList>
            {trail.map((route, index) => {
              const isLast = index === trail.length - 1;
              const Icon = route.icon;

              return (
                <Fragment key={route.path}>
                  <BreadcrumbItem>
                    {isLast ? (
                      <BreadcrumbPage className="flex items-center gap-2">
                        {Icon && <Icon className="h-4 w-4" />}
                        {route.breadcrumbLabel}
                      </BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink
                        onClick={() => navigate(route.path)}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        {index === 0 && <Home className="h-4 w-4" />}
                        {route.breadcrumbLabel}
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                  {!isLast && <BreadcrumbSeparator />}
                </Fragment>
              );
            })}
          </BreadcrumbList>
        </ShadcnBreadcrumb>
      </div>
    </>
  );
}
