
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { EditRoomForm } from "./forms/room/EditRoomForm";
import { EditHallwayForm } from "./forms/hallway/EditHallwayForm";

export interface EditSpaceDialogProps {
  id: string;
  type?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSpaceUpdated?: () => void;
  initialData?: any;
}

export function EditSpaceDialog({ id, type, open, onOpenChange, onSpaceUpdated }: EditSpaceDialogProps) {
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
    if (onSpaceUpdated) onSpaceUpdated();
  };

  // Prepare form data based on space type
  const getInitialData = () => {
    if (!space) return {};
    
    // Extract properties safely using optional chaining
    const properties = space.properties || {};
    const description = typeof properties === 'object' && properties !== null ? properties.description : undefined;
    
    const baseData = {
      id: space.id,
      name: space.name,
      type: space.type,
      status: space.status,
      floorId: space.floor_id,
      position: space.position,
      size: space.size,
      rotation: space.rotation || 0,
      description: description
    };
    
    if (space.type === "hallway" && space.hallway_properties) {
      const hallwayProps = space.hallway_properties[0] || {};
      return {
        ...baseData,
        section: hallwayProps.section,
        hallwayType: hallwayProps.hallway_type,
        trafficFlow: hallwayProps.traffic_flow,
        accessibility: hallwayProps.accessibility,
        emergencyRoute: hallwayProps.emergency_route,
        maintenancePriority: hallwayProps.maintenance_priority,
        capacityLimit: hallwayProps.capacity_limit
      };
    }
    
    if (space.type === "room" && space.room_properties) {
      const roomProps = space.room_properties[0] || {};
      return {
        ...baseData,
        roomNumber: space.room_number,
        roomType: roomProps.room_type,
        currentFunction: roomProps.current_function,
        isStorage: roomProps.is_storage || false,
        storageType: roomProps.storage_type,
        parentRoomId: roomProps.parent_room_id,
        phoneNumber: roomProps.phone_number
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
