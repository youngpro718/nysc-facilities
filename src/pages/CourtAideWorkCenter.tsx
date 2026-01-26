/**
 * Court Aide Work Center
 * 
 * Purpose-built dashboard for Court Aides focused on work execution.
 * Shows tasks, supply fulfillment, schedule, and alerts.
 */

import { format } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { TaskWorkQueue } from '@/components/court-aide/TaskWorkQueue';
import { SupplyFulfillmentPanel } from '@/components/court-aide/SupplyFulfillmentPanel';
import { TodaySchedule } from '@/components/court-aide/TodaySchedule';
import { AlertsBar } from '@/components/court-aide/AlertsBar';
import { WorkCenterStats } from '@/components/court-aide/WorkCenterStats';
import { Button } from '@/components/ui/button';

import { Link } from 'react-router-dom';
import { Package, ClipboardList, AlertTriangle, Settings } from 'lucide-react';

export default function CourtAideWorkCenter() {
  const { profile } = useAuth();
  const today = new Date();

  const firstName = profile?.first_name || 'there';
  const greeting = getGreeting();

  function getGreeting() {
    const hour = today.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6 pb-24 md:pb-6">
      {/* Header - Mobile optimized */}
      <div className="space-y-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">
            {greeting}, {firstName}
          </h1>
          <p className="text-sm text-muted-foreground">
            {format(today, 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        
        {/* Action buttons - horizontal scroll on mobile */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
          <Button variant="outline" size="sm" asChild className="shrink-0">
            <Link to="/inventory">
              <Package className="h-4 w-4 mr-2" />
              Inventory
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild className="shrink-0">
            <Link to="/tasks">
              <ClipboardList className="h-4 w-4 mr-2" />
              All Tasks
            </Link>
          </Button>
          <Button variant="ghost" size="icon" asChild className="shrink-0 h-9 w-9">
            <Link to="/profile">
              <Settings className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Alerts Bar */}
      <AlertsBar />

      {/* Quick Stats */}
      <WorkCenterStats />

      {/* Main Work Panels - Stack on mobile, side by side on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Left: Task Queue */}
        <TaskWorkQueue />

        {/* Right: Supply Fulfillment */}
        <SupplyFulfillmentPanel />
      </div>

      {/* Today's Schedule */}
      <TodaySchedule />

      {/* Quick Actions Footer - Sticky on mobile */}
      <div className="fixed bottom-20 left-0 right-0 p-3 bg-background/95 backdrop-blur-sm border-t md:relative md:bottom-auto md:p-0 md:bg-transparent md:border-0 md:backdrop-blur-none">
        <div className="flex items-center justify-center gap-3 max-w-lg mx-auto">
          <Button variant="outline" size="sm" asChild className="flex-1 md:flex-none">
            <Link to="/supply-room">
              <Package className="h-4 w-4 mr-2" />
              Supply Room
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild className="flex-1 md:flex-none">
            <Link to="/operations?tab=issues">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Report Issue
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
