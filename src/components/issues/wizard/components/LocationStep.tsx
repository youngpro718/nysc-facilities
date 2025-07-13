
import React, { useState } from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Loader2, Building2, DoorClosed } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { WizardStepProps } from '../types/index';
import { UserAssignment } from "@/types/dashboard";

interface LocationStepProps extends WizardStepProps {
  assignedRooms?: UserAssignment[];
}

export function LocationStep({ form, assignedRooms }: LocationStepProps) {
  const [useAssignedRoom, setUseAssignedRoom] = useState(!!assignedRooms?.length);
  
  const buildingId = form.watch('building_id') || "";
  const floorId = form.watch('floor_id') || "";

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
    enabled: !!buildingId,
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
    enabled: !!floorId,
  });

  return (
    <div className="space-y-6">
      {assignedRooms && assignedRooms.length > 0 && (
        <Card className="p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DoorClosed className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-medium">Room Selection</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Use assigned room</span>
                <Switch
                  checked={useAssignedRoom}
                  onCheckedChange={setUseAssignedRoom}
                />
              </div>
            </div>

            {useAssignedRoom && (
              <RadioGroup
                value={form.watch('room_id') || ''}
                onValueChange={(roomId) => {
                  const selectedRoom = assignedRooms.find(room => room.room_id === roomId);
                  if (selectedRoom) {
                    form.setValue('building_id', selectedRoom.building_id || '');
                    form.setValue('floor_id', selectedRoom.floor_id || '');
                    form.setValue('room_id', roomId);
                  }
                }}
                className="grid grid-cols-1 gap-3"
              >
                {assignedRooms.map((room) => (
                  <div key={room.id} className="relative group">
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
                        "touch-manipulation min-h-[60px]" // Better mobile touch targets
                      )}
                    >
                      <div className="flex-shrink-0">
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                          "peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground",
                          "bg-muted text-muted-foreground group-hover:bg-primary/20"
                        )}>
                          <DoorClosed className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate">{room.room_name}</div>
                        <div className="text-sm text-muted-foreground truncate">
                          {room.building_name} • Floor {room.floor_name}
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
            )}
          </div>
        </Card>
      )}

      {(!useAssignedRoom || !assignedRooms?.length) && (
        <div className="space-y-6">
          <FormField
            control={form.control}
            name="building_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Building</FormLabel>
                <Select 
                  onValueChange={(value) => {
                    field.onChange(value);
                    // Clear dependent fields when building changes
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
                  <SelectContent className="z-[100] bg-background">
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
                      // Clear dependent field when floor changes
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
                    <SelectContent className="z-[90] bg-background">
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
                    <SelectContent className="z-[80] bg-background">
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
        </div>
      )}
    </div>
  );
}
