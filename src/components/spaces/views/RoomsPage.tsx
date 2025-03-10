import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { GridView } from '../views/GridView';
import { ListView } from '../views/ListView';
import { RoomCard } from '../rooms/RoomCard';
import { useRoomsQuery } from '../hooks/queries/useRoomsQuery';
import { 
  Alert,
  AlertDescription 
} from "@/components/ui/alert";
import { AlertCircle, ArrowUp, ArrowDown } from 'lucide-react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Room } from '../../rooms/types/RoomTypes';

interface RoomParams {
  buildingId: string;
  floorId: string;
}

const sortRooms = (rooms: Room[], sortBy: string): Room[] => {
  const sortedRooms = [...rooms];

  switch (sortBy) {
    case 'name_asc':
      sortedRooms.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'name_desc':
      sortedRooms.sort((a, b) => b.name.localeCompare(a.name));
      break;
    case 'room_number_asc':
      sortedRooms.sort((a, b) => a.room_number.localeCompare(b.room_number));
      break;
    case 'room_number_desc':
      sortedRooms.sort((a, b) => b.room_number.localeCompare(a.room_number));
      break;
    default:
      break;
  }

  return sortedRooms;
};

const RoomsPage = () => {
  const { buildingId, floorId } = useParams<RoomParams>();
  const location = useLocation();
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('name_asc');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: rooms, isLoading, isError, error } = useRoomsQuery({
    buildingId,
    floorId,
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const viewParam = params.get('view');
    if (viewParam === 'grid' || viewParam === 'list') {
      setView(viewParam);
    }
  }, [location.search]);

  if (isLoading) {
    return <div>Loading rooms...</div>;
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          There was an error fetching rooms.
        </AlertDescription>
        <AlertDescription>
          {error?.message}
        </AlertDescription>
      </Alert>
    );
  }

  const sortedRooms = sortRooms(rooms || [], sortBy);

  const filteredRooms = sortedRooms.filter((room) => {
    if (statusFilter === 'all') return true;
    return room.status === statusFilter;
  });

  const handleSortChange = (newSortBy: string) => {
    setSortBy(newSortBy);
  };

  const handleStatusFilterChange = (newStatus: string) => {
    setStatusFilter(newStatus);
  };

  const renderRoomRow = (room: Room) => (
    <>
      <td>{room.name}</td>
      <td>{room.room_number}</td>
      <td>{room.room_type}</td>
      <td>{room.status}</td>
    </>
  );

  const roomHeaders = (
    <>
      <th>Name</th>
      <th>Room Number</th>
      <th>Room Type</th>
      <th>Status</th>
    </>
  );

  return (
    <div className="space-y-6">
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Rooms</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="vacant">Vacant</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          {view === 'grid' ? (
            <GridView
              items={rooms}
              renderItem={(room) => <RoomCard room={room} />}
              emptyMessage="No rooms found"
              type="room"
            />
          ) : (
            <ListView
              items={rooms}
              renderRow={renderRoomRow}
              headers={roomHeaders}
              type="room"
            />
          )}
        </TabsContent>

        <TabsContent value="active">
          {view === 'grid' ? (
            <GridView
              items={rooms}
              renderItem={(room) => <RoomCard room={room} />}
              emptyMessage="No active rooms found"
              type="room"
            />
          ) : (
            <ListView
              items={rooms}
              renderRow={renderRoomRow}
              headers={roomHeaders}
              type="room"
            />
          )}
        </TabsContent>

        <TabsContent value="vacant">
          {view === 'grid' ? (
            <GridView
              items={rooms}
              renderItem={(room) => <RoomCard room={room} />}
              emptyMessage="No vacant rooms found"
              type="room"
            />
          ) : (
            <ListView
              items={rooms}
              renderRow={renderRoomRow}
              headers={roomHeaders}
              type="room"
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RoomsPage;
