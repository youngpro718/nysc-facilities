
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, Users, Package } from "lucide-react";

interface RoomDetailsProps {
  roomId: string;
}

export function RoomDetails({ roomId }: RoomDetailsProps) {
  const { data: room, isLoading, error } = useQuery({
    queryKey: ["room-details", roomId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rooms")
        .select(`
          *,
          floors!rooms_floor_id_fkey (
            name,
            buildings!floors_building_id_fkey (
              name
            )
          )
        `)
        .eq("id", roomId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return <div>Loading room details...</div>;
  }

  if (error) {
    return <div>Error loading room details</div>;
  }

  if (!room) {
    return <div>Room not found</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{room.name}</span>
            <Badge variant={room.status === 'active' ? 'default' : 'secondary'}>
              {room.status}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gray-500" />
              <span className="text-sm">
                Room {room.room_number} - {room.floors?.name}, {room.floors?.buildings?.name}
              </span>
            </div>
            {room.phone_number && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-500" />
                <span className="text-sm">{room.phone_number}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-500" />
              <span className="text-sm">
                Occupancy: {room.current_occupancy || 0}
              </span>
            </div>
            {room.is_storage && (
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-gray-500" />
                <span className="text-sm">
                  Storage: {room.storage_type || 'General'} 
                  {room.storage_capacity && ` (${room.storage_capacity} items)`}
                </span>
              </div>
            )}
          </div>
          
          {room.description && (
            <div>
              <h4 className="font-medium text-sm text-gray-700 mb-1">Description</h4>
              <p className="text-sm text-gray-600">{room.description}</p>
            </div>
          )}

          {room.current_function && (
            <div>
              <h4 className="font-medium text-sm text-gray-700 mb-1">Current Function</h4>
              <p className="text-sm text-gray-600">{room.current_function}</p>
            </div>
          )}

          <div className="flex gap-2">
            <Badge variant="outline">{room.room_type}</Badge>
            {room.is_storage && <Badge variant="secondary">Storage</Badge>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
