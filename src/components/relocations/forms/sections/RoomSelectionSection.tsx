
import { BuildingFloorNav } from "@/components/spaces/navigation/BuildingFloorNav";
import { RoomSelectionSection as BaseRoomSelectionSection } from "@/components/occupants/components/RoomSelectionSection";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { useState, useMemo } from "react";
import { useRoomsQuery } from "@/components/spaces/hooks/queries/useRoomsQuery";
import { UseFormReturn } from "react-hook-form";
import { CreateRelocationFormData } from "../../types/relocationTypes";

interface RoomSelectionSectionProps {
  form: UseFormReturn<CreateRelocationFormData>;
}

export function RoomSelectionSection({ form }: RoomSelectionSectionProps) {
  const [selectedBuilding, setSelectedBuilding] = useState<string>("all");
  const [selectedFloor, setSelectedFloor] = useState<string>("all");
  const [originalSearchQuery, setOriginalSearchQuery] = useState("");
  const [temporarySearchQuery, setTemporarySearchQuery] = useState("");

  const { data: rooms, isLoading: isLoadingRooms } = useRoomsQuery({
    buildingId: selectedBuilding === 'all' ? undefined : selectedBuilding,
    floorId: selectedFloor === 'all' ? undefined : selectedFloor,
  });

  const filteredOriginalRooms = useMemo(() => 
    rooms?.filter(room => 
      room.name.toLowerCase().includes(originalSearchQuery.toLowerCase()) ||
      room.room_number?.toLowerCase().includes(originalSearchQuery.toLowerCase()) ||
      room.floor?.building?.name?.toLowerCase().includes(originalSearchQuery.toLowerCase()) ||
      room.floor?.name?.toLowerCase().includes(originalSearchQuery.toLowerCase())
    ) || [], [rooms, originalSearchQuery]
  );

  const filteredTemporaryRooms = useMemo(() => 
    rooms?.filter(room => 
      room.name.toLowerCase().includes(temporarySearchQuery.toLowerCase()) ||
      room.room_number?.toLowerCase().includes(temporarySearchQuery.toLowerCase()) ||
      room.floor?.building?.name?.toLowerCase().includes(temporarySearchQuery.toLowerCase()) ||
      room.floor?.name?.toLowerCase().includes(temporarySearchQuery.toLowerCase())
    ) || [], [rooms, temporarySearchQuery]
  );

  return (
    <>
      <BuildingFloorNav
        selectedBuilding={selectedBuilding}
        selectedFloor={selectedFloor}
        onBuildingChange={setSelectedBuilding}
        onFloorChange={setSelectedFloor}
      />

      <div className="grid gap-6 md:grid-cols-2">
        <FormField
          control={form.control}
          name="original_room_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Original Room</FormLabel>
              <FormControl>
                <BaseRoomSelectionSection
                  searchQuery={originalSearchQuery}
                  onSearchChange={setOriginalSearchQuery}
                  selectedRoom={field.value}
                  onRoomChange={field.onChange}
                  filteredRooms={filteredOriginalRooms}
                  isLoadingRooms={isLoadingRooms}
                  label="Original Room"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="temporary_room_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Temporary Room</FormLabel>
              <FormControl>
                <BaseRoomSelectionSection
                  searchQuery={temporarySearchQuery}
                  onSearchChange={setTemporarySearchQuery}
                  selectedRoom={field.value}
                  onRoomChange={field.onChange}
                  filteredRooms={filteredTemporaryRooms}
                  isLoadingRooms={isLoadingRooms}
                  label="Temporary Room"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </>
  );
}
