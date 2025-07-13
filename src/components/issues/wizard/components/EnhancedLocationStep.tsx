import React, { useState, useEffect } from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  Loader2, 
  Building2, 
  DoorClosed, 
  Star, 
  Users,
  CheckCircle2,
  MapPin
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { WizardStepProps } from '../types';
import { UserAssignment } from "@/types/dashboard";

interface EnhancedLocationStepProps extends WizardStepProps {
  assignedRooms?: UserAssignment[];
  selectedRoomId?: string;
}

export function EnhancedLocationStep({ 
  form, 
  assignedRooms, 
  selectedRoomId 
}: EnhancedLocationStepProps) {
  const [selectionMode, setSelectionMode] = useState<'assigned' | 'manual'>('assigned');
  
  // Auto-select assigned mode if we have assigned rooms and a pre-selected room
  useEffect(() => {
    if (assignedRooms?.length && selectedRoomId) {
      const isInAssignedRooms = assignedRooms.some(room => room.room_id === selectedRoomId);
      if (isInAssignedRooms) {
        setSelectionMode('assigned');
        form.setValue('room_id', selectedRoomId);
        
        // Auto-populate building and floor data
        const selectedRoom = assignedRooms.find(room => room.room_id === selectedRoomId);
        if (selectedRoom) {
          form.setValue('building_id', selectedRoom.building_id || '');
          form.setValue('floor_id', selectedRoom.floor_id || '');
        }
      }
    }
  }, [selectedRoomId, assignedRooms, form]);
  
  const buildingId = form.watch('building_id') || "";
  const floorId = form.watch('floor_id') || "";

  // Queries for manual selection
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
    },
    enabled: selectionMode === 'manual'
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
    enabled: selectionMode === 'manual' && !!buildingId,
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
    enabled: selectionMode === 'manual' && !!floorId,
  });

  // Sort assigned rooms with primary first
  const sortedAssignedRooms = assignedRooms ? [...assignedRooms].sort((a, b) => {
    if (a.is_primary && !b.is_primary) return -1;
    if (!a.is_primary && b.is_primary) return 1;
    return 0;
  }) : [];

  const handleRoomSelection = (roomId: string) => {
    const selectedRoom = sortedAssignedRooms.find(room => room.room_id === roomId);
    if (selectedRoom) {
      form.setValue('building_id', selectedRoom.building_id || '');
      form.setValue('floor_id', selectedRoom.floor_id || '');
      form.setValue('room_id', roomId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Selection Mode Toggle */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant={selectionMode === 'assigned' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectionMode('assigned')}
          disabled={!sortedAssignedRooms.length}
          className="flex-1"
        >
          <DoorClosed className="w-4 h-4 mr-2" />
          My Rooms ({sortedAssignedRooms.length})
        </Button>
        <Button
          type="button"
          variant={selectionMode === 'manual' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectionMode('manual')}
          className="flex-1"
        >
          <MapPin className="w-4 h-4 mr-2" />
          Browse All Rooms
        </Button>
      </div>

      {/* Assigned Rooms Section */}
      {selectionMode === 'assigned' && sortedAssignedRooms.length > 0 && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <DoorClosed className="w-5 h-5 text-primary" />
              Select Your Room
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={form.watch('room_id') || ''}
              onValueChange={handleRoomSelection}
              className="space-y-3"
            >
              {sortedAssignedRooms.map((room) => (
                <div key={room.id} className="relative group">
                  <RadioGroupItem
                    value={room.room_id}
                    id={`assigned-room-${room.room_id}`}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={`assigned-room-${room.room_id}`}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer",
                      "transition-all duration-200",
                      "hover:border-primary/30 hover:bg-primary/5 hover:scale-[1.01]",
                      "peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10",
                      "peer-data-[state=checked]:shadow-md"
                    )}
                  >
                    <div className="flex-shrink-0">
                      <div className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center transition-colors",
                        form.watch('room_id') === room.room_id
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground group-hover:bg-primary/20"
                      )}>
                        {room.is_primary ? (
                          <Star className="w-5 h-5" />
                        ) : (
                          <DoorClosed className="w-5 h-5" />
                        )}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-base truncate">{room.room_name}</h3>
                        {room.is_primary && (
                          <Badge variant="default" className="text-xs">
                            Primary Office
                          </Badge>
                        )}
                      </div>
                      
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">
                          Room {room.room_number} • {room.building_name}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            <span>Floor {room.floor_name}</span>
                          </div>
                          {room.occupant_count && (
                            <div className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              <span>{room.occupant_count} occupant{room.occupant_count !== 1 ? 's' : ''}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {form.watch('room_id') === room.room_id && (
                      <div className="flex-shrink-0">
                        <CheckCircle2 className="w-6 h-6 text-primary" />
                      </div>
                    )}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>
      )}

      {/* Manual Selection Section */}
      {selectionMode === 'manual' && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              Browse All Locations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
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
                        {floors?.length ? (
                          floors.map((floor) => (
                            <SelectItem key={floor.id} value={floor.id}>
                              Floor {floor.floor_number} - {floor.name}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="p-2 text-center text-sm text-muted-foreground">
                            No floors available
                          </div>
                        )}
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
                    <FormLabel className="flex items-center gap-1">
                      Room
                      <span className="text-destructive">*</span>
                    </FormLabel>
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
                        {rooms?.length ? (
                          rooms.map((room) => (
                            <SelectItem key={room.id} value={room.id}>
                              Room {room.room_number} - {room.name}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="p-2 text-center text-sm text-muted-foreground">
                            No rooms available
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                    {!field.value && (
                      <p className="text-sm text-destructive mt-1">
                        Room selection is required
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* No Rooms Available */}
      {selectionMode === 'assigned' && sortedAssignedRooms.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <DoorClosed className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium mb-2">No Assigned Rooms</h3>
            <p className="text-sm text-muted-foreground mb-4">
              You don't have any assigned rooms yet. Contact your administrator or use the browse option.
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => setSelectionMode('manual')}
            >
              <MapPin className="w-4 h-4 mr-2" />
              Browse All Rooms
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}