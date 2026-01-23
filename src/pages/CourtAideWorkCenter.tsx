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
import { Card, CardContent } from '@/components/ui/card';
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
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            {greeting}, {firstName}
          </h1>
          <p className="text-muted-foreground">
            {format(today, 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link to="/inventory">
              <Package className="h-4 w-4 mr-2" />
              Inventory
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/tasks">
              <ClipboardList className="h-4 w-4 mr-2" />
              All Tasks
            </Link>
          </Button>
          <Button variant="ghost" size="icon" asChild>
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

      {/* Main Work Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Task Queue */}
        <TaskWorkQueue />

        {/* Right: Supply Fulfillment */}
        <SupplyFulfillmentPanel />
      </div>

      {/* Today's Schedule */}
      <TodaySchedule />

      {/* Quick Actions Footer */}
      <Card className="bg-muted/50">
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button variant="outline" asChild>
              <Link to="/supply-room">
                <Package className="h-4 w-4 mr-2" />
                Supply Room
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/operations?tab=issues">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Report Issue
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
