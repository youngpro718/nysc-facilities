import { ChevronRight } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

export function SettingsNavigation() {
  const navigate = useNavigate();
  const location = useLocation();

  const getBreadcrumbs = (): BreadcrumbItem[] => {
    const path = location.pathname;
    
    if (path === '/settings') {
      return [{ label: 'Settings' }];
    }
    
    if (path === '/admin-profile') {
      return [
        { label: 'Settings', path: '/settings' },
        { label: 'Admin Profile' }
      ];
    }
    
    if (path === '/system-settings') {
      return [
        { label: 'Settings', path: '/settings' },
        { label: 'System Settings' }
      ];
    }
    
    return [{ label: 'Settings' }];
  };

  const breadcrumbs = getBreadcrumbs();

  if (breadcrumbs.length === 1) {
    return null; // Don't show breadcrumbs on the main settings page
  }

  return (
    <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
      {breadcrumbs.map((crumb, index) => (
        <div key={index} className="flex items-center gap-2">
          {crumb.path ? (
            <Button
              variant="link"
              className="h-auto p-0 text-sm text-muted-foreground hover:text-foreground"
              onClick={() => navigate(crumb.path!)}
            >
              {crumb.label}
            </Button>
          ) : (
            <span className="text-foreground font-medium">{crumb.label}</span>
          )}
          {index < breadcrumbs.length - 1 && (
            <ChevronRight className="h-4 w-4" />
          )}
        </div>
      ))}
    </nav>
  );
}
