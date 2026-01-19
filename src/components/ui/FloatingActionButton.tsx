/**
 * Floating Action Button (FAB) - Quick Actions
 * 
 * Single tap navigates to the Request Hub.
 * Simplified from the original menu-based approach.
 */

import { useNavigate, useLocation } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

export function FloatingActionButton() {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();

  // Don't show on form pages, login, auth pages, or request hub
  const hiddenPaths = ['/forms/', '/login', '/auth/', '/onboarding/', '/request'];
  if (hiddenPaths.some(path => location.pathname.startsWith(path))) {
    return null;
  }

  // Only show on mobile
  if (!isMobile) {
    return null;
  }

  return (
    <div className="fixed bottom-24 right-4 z-50 md:hidden pb-safe">
      <Button
        size="icon"
        className="h-14 w-14 rounded-full shadow-xl bg-primary hover:bg-primary/90"
        onClick={() => navigate('/request')}
        aria-label="New Request"
      >
        <Plus className="h-6 w-6" />
      </Button>
    </div>
  );
}
