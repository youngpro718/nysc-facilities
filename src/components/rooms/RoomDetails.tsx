
import { useEffect, useState } from "react";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Loader2, Building2, Layers, Users, Calendar, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface RoomDetailsProps {
  roomId?: string;
  isOpen: boolean;
  onClose: () => void;
}

interface RoomData {
  id: string;
  name: string;
  room_number: string;
  status: string;
  floor_id: string;
  floor_name?: string;
  building_name?: string;
  current_function?: string;
  room_type?: string;
  description?: string;
  current_occupancy?: number;
  capacity?: number;
  assigned_occupants?: any[];
}

export function RoomDetails({ roomId, isOpen, onClose }: RoomDetailsProps) {
  const [room, setRoom] = useState<RoomData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (roomId && isOpen) {
      fetchRoomDetails(roomId);
    }
  }, [roomId, isOpen]);

  const fetchRoomDetails = async (id: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select(`
          id,
          name,
          room_number,
          status,
          floor_id,
          current_function,
          room_type,
          description,
          current_occupancy,
          capacity,
          floors:floor_id (
            name,
            buildings:building_id (
              name
            )
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      // Format the room data
      const formattedRoom: RoomData = {
        ...data,
        floor_name: data.floors?.name,
        building_name: data.floors?.buildings?.name,
      };

      // Fetch assigned occupants
      const { data: occupantsData, error: occupantsError } = await supabase
        .from('occupant_room_assignments')
        .select(`
          id,
          is_primary,
          assigned_at,
          occupants:occupant_id (
            id,
            first_name,
            last_name,
            title,
            email
          )
        `)
        .eq('room_id', id);

      if (!occupantsError && occupantsData) {
        formattedRoom.assigned_occupants = occupantsData;
      }

      setRoom(formattedRoom);
    } catch (err) {
      console.error('Error fetching room details:', err);
      setError('Failed to load room details. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {loading ? 'Loading Room Details...' : room?.name}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full">
              <p className="text-red-500 mb-4">{error}</p>
              <Button onClick={onClose}>Close</Button>
            </div>
          ) : room ? (
            <ScrollArea className="h-full pr-4">
              <div className="space-y-4 p-1">
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5" />
                    {room.building_name}
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Layers className="h-3.5 w-3.5" />
                    {room.floor_name}
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    Room {room.room_number}
                  </Badge>
                  <Badge 
                    variant={room.status === 'active' ? 'default' : 'secondary'}
                    className="flex items-center gap-1"
                  >
                    {room.status}
                  </Badge>
                </div>

                <Tabs defaultValue="details">
                  <TabsList className="w-full justify-start mb-4">
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="occupants">Occupants</TabsTrigger>
                    <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
                  </TabsList>

                  <TabsContent value="details" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Room Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Type</p>
                            <p className="font-medium">{room.room_type || 'Not specified'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Current Function</p>
                            <p className="font-medium">{room.current_function || 'Not specified'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Capacity</p>
                            <p className="font-medium">{room.capacity || 'Not specified'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Current Occupancy</p>
                            <p className="font-medium">{room.current_occupancy || '0'}</p>
                          </div>
                        </div>
                        
                        {room.description && (
                          <div className="mt-4">
                            <p className="text-sm text-muted-foreground mb-1">Description</p>
                            <p>{room.description}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="occupants">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Assigned Occupants</CardTitle>
                        <CardDescription>
                          People currently assigned to this room
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {room.assigned_occupants?.length ? (
                          <div className="space-y-4">
                            {room.assigned_occupants.map((assignment) => (
                              <div key={assignment.id} className="flex justify-between items-start border-b pb-3">
                                <div>
                                  <p className="font-medium">
                                    {assignment.occupants?.first_name} {assignment.occupants?.last_name}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {assignment.occupants?.title || 'No title'}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {assignment.occupants?.email}
                                  </p>
                                </div>
                                <Badge variant={assignment.is_primary ? "default" : "outline"}>
                                  {assignment.is_primary ? "Primary" : "Secondary"}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            <Users className="h-12 w-12 mx-auto mb-2 opacity-20" />
                            <p>No occupants currently assigned to this room</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="maintenance">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Maintenance History</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center py-8 text-muted-foreground">
                          <Info className="h-12 w-12 mx-auto mb-2 opacity-20" />
                          <p>No maintenance records available</p>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            </ScrollArea>
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <p className="text-muted-foreground mb-4">Room not found</p>
              <Button onClick={onClose}>Close</Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
