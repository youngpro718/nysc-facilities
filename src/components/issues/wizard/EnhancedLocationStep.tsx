// @ts-nocheck
import React, { useState } from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Loader2, Building2, DoorClosed, ChevronDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { logger } from "@/lib/logger";
import { UserAssignment } from "@/types/dashboard";

// Custom Dropdown Component
function CustomDropdown({ 
  value, 
  onValueChange, 
  placeholder, 
  disabled, 
  loading, 
  options = [],
  icon: Icon = Building2,
  className = ""
}: {
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
  loading?: boolean;
  options: Array<{ id: string; name: string; display?: string }>;
  icon?: React.ComponentType<unknown>;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(opt => opt.id === value);

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => !disabled && !loading && setIsOpen(!isOpen)}
        disabled={disabled || loading}
        className={cn(
          "w-full flex items-center justify-between px-3 py-2 text-left",
          "border border-input bg-background rounded-md",
          "hover:bg-accent hover:text-accent-foreground",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          isOpen && "ring-2 ring-ring ring-offset-2"
        )}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Icon className="h-4 w-4 flex-shrink-0" />
          )}
          <span className="truncate">
            {loading ? 'Loading...' : selectedOption ? (selectedOption.display || selectedOption.name) : placeholder}
          </span>
        </div>
        <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-popover border border-border rounded-md shadow-lg">
          <div className="max-h-60 overflow-auto p-1">
            {options.length === 0 ? (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                No options available
              </div>
            ) : (
              options.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    onValueChange(option.id);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 text-sm text-left",
                    "hover:bg-accent hover:text-accent-foreground rounded-sm",
                    "transition-colors focus:outline-none focus:bg-accent",
                    value === option.id && "bg-accent text-accent-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="truncate">{option.display || option.name}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface EnhancedLocationStepProps {
  form: unknown;
  assignedRooms?: UserAssignment[];
}

export function EnhancedLocationStep({ form, assignedRooms }: EnhancedLocationStepProps) {
  const [useAssignedRoom, setUseAssignedRoom] = useState(!!assignedRooms?.length);
  
  const buildingId = form.watch('building_id') || "";
  const floorId = form.watch('floor_id') || "";

  const { data: buildings = [], isLoading: isLoadingBuildings } = useQuery({
    queryKey: ['buildings'],
    queryFn: async () => {
      logger.debug('Fetching buildings...');
      const { data, error } = await supabase
        .from('buildings')
        .select('*')
        .eq('status', 'active')
        .order('name');
      
      logger.debug('Buildings data:', data);
      logger.debug('Buildings error:', error);
      
      if (error) throw error;
      return data || [];
    }
  });

  const { data: floors = [], isLoading: isLoadingFloors } = useQuery({
    queryKey: ['floors', buildingId],
    queryFn: async () => {
      if (!buildingId) return [];
      logger.debug('Fetching floors for building:', buildingId);
      
      const { data, error } = await supabase
        .from('floors')
        .select('*')
        .eq('building_id', buildingId)
        .eq('status', 'active')
        .order('floor_number');
      
      logger.debug('Floors data:', data);
      logger.error('Floors error:', error);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!buildingId,
  });

  const { data: rooms = [], isLoading: isLoadingRooms } = useQuery({
    queryKey: ['rooms', floorId],
    queryFn: async () => {
      if (!floorId) return [];
      logger.debug('Fetching rooms for floor:', floorId);
      
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('floor_id', floorId)
        .eq('status', 'active')
        .order('room_number');
      
      logger.debug('Rooms data:', data);
      logger.debug('Rooms error:', error);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!floorId,
  });

  return (
    <div className="space-y-6">
      {assignedRooms && assignedRooms.length > 0 && (
        <Card className="p-4 bg-muted/30">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DoorClosed className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-medium">Your Assigned Rooms</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Use assigned room</span>
                <input
                  type="checkbox"
                  checked={useAssignedRoom}
                  onChange={(e) => setUseAssignedRoom(e.target.checked)}
                  className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary"
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
                        "touch-manipulation min-h-[60px]"
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
                <FormLabel className="text-base font-medium">Building *</FormLabel>
                <FormControl>
                  <CustomDropdown
                    value={field.value || ""}
                    onValueChange={(value) => {
                      field.onChange(value);
                      // Clear dependent fields when building changes
                      form.setValue('floor_id', "");
                      form.setValue('room_id', "");
                    }}
                    placeholder="Select a building"
                    loading={isLoadingBuildings}
                    options={buildings.map(building => ({
                      id: building.id,
                      name: building.name,
                      display: building.name
                    }))}
                    icon={Building2}
                  />
                </FormControl>
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
                  <FormLabel className="text-base font-medium">Floor *</FormLabel>
                  <FormControl>
                    <CustomDropdown
                      value={field.value || ""}
                      onValueChange={(value) => {
                        field.onChange(value);
                        // Clear dependent field when floor changes
                        form.setValue('room_id', "");
                      }}
                      placeholder="Select a floor"
                      loading={isLoadingFloors}
                      disabled={!buildingId}
                      options={floors.map(floor => ({
                        id: floor.id,
                        name: `Floor ${floor.floor_number} - ${floor.name}`,
                        display: `Floor ${floor.floor_number} - ${floor.name}`
                      }))}
                      icon={Building2}
                    />
                  </FormControl>
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
                  <FormLabel className="text-base font-medium">
                    Room *
                  </FormLabel>
                  <FormControl>
                    <CustomDropdown
                      value={field.value || ""}
                      onValueChange={field.onChange}
                      placeholder="Select a room"
                      loading={isLoadingRooms}
                      disabled={!floorId}
                      options={rooms.map(room => ({
                        id: room.id,
                        name: `Room ${room.room_number} - ${room.name}`,
                        display: `Room ${room.room_number} - ${room.name}`
                      }))}
                      icon={DoorClosed}
                    />
                  </FormControl>
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