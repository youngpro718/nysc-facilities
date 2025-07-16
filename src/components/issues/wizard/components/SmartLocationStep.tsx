import React, { useState, useEffect } from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Loader2, Building2, DoorClosed, Crown, MapPin, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { WizardStepProps } from '../types';
import { DetailedRoomAssignment } from "@/hooks/occupants/useOccupantAssignments";

interface SmartLocationStepProps extends WizardStepProps {
  assignedRooms?: DetailedRoomAssignment[];
  primaryRoom?: DetailedRoomAssignment;
}

export function SmartLocationStep({ form, assignedRooms, primaryRoom }: SmartLocationStepProps) {
  const [locationChoice, setLocationChoice] = useState<'assigned' | 'other'>('assigned');
  
  const buildingId = form.watch('building_id') || "";
  const floorId = form.watch('floor_id') || "";

  // Auto-select primary room if available
  useEffect(() => {
    if (primaryRoom && locationChoice === 'assigned' && !form.getValues('room_id')) {
      form.setValue('building_id', primaryRoom.building_id);
      form.setValue('floor_id', primaryRoom.floor_id);
      form.setValue('room_id', primaryRoom.room_id);
    }
  }, [primaryRoom, locationChoice, form]);

  const { data: buildings = [], isLoading: isLoadingBuildings } = useQuery({
    queryKey: ['buildings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('buildings')
        .select('*')
        .eq('status', 'active')
        .order('name');
      if (error) throw error;
      return data;
    }
  });

  const { data: floors = [], isLoading: isLoadingFloors } = useQuery({
    queryKey: ['floors', buildingId],
    queryFn: async () => {
      if (!buildingId) return [];
      const { data, error } = await supabase
        .from('floors')
        .select('*')
        .eq('building_id', buildingId)
        .eq('status', 'active')
        .order('floor_number');
      if (error) throw error;
      return data;
    },
    enabled: !!buildingId && locationChoice === 'other',
  });

  const { data: rooms = [], isLoading: isLoadingRooms } = useQuery({
    queryKey: ['rooms', floorId],
    queryFn: async () => {
      if (!floorId) return [];
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('floor_id', floorId)
        .eq('status', 'active')
        .order('room_number');
      if (error) throw error;
      return data;
    },
    enabled: !!floorId && locationChoice === 'other',
  });

  const { data: roomOccupants = [], isLoading: isLoadingOccupants } = useQuery({
    queryKey: ['roomOccupants', form.watch('room_id')],
    queryFn: async () => {
      const roomId = form.watch('room_id');
      if (!roomId) return [];
      
      const { data, error } = await supabase
        .from('occupant_room_assignments')
        .select(`
          occupant_id,
          occupants (
            first_name,
            last_name,
            title
          )
        `)
        .eq('room_id', roomId);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!form.watch('room_id'),
  });

  const handleLocationChoiceChange = (choice: 'assigned' | 'other') => {
    setLocationChoice(choice);
    if (choice === 'assigned' && primaryRoom) {
      form.setValue('building_id', primaryRoom.building_id);
      form.setValue('floor_id', primaryRoom.floor_id);
      form.setValue('room_id', primaryRoom.room_id);
    } else {
      form.setValue('building_id', '');
      form.setValue('floor_id', '');
      form.setValue('room_id', '');
    }
  };

  return (
    <div className="space-y-6">
      {/* Location Choice */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Where is this issue located?</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={locationChoice}
            onValueChange={handleLocationChoiceChange}
            className="grid grid-cols-1 gap-4"
          >
            {/* Assigned Rooms Option */}
            {assignedRooms && assignedRooms.length > 0 && (
              <div>
                <RadioGroupItem
                  value="assigned"
                  id="location-assigned"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="location-assigned"
                  className={cn(
                    "flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer",
                    "transition-all duration-200",
                    "hover:border-primary/30 hover:bg-primary/5 hover:scale-[1.01]",
                    "peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10",
                    "peer-data-[state=checked]:shadow-md"
                  )}
                >
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                      <DoorClosed className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">One of my assigned rooms</div>
                    <div className="text-sm text-muted-foreground">
                      Report an issue in a room you have access to ({assignedRooms.length} rooms)
                    </div>
                  </div>
                  {locationChoice === 'assigned' && (
                    <div className="flex-shrink-0">
                      <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-primary-foreground rounded-full" />
                      </div>
                    </div>
                  )}
                </Label>
              </div>
            )}

            {/* Other Location Option */}
            <div>
              <RadioGroupItem
                value="other"
                id="location-other"
                className="peer sr-only"
              />
              <Label
                htmlFor="location-other"
                className={cn(
                  "flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer",
                  "transition-all duration-200",
                  "hover:border-primary/30 hover:bg-primary/5 hover:scale-[1.01]",
                  "peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10",
                  "peer-data-[state=checked]:shadow-md"
                )}
              >
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-muted-foreground" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="font-semibold">Another location</div>
                  <div className="text-sm text-muted-foreground">
                    Report an issue in a different building or room
                  </div>
                </div>
                {locationChoice === 'other' && (
                  <div className="flex-shrink-0">
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-primary-foreground rounded-full" />
                    </div>
                  </div>
                )}
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Assigned Rooms Selection */}
      {locationChoice === 'assigned' && assignedRooms && assignedRooms.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Select the specific room</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={form.watch('room_id') || ''}
              onValueChange={(roomId) => {
                const selectedRoom = assignedRooms.find(room => room.room_id === roomId);
                if (selectedRoom) {
                  form.setValue('building_id', selectedRoom.building_id);
                  form.setValue('floor_id', selectedRoom.floor_id);
                  form.setValue('room_id', roomId);
                }
              }}
              className="grid grid-cols-1 gap-3"
            >
              {assignedRooms.map((room) => (
                <div key={room.id}>
                  <RadioGroupItem
                    value={room.room_id}
                    id={`assigned-room-${room.room_id}`}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={`assigned-room-${room.room_id}`}
                    className={cn(
                      "flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer",
                      "transition-all duration-200",
                      "hover:border-primary/30 hover:bg-primary/5 hover:scale-[1.01]",
                      "peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10",
                      "peer-data-[state=checked]:shadow-md",
                      room.is_primary && "bg-primary/5 border-primary/20"
                    )}
                  >
                    <div className="flex-shrink-0">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center",
                        room.is_primary 
                          ? "bg-primary/20 text-primary" 
                          : "bg-muted text-muted-foreground"
                      )}>
                        {room.is_primary ? (
                          <Crown className="w-5 h-5" />
                        ) : (
                          <MapPin className="w-5 h-5" />
                        )}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="font-semibold truncate">{room.room_name}</div>
                        <Badge variant="outline" className="text-xs">
                          Room {room.room_number}
                        </Badge>
                        {room.is_primary && (
                          <Badge variant="default" className="text-xs">
                            Primary
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground truncate">
                        {room.building_name} • Floor {room.floor_name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {room.assignment_type.replace('_', ' ')}
                      </div>
                    </div>
                    {form.watch('room_id') === room.room_id && (
                      <div className="flex-shrink-0">
                        <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-primary-foreground rounded-full" />
                        </div>
                      </div>
                    )}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>
      )}

      {/* Manual Location Selection */}
      {locationChoice === 'other' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Select location manually</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="building_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Building</FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      field.onChange(value);
                      form.setValue('floor_id', "");
                      form.setValue('room_id', "");
                    }} 
                    value={field.value || ""}
                    disabled={isLoadingBuildings}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={isLoadingBuildings ? "Loading buildings..." : "Select building"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {buildings?.map((building) => (
                        <SelectItem key={building.id} value={building.id}>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            {building.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {buildingId && (
              <FormField
                control={form.control}
                name="floor_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Floor</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        form.setValue('room_id', "");
                      }} 
                      value={field.value || ""}
                      disabled={!buildingId || isLoadingFloors}
                    >
                      <FormControl>
                        <SelectTrigger>
                          {isLoadingFloors ? (
                            <div className="flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span>Loading floors...</span>
                            </div>
                          ) : (
                            <SelectValue placeholder="Select floor" />
                          )}
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {floors?.map((floor) => (
                          <SelectItem key={floor.id} value={floor.id}>
                            Floor {floor.floor_number} - {floor.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {floorId && (
              <FormField
                control={form.control}
                name="room_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Room *</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value || ""}
                      disabled={!floorId || isLoadingRooms}
                      required
                    >
                      <FormControl>
                        <SelectTrigger>
                          {isLoadingRooms ? (
                            <div className="flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span>Loading rooms...</span>
                            </div>
                          ) : (
                            <SelectValue placeholder="Select room" />
                          )}
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {rooms?.map((room) => (
                          <SelectItem key={room.id} value={room.id}>
                            Room {room.room_number} - {room.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* Room Context Information */}
      {form.watch('room_id') && roomOccupants.length > 0 && (
        <Card className="border-info/20 bg-info/5">
          <CardContent className="pt-4">
            <div className="flex items-start gap-2">
              <Users className="h-5 w-5 text-info mt-0.5" />
              <div>
                <div className="font-medium text-sm mb-1">Room Occupants</div>
                <div className="text-sm text-muted-foreground">
                  {roomOccupants.slice(0, 3).map((occ: any, index) => (
                    <span key={occ.occupant_id}>
                      {occ.occupants?.first_name} {occ.occupants?.last_name}
                      {occ.occupants?.title && ` (${occ.occupants.title})`}
                      {index < Math.min(roomOccupants.length, 3) - 1 && ', '}
                    </span>
                  ))}
                  {roomOccupants.length > 3 && (
                    <span> and {roomOccupants.length - 3} others</span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
