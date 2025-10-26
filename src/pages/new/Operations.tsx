/**
 * Operations Page
 * 
 * Unified operations hub (issues, maintenance, requests)
 * Route: /ops
 * 
 * @page
 */

import { useSearchParams } from 'react-router-dom';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus } from 'lucide-react';

export default function Operations() {
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'issues';

  // TODO: Implement hooks
  // const { data: issues, isLoading, error } = useIssues(filters);
  // const { data: maintenance } = useMaintenanceSchedule(filters);
  // const { data: keyRequests } = useKeyRequests(filters);
  // const { data: supplyRequests } = useSupplyRequests(filters);

  const isLoading = false;
  const error = null;
  const issues = [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Operations</h1>
        </div>
        <LoadingSkeleton type="card" count={6} />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage error={error} onRetry={() => {}} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Operations</h1>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Issue
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="border rounded-lg p-4 flex-1">
          <p className="text-sm text-muted-foreground">Filters will appear here</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue={activeTab}>
        <TabsList>
          <TabsTrigger value="issues">Issues</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="keys">Key Requests</TabsTrigger>
          <TabsTrigger value="supplies">Supply Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="issues" className="space-y-4">
          {issues.length === 0 ? (
            <EmptyState
              title="No issues found"
              description="Create a new issue or adjust your filters"
              action={{
                label: 'Create Issue',
                onClick: () => console.log('Create issue'),
              }}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium px-2 py-1 rounded bg-red-100 text-red-800">
                      High
                    </span>
                    <span className="text-xs text-muted-foreground">Room 101</span>
                  </div>
                  <h3 className="font-semibold mb-2">Issue Title {i + 1}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Brief description of the issue
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">View</Button>
                    <Button size="sm" variant="outline">Assign</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="maintenance">
          <div className="border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Maintenance Schedule</h2>
            <p className="text-muted-foreground">Maintenance items will appear here</p>
          </div>
        </TabsContent>

        <TabsContent value="keys">
          <div className="border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Key Requests</h2>
            <p className="text-muted-foreground">Key requests will appear here</p>
          </div>
        </TabsContent>

        <TabsContent value="supplies">
          <div className="border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Supply Requests</h2>
            <p className="text-muted-foreground">Supply requests will appear here</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
