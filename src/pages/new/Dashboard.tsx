/**
 * Dashboard Page
 * 
 * Central hub with system overview
 * Route: /
 * 
 * @page
 */

import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { EmptyState } from '@/components/common/EmptyState';

export default function Dashboard() {
  // TODO: Implement hooks
  // const { data: stats, isLoading, error } = useDashboardStats();
  // const { data: buildings } = useBuildingSummary();
  // const { data: activity } = useRecentActivity();

  const isLoading = false;
  const error = null;
  const hasData = true;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Dashboard</h1>
        </div>
        <LoadingSkeleton type="grid" count={4} />
        <LoadingSkeleton type="card" count={3} />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage error={error} onRetry={() => {}} />;
  }

  if (!hasData) {
    return (
      <EmptyState
        title="No data available"
        description="Dashboard data will appear here once the system is set up"
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="border rounded-lg p-6">
          <h3 className="text-sm font-medium text-muted-foreground">Total Rooms</h3>
          <p className="text-3xl font-bold mt-2">94</p>
        </div>
        <div className="border rounded-lg p-6">
          <h3 className="text-sm font-medium text-muted-foreground">Open Issues</h3>
          <p className="text-3xl font-bold mt-2">2</p>
        </div>
        <div className="border rounded-lg p-6">
          <h3 className="text-sm font-medium text-muted-foreground">Total Keys</h3>
          <p className="text-3xl font-bold mt-2">8</p>
        </div>
        <div className="border rounded-lg p-6">
          <h3 className="text-sm font-medium text-muted-foreground">Personnel</h3>
          <p className="text-3xl font-bold mt-2">150+</p>
        </div>
      </div>

      {/* Building Overview */}
      <div className="border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Building Overview</h2>
        <p className="text-muted-foreground">Building summary will appear here</p>
      </div>

      {/* Recent Activity */}
      <div className="border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        <p className="text-muted-foreground">Recent activity will appear here</p>
      </div>
    </div>
  );
}
