/**
 * Court Aide Work Center
 * 
 * Purpose-built dashboard for Court Aides focused on work execution.
 * Shows tasks, supply fulfillment, schedule, and alerts.
 */

import { useAuth } from '@features/auth/hooks/useAuth';
import { useNotifications } from '@shared/hooks/useNotifications';
import { TaskWorkQueue } from '@features/court/components/court-aide/TaskWorkQueue';
import { SupplyFulfillmentPanel } from '@features/court/components/court-aide/SupplyFulfillmentPanel';
import { TodaySchedule } from '@features/court/components/court-aide/TodaySchedule';
import { AlertsBar } from '@features/court/components/court-aide/AlertsBar';
import { WorkCenterStats } from '@features/court/components/court-aide/WorkCenterStats';
import { NotificationDropdown } from '@shared/components/user/NotificationDropdown';

import { Link } from 'react-router-dom';
import { Package, Package2 } from 'lucide-react';

export default function CourtAideWorkCenter() {
  const { user, profile } = useAuth();
  const {
    notifications = [],
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAllNotifications,
  } = useNotifications(user?.id);

  const firstName = profile?.first_name || 'there';
  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="space-y-6 pb-6 px-3 sm:px-0">
      {/* Operations header — no avatar/room/department; this is a work surface, not a profile */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
            Court Aide · Work Center
          </p>
          <h1 className="text-2xl font-bold text-foreground mt-1">
            {firstName ? `${firstName}'s shift` : 'Work Center'}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{today}</p>
        </div>
        <NotificationDropdown
          notifications={notifications as any}
          onMarkAsRead={markAsRead}
          onMarkAllAsRead={markAllAsRead}
          onClearNotification={clearNotification}
          onClearAllNotifications={clearAllNotifications}
        />
      </div>

      {/* Alerts Bar */}
      <AlertsBar />

      {/* Quick Stats */}
      <WorkCenterStats />

      {/* Main Work Panels - Stack on mobile, side by side on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <TaskWorkQueue />
        <SupplyFulfillmentPanel />
      </div>

      {/* Today's Schedule */}
      <TodaySchedule />

      {/* Compact secondary actions — operational only */}
      <div className="flex flex-wrap gap-2 pt-2">
        <Link
          to="/supply-room"
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors"
        >
          <Package2 className="h-4 w-4" />
          Supply Room
        </Link>
        <Link
          to="/inventory"
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors"
        >
          <Package className="h-4 w-4" />
          Inventory
        </Link>
      </div>
    </div>
  );
}
