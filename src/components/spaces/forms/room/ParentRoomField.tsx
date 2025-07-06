
// Parent-room feature temporarily removed. Stub component:
import React from 'react';

export const PARENT_ROOM_TYPES: string[] = [];
export const CAN_HAVE_PARENT_ROOM_TYPES: string[] = [];

export function ParentRoomField() {
  return null;
}

// End stub.
 "react";
import { UseFormReturn } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RoomFormData } from "./RoomFormSchema";

// Only these room types can be parents or have parents (string literals, must match DB exactly)
export const PARENT_ROOM_TYPES = ["office", "storage"];
// Parent-room feature disabled
export const CAN_HAVE_PARENT_ROOM_TYPES: string[] = [];

interface ParentRoomFieldProps {
  form: UseFormReturn<RoomFormData>;
  floorId: string;
  roomType: string; // Pass in the roomType directly
  currentRoomId?: string;
}

// Simplified no-op component while parent-room feature is removed
export function ParentRoomField() {
  // Evaluate eligibility
  const canHaveParent = CAN_HAVE_PARENT_ROOM_TYPES.includes(roomType);
  const isTypeUnset = !roomType;
  // Debug: print all relevant values before useQuery
  console.log('[ParentRoomField] RENDER: floorId:', floorId, 'roomType:', roomType, 'canHaveParent:', canHaveParent, 'currentRoomId:', currentRoomId);
  const queryKey = ["parent-rooms", floorId, roomType, currentRoomId];
  console.log('[ParentRoomField] QUERY KEY:', queryKey);
  // Query for eligible parent rooms (temporarily always enabled)
  const { data: parentRooms, isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      console.log('[ParentRoomField] QUERY FUNCTION CALLED', { floorId, roomType, currentRoomId });
      try {
        console.log('[ParentRoomField] Querying parent rooms with:', { floorId, roomType, currentRoomId });
        let { data, error } = await supabase
          .from("rooms")
          .select("id, name, room_number, room_type")
          .eq("floor_id", floorId)
          .eq("status", "active")
          .or(`room_type.eq.${PARENT_ROOM_TYPES[0]},room_type.eq.${PARENT_ROOM_TYPES[1]}`)
          .order("name");
        if (error) {
          console.warn('[ParentRoomField] Error on .or query:', error);
          const filterString = `(${PARENT_ROOM_TYPES.map(t => `\"${t}\"`).join(",")})`;
          const fallback = await supabase
            .from("rooms")
            .select("id, name, room_number, room_type")
            .eq("floor_id", floorId)
            .eq("status", "active")
            .filter("room_type", "in", filterString)
            .order("name");
          data = fallback.data;
          if (fallback.error) {
            console.error('[ParentRoomField] Fallback query error:', fallback.error);
            throw fallback.error;
          }
        }
        console.log('[ParentRoomField] Parent room query result:', data);
        if (currentRoomId) {
          return (data || []).filter(room => room.id !== currentRoomId);
        }
        const result = data || [];
        console.log('[ParentRoomField] QUERY FUNCTION RETURNING:', result);
        return result;
      } catch (err) {
        console.error('[ParentRoomField] Parent room query threw:', err);
        throw err;
      }
    },
    enabled: !!floorId && canHaveParent,
  });

  const handleValueChange = (value: string) => {
    form.setValue("parentRoomId", value === "none" ? null : value);
  };
  const getSelectValue = () => form.watch("parentRoomId") || "none";

  console.log('[ParentRoomField] Rendering dropdown with:', { parentRooms, isLoading, error });

  return (
    <FormField
      control={form.control}
      name="parentRoomId"
      render={() => (
        <FormItem>
          <FormLabel>Parent Room</FormLabel>
          <FormControl>
            <Select
              disabled={isTypeUnset || !canHaveParent || isLoading || !parentRooms || parentRooms.length === 0}
              onValueChange={handleValueChange}
              value={getSelectValue()}
            >
              <SelectTrigger>
                <SelectValue placeholder={
                  isTypeUnset
                    ? "Select a room type first"
                    : !canHaveParent
                      ? "This type cannot have a parent"
                      : parentRooms && parentRooms.length === 0
                        ? "No eligible parent rooms"
                        : "Select parent room"
                } />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {parentRooms?.map((room) => (
                  <SelectItem key={room.id} value={room.id}>
                    {room.name} {room.room_number ? `(${room.room_number})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormControl>
          {isTypeUnset && (
            <div className="text-muted-foreground text-sm">Select a room type to enable parent room selection.</div>
          )}
          {!isTypeUnset && !canHaveParent && (
            <div className="text-muted-foreground text-sm">This room type cannot have a parent room.</div>
          )}
          {error && <div className="text-red-500 text-sm">Error loading parent rooms</div>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

