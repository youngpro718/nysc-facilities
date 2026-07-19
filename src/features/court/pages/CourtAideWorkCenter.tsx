/**
 * Court Aide Work Center
 * 
 * Purpose-built dashboard for Court Aides focused on work execution.
 * Shows tasks, supply fulfillment, schedule, and alerts.
 */

import { useAuth } from '@features/auth/hooks/useAuth';
import { TaskWorkQueue } from '@features/court/components/court-aide/TaskWorkQueue';
import { SupplyFulfillmentPanel } from '@features/court/components/court-aide/SupplyFulfillmentPanel';
import { TodaySchedule } from '@features/court/components/court-aide/TodaySchedule';
import { AlertsBar } from '@features/court/components/court-aide/AlertsBar';
import { WorkCenterStats } from '@features/court/components/court-aide/WorkCenterStats';
import { useCourtAideRealtime } from '@features/court/hooks/useCourtAideRealtime';

import { Link } from 'react-router-dom';
import { Package, Package2 } from 'lucide-react';

export default function CourtAideWorkCenter() {
  const { profile } = useAuth();
  useCourtAideRealtime();

  const firstName = profile?.first_name || 'there';
  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="space-y-6 pb-6 px-3 sm:px-0">
      {/* Operations header — matches AdminGreeting's eyebrow + overview + date pattern.
          No personal first-name addressing; this is a work surface, not a profile. */}
      <div className="flex flex-col items-start justify-between gap-4 border-b border-border pb-5 sm:flex-row sm:items-end">
        <div>
          <p className="mb-1 text-xs font-medium text-primary">Court aide</p>
          <h1 className="text-[length:var(--text-page-title)] font-semibold tracking-[-0.025em]">
            Work center
          </h1>
          <p className="mt-1 text-sm text-text-secondary tabular">
            {today} · Today's tasks, supplies, and alerts
          </p>
        </div>
        {/* Notifications live in the global header bell */}
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
