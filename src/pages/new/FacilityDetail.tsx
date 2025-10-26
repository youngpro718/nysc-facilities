/**
 * Facility Detail Page
 * 
 * Detailed view of a single facility
 * Route: /facilities/:id
 * 
 * @page
 */

import { useParams, useSearchParams } from 'react-router-dom';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Edit } from 'lucide-react';

export default function FacilityDetail() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'info';

  // TODO: Implement hooks
  // const { data: facility, isLoading, error } = useFacilityDetails(id);
  // const { data: issues } = useFacilityIssues(id);
  // const { data: keys } = useFacilityKeys(id);
  // const { data: history } = useFacilityHistory(id);

  const isLoading = false;
  const error = null;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton type="card" count={1} />
        <LoadingSkeleton type="list" count={5} />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage error={error} onRetry={() => {}} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Room 101</h1>
            <p className="text-muted-foreground">Building A, Floor 1</p>
          </div>
        </div>
        <Button>
          <Edit className="h-4 w-4 mr-2" />
          Edit
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue={activeTab}>
        <TabsList>
          <TabsTrigger value="info">Information</TabsTrigger>
          <TabsTrigger value="issues">Issues</TabsTrigger>
          <TabsTrigger value="keys">Keys & Access</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="3d">3D View</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-4">
          <div className="border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Room Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Room Number</p>
                <p className="font-medium">101</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Type</p>
                <p className="font-medium">Office</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Capacity</p>
                <p className="font-medium">4 people</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="font-medium">Available</p>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="issues">
          <div className="border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Issues</h2>
            <p className="text-muted-foreground">No issues found for this facility</p>
          </div>
        </TabsContent>

        <TabsContent value="keys">
          <div className="border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Keys & Access</h2>
            <p className="text-muted-foreground">Key assignments will appear here</p>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <div className="border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Change History</h2>
            <p className="text-muted-foreground">History will appear here</p>
          </div>
        </TabsContent>

        <TabsContent value="3d">
          <div className="border rounded-lg p-6 min-h-[400px] flex items-center justify-center">
            <p className="text-muted-foreground">3D view will appear here</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
