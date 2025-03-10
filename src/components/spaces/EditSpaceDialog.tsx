import { useState, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { EditHallwayForm } from "./forms/hallway/EditHallwayForm";
import { RoomTypeEnum, StatusEnum, StorageTypeEnum } from "./rooms/types/roomEnums";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { EditSpaceFormData } from "./schemas/editSpaceSchema";

interface EditSpaceDialogProps {
  id: string;
  onClose: () => void;
}

export function EditSpaceDialog({ id, onClose }: EditSpaceDialogProps) {
  const [open, setOpen] = useState(false);
  const [isHallway, setIsHallway] = useState(false);
  const [spaceData, setSpaceData] = useState<EditSpaceFormData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSpaceData = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('new_spaces')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;

        // Check if the space is a hallway
        setIsHallway(data.space_type === 'hallway');

        // Fetch additional properties based on space type
        if (data.space_type === 'room') {
          const { data: roomData, error: roomError } = await supabase
            .from('rooms')
            .select('*')
            .eq('id', id)
            .single();

          if (roomError) throw roomError;

          setSpaceData({
            ...data,
            name: data.name,
            roomNumber: roomData.room_number,
            roomType: roomData.room_type as RoomTypeEnum,
            status: roomData.status as StatusEnum,
            description: data.properties?.description || '',
            isStorage: roomData.is_storage,
            storageType: roomData.storage_type as StorageTypeEnum,
            storageCapacity: roomData.storage_capacity,
            storageNotes: roomData.storage_notes,
            parentRoomId: roomData.parent_room_id,
            floorId: data.floor_id,
          } as EditSpaceFormData);
        } else if (data.space_type === 'hallway') {
          const { data: hallwayData, error: hallwayError } = await supabase
            .from('hallway_properties')
            .select('*')
            .eq('space_id', id)
            .single();

          if (hallwayError) throw hallwayError;

          setSpaceData({
            ...data,
            name: data.name,
            description: data.properties?.description || '',
            status: data.status as StatusEnum,
            floorId: data.floor_id,
            section: hallwayData.section,
            trafficFlow: hallwayData.traffic_flow,
            accessibility: hallwayData.accessibility,
            emergencyRoute: hallwayData.emergency_route,
            maintenancePriority: hallwayData.maintenance_priority,
            capacityLimit: hallwayData.capacity_limit,
          } as EditSpaceFormData);
        }
      } catch (error) {
        console.error('Error fetching space data:', error);
        toast.error('Failed to fetch space data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSpaceData();
  }, [id]);

  const handleUpdateConnections = async (spaceId: string, connections: any[]) => {
    try {
      // Delete existing connections
      await supabase
        .from('space_connections')
        .delete()
        .eq('from_space_id', spaceId);

      // Insert new connections if there are any
      if (connections.length > 0) {
        const newConnections = connections.map(conn => ({
          from_space_id: spaceId,
          to_space_id: conn.to_space_id,
          connection_type: conn.connection_type,
          direction: conn.direction || null,
          status: 'active',
          space_type: 'room' // Explicitly set the space type
        }));

        const { error: insertError } = await supabase
          .from('space_connections')
          .insert(newConnections);

        if (insertError) throw insertError;
      }
    } catch (error) {
      console.error('Error updating connections:', error);
      throw error;
    }
  };

  const handleUpdateRoom = async (updatedData: EditSpaceFormData) => {
    try {
      // Update the space data in the new_spaces table
      const { error: spaceError } = await supabase
        .from('new_spaces')
        .update({
          name: updatedData.name,
          floor_id: updatedData.floorId,
          properties: {
            description: updatedData.description
          },
          position: updatedData.position,
          size: updatedData.size,
          rotation: updatedData.rotation,
          status: updatedData.status
        })
        .eq('id', id);

      if (spaceError) throw spaceError;

      // Update the room-specific data in the rooms table
      const { error: roomError } = await supabase
        .from('rooms')
        .update({
          room_number: updatedData.roomNumber,
          room_type: updatedData.roomType,
          status: updatedData.status,
          is_storage: updatedData.isStorage,
          storage_type: updatedData.storageType,
          storage_capacity: updatedData.storageCapacity,
          storage_notes: updatedData.storageNotes,
          parent_room_id: updatedData.parentRoomId,
        })
        .eq('id', id);

      if (roomError) throw roomError;

      // Update space connections
      if (updatedData.connections) {
        await handleUpdateConnections(id, updatedData.connections);
      }

      toast.success('Room updated successfully');
      onClose();
    } catch (error) {
      console.error('Update error:', error);
      toast.error('Failed to update room');
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm">
          Edit
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Edit Space</AlertDialogTitle>
          <AlertDialogDescription>
            {isLoading
              ? 'Loading space details...'
              : `You are editing ${isHallway ? 'a Hallway' : 'a Room'}.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {isLoading ? (
          <div>Loading...</div>
        ) : (
          <>
            {spaceData && isHallway ? (
              <EditHallwayForm
                id={id}
                initialData={spaceData}
                onClose={onClose}
                onSuccess={onClose}
              />
            ) : spaceData ? (
              <EditHallwayForm
                id={id}
                initialData={spaceData}
                onClose={onClose}
                onSuccess={onClose}
              />
            ) : (
              <div>No data available.</div>
            )}
          </>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction>Okay</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
