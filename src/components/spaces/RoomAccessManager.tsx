// @ts-nocheck
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { RoomAccessSummary } from "@/components/access/RoomAccessSummary";
import { Search, Plus, UserPlus, Key, MapPin, Users, Building2 } from "lucide-react";
import { format } from "date-fns";

interface Room {
  id: string;
  name: string;
  room_number: string;
  floor_id: string;
  floors: {
    name: string;
    buildings: {
      name: string;
    };
  };
}

interface Occupant {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  department: string | null;
}

export function RoomAccessManager() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedOccupantId, setSelectedOccupantId] = useState("");
  const [assignmentType, setAssignmentType] = useState<"primary" | "secondary">("primary");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get all rooms with building/floor info
  const { data: rooms, isLoading: roomsLoading } = useQuery({
    queryKey: ['rooms-access-manager'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rooms')
        .select(`
          id,
          name,
          room_number,
          floor_id,
          floors!inner (
            name,
            buildings!inner (
              name
            )
          )
        `)
        .eq('status', 'active')
        .order('room_number');

      if (error) throw error;
      return (data as Record<string, unknown>)?.map((room: Record<string, unknown>) => ({
        ...room,
        floors: room.floors?.[0] || { name: 'Unknown Floor', buildings: { name: 'Unknown Building' } }
      })) || [];
    },
  });

  // Get all occupants for assignment
  const { data: occupants } = useQuery({
    queryKey: ['occupants-for-assignment'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('occupants')
        .select('id, first_name, last_name, email, department')
        .eq('status', 'active')
        .order('last_name');

      if (error) throw error;
      return data as Occupant[];
    },
  });

  // Get current room assignments for selected room
  const { data: currentAssignments, isLoading: assignmentsLoading } = useQuery({
    queryKey: ['room-assignments', selectedRoomId],
    queryFn: async () => {
      if (!selectedRoomId) return [];

      const { data, error } = await supabase
        .from('occupant_room_assignments')
        .select(`
          id,
          occupant_id,
          is_primary,
          assignment_type,
          assigned_at,
          expiration_date
        `)
        .eq('room_id', selectedRoomId)
        .is('expiration_date', null);

      if (error) throw error;

      // Get occupant details
      const occupantIds = data.map(a => a.occupant_id).filter(Boolean);
      if (occupantIds.length === 0) return [];

      const { data: occupantDetails, error: occupantError } = await supabase
        .from('occupants')
        .select('id, first_name, last_name, department')
        .in('id', occupantIds);

      if (occupantError) throw occupantError;

      return data.map(assignment => {
        const occupant = occupantDetails?.find(o => o.id === assignment.occupant_id);
        return {
          ...assignment,
          occupant
        };
      });
    },
    enabled: !!selectedRoomId,
  });

  // Assign occupant to room
  const assignMutation = useMutation({
    mutationFn: async ({ occupantId, roomId, isPrimary, type }: {
      occupantId: string;
      roomId: string;
      isPrimary: boolean;
      type: string;
    }) => {
      const { error } = await supabase
        .from('occupant_room_assignments')
        .insert({
          occupant_id: occupantId,
          room_id: roomId,
          is_primary: isPrimary,
          assignment_type: type,
          assigned_at: new Date().toISOString()
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Occupant assigned to room successfully" });
      setIsAssignDialogOpen(false);
      setSelectedOccupantId("");
      queryClient.invalidateQueries({ queryKey: ['room-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['roomAccess'] });
    },
    onError: (error: unknown) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to assign occupant to room",
        variant: "destructive" 
      });
    },
  });

  // Remove assignment
  const removeMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      const { error } = await supabase
        .from('occupant_room_assignments')
        .update({ expiration_date: new Date().toISOString() })
        .eq('id', assignmentId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Room assignment removed successfully" });
      queryClient.invalidateQueries({ queryKey: ['room-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['roomAccess'] });
    },
    onError: (error: unknown) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to remove assignment",
        variant: "destructive" 
      });
    },
  });

  const filteredRooms = rooms?.filter(room =>
    room.room_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    room.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const selectedRoom = rooms?.find(r => r.id === selectedRoomId);

  const handleAssign = () => {
    if (!selectedOccupantId || !selectedRoomId) return;
    
    assignMutation.mutate({
      occupantId: selectedOccupantId,
      roomId: selectedRoomId,
      isPrimary: assignmentType === "primary",
      type: assignmentType
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search rooms by number or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        {selectedRoomId && (
          <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Assign Occupant
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assign Occupant to Room</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Room</label>
                  <p className="text-sm text-muted-foreground">
                    {selectedRoom?.room_number} - {selectedRoom?.name}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Occupant</label>
                  <Select value={selectedOccupantId} onValueChange={setSelectedOccupantId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select occupant" />
                    </SelectTrigger>
                    <SelectContent>
                      {occupants?.map((occupant) => (
                        <SelectItem key={occupant.id} value={occupant.id}>
                          {occupant.first_name} {occupant.last_name}
                          {occupant.department && ` (${occupant.department})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Assignment Type</label>
                  <Select value={assignmentType} onValueChange={(value: "primary" | "secondary") => setAssignmentType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="primary">Primary Occupant</SelectItem>
                      <SelectItem value="secondary">Secondary Access</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleAssign}
                    disabled={!selectedOccupantId || assignMutation.isPending}
                  >
                    {assignMutation.isPending ? "Assigning..." : "Assign"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Room Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Rooms
            </CardTitle>
          </CardHeader>
          <CardContent>
            {roomsLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 bg-muted rounded animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredRooms.map((room) => (
                  <div
                    key={room.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedRoomId === room.id 
                        ? 'border-primary bg-primary/5' 
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedRoomId(room.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Room {room.room_number}</div>
                        <div className="text-sm text-muted-foreground">{room.name}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {room.floors?.buildings?.name} • {room.floors?.name}
                        </div>
                      </div>
                      {selectedRoomId === room.id && (
                        <div className="w-2 h-2 bg-primary rounded-full" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Room Access Details */}
        <div className="space-y-4">
          {selectedRoomId ? (
            <>
              <RoomAccessSummary roomId={selectedRoomId} />
              
              {/* Current Assignments */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Current Assignments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {assignmentsLoading ? (
                    <div className="space-y-2">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-16 bg-muted rounded animate-pulse" />
                      ))}
                    </div>
                  ) : currentAssignments?.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No current assignments for this room
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {currentAssignments?.map((assignment) => (
                        <div key={assignment.id} className="flex items-center justify-between p-3 border rounded">
                          <div>
                            <div className="font-medium">
                              {assignment.occupant?.first_name} {assignment.occupant?.last_name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {assignment.occupant?.department}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Assigned: {format(new Date(assignment.assigned_at), "MMM d, yyyy")}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={assignment.is_primary ? "default" : "secondary"}>
                              {assignment.is_primary ? "Primary" : assignment.assignment_type}
                            </Badge>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => removeMutation.mutate(assignment.id)}
                              disabled={removeMutation.isPending}
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                <Building2 className="h-8 w-8 mx-auto mb-2" />
                <p>Select a room to view access details</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}