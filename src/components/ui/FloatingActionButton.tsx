/**
 * Floating Action Button (FAB) - Quick Actions
 * 
 * Single tap opens an inline quick-action sheet with the 4 core request types.
 * No separate RequestHub page needed — actions launch directly.
 */

import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, Package, Armchair, HandHelping, KeyRound } from 'lucide-react';
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

  // Don't show on form pages, login, auth pages, spaces (has its own FAB),
  // or on the destinations the FAB itself navigates to.
  const hiddenPaths = [
    '/forms/',
    '/login',
    '/auth/',
    '/onboarding/',
    '/request/',
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

  // Admins track these requests in admin pages; /my-requests and /my-activity
  // are not in their navigation, so don't send them to orphaned destinations.
  const isAdminish = userRole === 'admin' || userRole === 'system_admin';

  const quickActions = [
    {
      id: 'supplies',
      label: 'Order Supplies',
      icon: Package,
      onClick: () => { setIsOpen(false); navigate('/request/supplies'); },
    },
    {
      id: 'setup',
      label: 'Set Up a Room',
      icon: Armchair,
      onClick: () => { setIsOpen(false); navigate('/request/help?type=setup'); },
    },
    {
      id: 'help',
      label: 'Request Help',
      icon: HandHelping,
      onClick: () => { setIsOpen(false); navigate('/request/help'); },
    },
    // Key requests live in admin key management for admins
    ...(!isAdminish ? [{
      id: 'key',
      label: 'Request a Key',
      icon: KeyRound,
      onClick: () => { setIsOpen(false); navigate('/my-requests?new=1'); },
    }] : []),
  ];

  return (
    <AnimatePresence>
      {!shouldHide && (
        <>
          {/* Backdrop */}
          <AnimatePresence>
            {isOpen && (
              <motion.div
                className="fixed inset-0 z-40 bg-black/40 md:hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsOpen(false)}
              />
            )}
          </AnimatePresence>

          {/* Action items */}
          <AnimatePresence>
            {isOpen && (
              <motion.div
                className="fixed bottom-44 right-4 z-50 md:hidden flex flex-col gap-3 items-end"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ staggerChildren: 0.05 }}
              >
                {quickActions.map((action, i) => (
                  <motion.button
                    key={action.id}
                    className="flex items-center gap-3 bg-background border border-border rounded-full pl-4 pr-3 py-2.5 shadow-lg touch-manipulation active:scale-95 transition-transform"
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
                  className="rounded-full pl-4 pr-3 py-2.5 h-auto shadow-lg border-border"
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
              className="h-14 w-14 rounded-full shadow-xl bg-primary hover:bg-primary/90 active:scale-95 transition-transform touch-manipulation"
              onClick={() => setIsOpen(!isOpen)}
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
