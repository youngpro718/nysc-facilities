
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { EditRoomForm } from "./forms/room/EditRoomForm";
import { EditHallwayForm } from "./forms/hallway/EditHallwayForm";

export interface EditSpaceDialogProps {
  id: string;
  type?: string; // Use type instead of spaceType
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditSpaceDialog({ id, type, open, onOpenChange }: EditSpaceDialogProps) {
  const [spaceType, setSpaceType] = useState<string | null>(type || null);
  
  // Query to fetch the space details
  const { data: space, isLoading } = useQuery({
    queryKey: ["space", id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from("new_spaces")
        .select("*, room_properties(*), hallway_properties(*)")
        .eq("id", id)
        .single();
      
      if (error) throw error;
      setSpaceType(data.type);
      return data;
    },
    enabled: !!id && open,
  });

  const handleClose = () => {
    onOpenChange(false);
  };

  // Prepare form data based on space type
  const getInitialData = () => {
    if (!space) return {};
    
    const baseData = {
      id: space.id,
      name: space.name,
      type: space.type,
      status: space.status,
      floorId: space.floor_id,
      position: space.position,
      size: space.size,
      rotation: space.rotation || 0,
      description: space.properties?.description
    };
    
    if (space.type === "hallway") {
      return {
        ...baseData,
        section: space.properties?.section || space.hallway_properties?.section,
        hallwayType: space.properties?.hallwayType || space.hallway_properties?.hallway_type,
        trafficFlow: space.properties?.trafficFlow || space.hallway_properties?.traffic_flow,
        accessibility: space.properties?.accessibility || space.hallway_properties?.accessibility,
        emergencyRoute: space.properties?.emergencyRoute || space.hallway_properties?.emergency_route,
        maintenancePriority: space.properties?.maintenancePriority || space.hallway_properties?.maintenance_priority,
        capacityLimit: space.properties?.capacityLimit || space.hallway_properties?.capacity_limit
      };
    }
    
    if (space.type === "room") {
      return {
        ...baseData,
        roomNumber: space.room_number,
        roomType: space.room_properties?.room_type,
        currentFunction: space.room_properties?.current_function,
        isStorage: space.room_properties?.is_storage || false,
        storageType: space.room_properties?.storage_type,
        parentRoomId: space.room_properties?.parent_room_id,
        phoneNumber: space.room_properties?.phone_number
      };
    }
    
    return baseData;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Edit {spaceType ? spaceType.charAt(0).toUpperCase() + spaceType.slice(1) : 'Space'}
          </DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {spaceType === "room" && (
              <EditRoomForm 
                id={id}
                initialData={getInitialData()}
                onSuccess={handleClose}
                onCancel={handleClose}
              />
            )}
            
            {spaceType === "hallway" && (
              <EditHallwayForm 
                id={id}
                initialData={getInitialData()}
                onSuccess={handleClose}
                onCancel={handleClose}
              />
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
