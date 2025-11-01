/**
 * Facility Detail Page
 * 
 * Detailed view of a single facility
 * Route: /facilities/:id
 * 
 * Implements service-layer pattern:
 * - Uses custom React Query hooks
 * - No direct Supabase queries
 * - Proper loading/error/empty states
 * - Tabbed interface for different data views
 * 
 * @page
 */

import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Users, 
  Home, 
  MapPin,
  Calendar,
  Ruler,
  Package
} from 'lucide-react';
import { useRoom } from '@/hooks/facilities/useFacilities';

export default function FacilityDetail() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const activeTab = searchParams.get('tab') || 'info';

  // Fetch room data using custom hook
  const { data: room, isLoading, error, refetch } = useRoom(id!, !!id);

  // TODO: Add these hooks when services are available
  // const { data: issues } = useFacilityIssues(id);
  // const { data: keys } = useFacilityKeys(id);
  // const { data: history } = useFacilityHistory(id);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton type="card" count={1} />
        <LoadingSkeleton type="list" count={5} />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage error={error} onRetry={refetch} />;
  }

  if (!room) {
    return (
      <EmptyState
        title="Room not found"
        description="The requested facility could not be found"
        action={{
          label: 'Back to Facilities',
          onClick: () => navigate('/facilities'),
        }}
      />
    );
  }

  // Helper function to get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'occupied':
        return 'bg-blue-100 text-blue-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      case 'reserved':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/facilities')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{room.room_number}</h1>
              <span className={`px-3 py-1 text-sm rounded-full ${getStatusColor(room.status)}`}>
                {room.status}
              </span>
            </div>
            <p className="text-muted-foreground mt-1">
              {room.building?.name}, Floor {room.floor?.floor_number}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="outline">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue={activeTab}>
        <TabsList>
          <TabsTrigger value="info">Information</TabsTrigger>
          <TabsTrigger value="occupants">Occupants</TabsTrigger>
          <TabsTrigger value="issues">Issues</TabsTrigger>
          <TabsTrigger value="keys">Keys & Access</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* Information Tab */}
        <TabsContent value="info" className="space-y-4">
          {/* Basic Information */}
          <div className="border rounded-lg p-6 bg-card">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Home className="h-5 w-5" />
              Room Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Room Number</p>
                <p className="font-medium">{room.room_number}</p>
              </div>
              {room.room_name && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Room Name</p>
                  <p className="font-medium">{room.room_name}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground mb-1">Type</p>
                <p className="font-medium">{room.room_type || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Capacity</p>
                <p className="font-medium">{room.capacity || 'N/A'} people</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Square Footage</p>
                <p className="font-medium">{room.square_footage || 'N/A'} sq ft</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Status</p>
                <p className="font-medium capitalize">{room.status}</p>
              </div>
            </div>
          </div>

          {/* Location Information */}
          <div className="border rounded-lg p-6 bg-card">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Location
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Building</p>
                <p className="font-medium">{room.building?.name || 'N/A'}</p>
                {room.building?.address && (
                  <p className="text-sm text-muted-foreground mt-1">{room.building.address}</p>
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Floor</p>
                <p className="font-medium">
                  Floor {room.floor?.floor_number} - {room.floor?.name || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Amenities */}
          {room.amenities && room.amenities.length > 0 && (
            <div className="border rounded-lg p-6 bg-card">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Package className="h-5 w-5" />
                Amenities
              </h2>
              <div className="flex flex-wrap gap-2">
                {room.amenities.map((amenity: string, index: number) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm"
                  >
                    {amenity}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="border rounded-lg p-6 bg-card">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Metadata
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Created</p>
                <p className="font-medium">
                  {room.created_at ? new Date(room.created_at).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Last Updated</p>
                <p className="font-medium">
                  {room.updated_at ? new Date(room.updated_at).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Occupants Tab */}
        <TabsContent value="occupants">
          <div className="border rounded-lg p-6 bg-card">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Users className="h-5 w-5" />
              Current Occupants
            </h2>
            {room.occupants && room.occupants.length > 0 ? (
              <div className="space-y-3">
                {room.occupants.map((occupant: any) => (
                  <div key={occupant.id} className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {occupant.first_name} {occupant.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">{occupant.title || occupant.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No occupants assigned to this room</p>
            )}
          </div>
        </TabsContent>

        {/* Issues Tab */}
        <TabsContent value="issues">
          <div className="border rounded-lg p-6 bg-card">
            <h2 className="text-xl font-semibold mb-4">Issues</h2>
            <p className="text-muted-foreground">
              Issue tracking will be available when the issues module is implemented
            </p>
          </div>
        </TabsContent>

        {/* Keys Tab */}
        <TabsContent value="keys">
          <div className="border rounded-lg p-6 bg-card">
            <h2 className="text-xl font-semibold mb-4">Keys & Access</h2>
            <p className="text-muted-foreground">
              Key assignments will be available when the keys module is implemented
            </p>
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <div className="border rounded-lg p-6 bg-card">
            <h2 className="text-xl font-semibold mb-4">Change History</h2>
            <p className="text-muted-foreground">
              Change history will be available when the audit log module is implemented
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
