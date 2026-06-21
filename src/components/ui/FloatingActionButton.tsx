/**
 * Floating Action Button (FAB) - Quick Actions
 * 
 * Single tap opens an inline quick-action sheet with the 4 core request types.
 * No separate RequestHub page needed — actions launch directly.
 */

import { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, Package, HandHelping, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@shared/hooks/use-mobile';
import { useRolePermissions } from '@features/auth/hooks/useRolePermissions';
import { motion, AnimatePresence } from 'framer-motion';
import { QuickIssueReportButton } from '@shared/components/user/QuickIssueReportButton';

export function FloatingActionButton() {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const { userRole } = useRolePermissions();
  const [isOpen, setIsOpen] = useState(false);

  // Lock the toggle for the length of the open/close animation. Rapid taps
  // that out-pace framer-motion's exit can orphan the backdrop (a fixed,
  // tap-capturing overlay) and make the UI feel stuck. The lock + the
  // pointer-events gating on the backdrop below prevent that.
  const toggleLock = useRef(false);
  const toggleMenu = () => {
    if (toggleLock.current) return;
    toggleLock.current = true;
    setIsOpen(prev => !prev);
    setTimeout(() => { toggleLock.current = false; }, 280);
  };
  const closeAndRun = (fn: () => void) => {
    setIsOpen(false);
    fn();
  };

  // Don't show on form pages, login, auth pages, spaces (has its own FAB),
  // or on the destinations the FAB itself navigates to.
  const hiddenPaths = [
    '/login',
    '/auth/',
    '/onboarding/',
    '/supplies',
    '/spaces',
    '/operations',
    '/issues',
    '/maintenance',
    '/lighting',
    '/keys',
    '/inventory',
    '/tasks',
    '/court-officer-dashboard',
    '/court-aide-dashboard',
    '/term-sheet',
    '/profile',
    '/settings',
    '/admin',
    '/my-activity',
    '/my-requests',
    '/my-issues',
    '/my-supply-requests',
    '/notifications',
    '/system-settings',
  ];
  const shouldHide = hiddenPaths.some(path => location.pathname.startsWith(path));

  // Roles whose workflow doesn't include quick request actions
  const rolesWithoutFAB = ['purchasing', 'court_aide', 'court_officer'];
  if (!isMobile || (userRole && rolesWithoutFAB.includes(userRole))) {
    return null;
  }

  const quickActions = [
    {
      id: 'supplies',
      label: 'Order Supplies',
      icon: Package,
      onClick: () => closeAndRun(() => navigate('/supplies?tab=order')),
    },
    {
      id: 'request',
      label: 'Make a Request',
      icon: HandHelping,
      onClick: () => closeAndRun(() => navigate('/supplies?tab=request')),
    },
    {
      id: 'key',
      label: 'Request a Key',
      icon: KeyRound,
      onClick: () => closeAndRun(() => navigate('/keys/request')),
    },
  ];

  return (
    <AnimatePresence>
      {!shouldHide && (
        <>
          {/* Backdrop. pointerEvents is animated (not an isOpen-keyed style) so
              the EXITING node also drops to 'none' immediately — otherwise a
              backdrop still fading out keeps capturing taps and feels stuck. */}
          <AnimatePresence initial={false}>
            {isOpen && (
              <motion.div
                className="fixed inset-0 z-40 bg-black/40 md:hidden"
                initial={{ opacity: 0, pointerEvents: 'none' }}
                animate={{ opacity: 1, pointerEvents: 'auto' }}
                exit={{ opacity: 0, pointerEvents: 'none' }}
                onClick={() => setIsOpen(false)}
              />
            )}
          </AnimatePresence>

          {/* Action items */}
          <AnimatePresence initial={false}>
            {isOpen && (
              <motion.div
                className="fixed bottom-44 right-4 z-50 md:hidden flex flex-col gap-3 items-end"
                initial={{ opacity: 0, y: 20, pointerEvents: 'none' }}
                animate={{ opacity: 1, y: 0, pointerEvents: 'auto' }}
                exit={{ opacity: 0, y: 20, pointerEvents: 'none' }}
                transition={{ staggerChildren: 0.05 }}
              >
                {quickActions.map((action, i) => (
                  <motion.button
                    key={action.id}
                    type="button"
                    className="flex items-center gap-3 bg-background border border-border rounded-full pl-4 pr-3 py-2.5 touch-manipulation transition-transform"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0, transition: { delay: i * 0.05 } }}
                    exit={{ opacity: 0, x: 20 }}
                    onClick={action.onClick}
                  >
                    <span className="text-sm font-medium text-foreground whitespace-nowrap">{action.label}</span>
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                      <action.icon className="h-4 w-4 text-primary" />
                    </div>
                  </motion.button>
                ))}
                {/* Report Issue uses the existing QuickIssueReportButton */}
                <QuickIssueReportButton
                  variant="outline"
                  size="sm"
                  label="Report Issue"
                  showIcon={true}
                  className="rounded-full pl-4 pr-3 py-2.5 h-auto border-border"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* FAB Button */}
          <motion.div
            className="fixed bottom-28 right-4 z-50 md:hidden"
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
              type="button"
              className="h-14 w-14 rounded-full shadow-xl bg-primary hover:bg-primary/90 transition-transform touch-manipulation"
              onClick={toggleMenu}
              aria-label={isOpen ? "Close actions" : "New Request"}
            >
              <motion.div
                animate={{ rotate: isOpen ? 45 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <Plus className="h-6 w-6" />
              </motion.div>
            </Button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
