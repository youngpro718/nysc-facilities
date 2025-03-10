
import { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { CreateRoomDialog } from "../dialogs/CreateRoomDialog";
import { Separator } from "@/components/ui/separator";
import { GridView } from "../views/GridView";
import { ListView } from "../views/ListView";
import { RoomCard } from "../rooms/RoomCard";
import { Room } from "../rooms/types/RoomTypes";
import { 
  Tabs, 
  TabsList, 
  TabsTrigger, 
  TabsContent 
} from "@/components/ui/tabs";
import { 
  Alert,
  AlertDescription
} from "@/components/ui/alert";
import { AlertCircle, ArrowUp, ArrowDown } from "lucide-react";

interface RoomParams {
  buildingId?: string;
  floorId?: string;
}

// Simple mock deleteRoom function for testing
const mockDeleteRoom = (id: string) => {
  console.log(`Deleting room ${id}`);
  // In a real app, this would call an API
  return Promise.resolve();
};

const RoomsPage = () => {
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [sortField, setSortField] = useState<string>('name');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const params = useParams<Record<string, string>>();
  const location = useLocation();
  
  // Extract building and floor IDs from URL
  const buildingId = params.buildingId || 'all';
  const floorId = params.floorId || 'all';
  
  // Fetch rooms data based on URL parameters
  const { data: rooms, isLoading, error } = useQuery({
    queryKey: ['rooms', buildingId, floorId],
    queryFn: async () => {
      let query = supabase.from('rooms').select('*');
      
      if (buildingId !== 'all') {
        query = query.eq('building_id', buildingId);
      }
      
      if (floorId !== 'all') {
        query = query.eq('floor_id', floorId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Room[];
    }
  });
  
  useEffect(() => {
    // Reset sort order when route changes
    setSortField('name');
    setSortOrder('asc');
  }, [location.pathname]);
  
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Error loading rooms: {(error as Error).message}
        </AlertDescription>
      </Alert>
    );
  }
  
  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };
  
  const handleSort = (field: string) => {
    if (field === sortField) {
      toggleSortOrder();
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };
  
  const sortedRooms = rooms ? [...rooms].sort((a, b) => {
    const aValue = a[sortField as keyof Room];
    const bValue = b[sortField as keyof Room];
    
    if (sortOrder === 'asc') {
      return String(aValue).localeCompare(String(bValue));
    } else {
      return String(bValue).localeCompare(String(aValue));
    }
  }) : [];
  
  const courtrooms = sortedRooms.filter(room => room.room_type === 'courtroom');
  const storageRooms = sortedRooms.filter(room => room.is_storage);
  const otherRooms = sortedRooms.filter(room => 
    room.room_type !== 'courtroom' && !room.is_storage
  );
  
  const renderSortIndicator = (field: string) => {
    if (field !== sortField) return null;
    return sortOrder === 'asc' ? <ArrowUp className="inline h-4 w-4 ml-1" /> : <ArrowDown className="inline h-4 w-4 ml-1" />;
  };
  
  const handleViewChange = (mode: 'grid' | 'list') => {
    setViewMode(mode);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Rooms</h1>
        <div className="flex space-x-2">
          <Button 
            variant={viewMode === 'grid' ? 'default' : 'outline'} 
            onClick={() => handleViewChange('grid')}
          >
            Grid
          </Button>
          <Button 
            variant={viewMode === 'list' ? 'default' : 'outline'} 
            onClick={() => handleViewChange('list')}
          >
            List
          </Button>
          <CreateRoomDialog />
        </div>
      </div>
      
      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All Rooms ({sortedRooms.length})</TabsTrigger>
          <TabsTrigger value="court">Courtrooms ({courtrooms.length})</TabsTrigger>
          <TabsTrigger value="storage">Storage ({storageRooms.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all">
          {viewMode === 'grid' ? (
            <GridView 
              items={sortedRooms}
              renderItem={(room) => (
                <RoomCard room={room} onDelete={mockDeleteRoom} />
              )}
            />
          ) : (
            <ListView 
              items={sortedRooms}
              renderRow={(room) => (
                <RoomCard room={room} onDelete={mockDeleteRoom} />
              )}
              headers={<>Rooms</>}
            />
          )}
        </TabsContent>
        
        <TabsContent value="court">
          {viewMode === 'grid' ? (
            <GridView 
              items={courtrooms}
              renderItem={(room) => (
                <RoomCard room={room} onDelete={mockDeleteRoom} />
              )}
            />
          ) : (
            <ListView 
              items={courtrooms}
              renderRow={(room) => (
                <RoomCard room={room} onDelete={mockDeleteRoom} />
              )}
              headers={<>Courtrooms</>}
            />
          )}
        </TabsContent>
        
        <TabsContent value="storage">
          {viewMode === 'grid' ? (
            <GridView 
              items={storageRooms}
              renderItem={(room) => (
                <RoomCard room={room} onDelete={mockDeleteRoom} />
              )}
            />
          ) : (
            <ListView 
              items={storageRooms}
              renderRow={(room) => (
                <RoomCard room={room} onDelete={mockDeleteRoom} />
              )}
              headers={<>Storage Rooms</>}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RoomsPage;
