/**
 * Floating Action Button (FAB) - Quick Actions
 * 
 * Single tap navigates to the Request Hub.
 * Includes smooth entry animation for better mobile UX.
 */

import { useNavigate, useLocation } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { motion, AnimatePresence } from 'framer-motion';

export function FloatingActionButton() {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();

  // Don't show on form pages, login, auth pages, request hub, or spaces (has its own FAB)
  const hiddenPaths = ['/forms/', '/login', '/auth/', '/onboarding/', '/request', '/spaces'];
  const shouldHide = hiddenPaths.some(path => location.pathname.startsWith(path));

  // Only show on mobile
  if (!isMobile) {
    return null;
  }

  return (
    <AnimatePresence>
      {!shouldHide && (
        <motion.div 
          className="fixed bottom-24 right-4 z-50 md:hidden pb-safe"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ 
            type: "spring", 
            stiffness: 400, 
            damping: 25,
            delay: 0.2 
          }}
        >
          <Button
            size="icon"
            className="h-14 w-14 rounded-full shadow-xl bg-primary hover:bg-primary/90 active:scale-95 transition-transform touch-manipulation"
            onClick={() => navigate('/request')}
            aria-label="New Request"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
