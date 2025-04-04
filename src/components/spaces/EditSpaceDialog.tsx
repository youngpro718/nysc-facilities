import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PencilIcon } from "@radix-ui/react-icons";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { EditSpaceFormData, editSpaceSchema } from "../schemas/editSpaceSchema";
import { updateSpace } from "../services/updateSpace";
import { supabase } from "@/integrations/supabase/client";
import { RoomFormContent } from "./rooms/components/RoomFormContent";
import { EditHallwayForm } from "./hallways/EditHallwayForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BasicInfoTab } from "./doors/components/BasicInfoTab";
import { SecurityTab } from "./doors/components/SecurityTab";
import { MaintenanceTab } from "./doors/components/MaintenanceTab";
import { HistoryTab } from "./doors/components/HistoryTab";
import { FormButtons } from "./doors/components/FormButtons";

interface EditSpaceDialogProps {
  id: string;
  type: "room" | "hallway" | "door";
  initialData?: Partial<EditSpaceFormData>;
  onSpaceUpdated?: (space: any) => void;
}

export function EditSpaceDialog({
  id,
  type,
  initialData,
  onSpaceUpdated
}: EditSpaceDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const { toast } = useToast();
  const form = useForm<EditSpaceFormData>({
    resolver: zodResolver(editSpaceSchema),
    defaultValues: initialData,
  });

  const onSubmit = async (data: EditSpaceFormData) => {
    setIsPending(true);
    try {
      // Log the data being submitted
      console.log('Submitting space data:', data);
      
      // Create the updated space using the appropriate service
      const result = await updateSpace(id, type, data);
      
      // Close the dialog and show success message
      setOpen(false);
      toast({
        title: "Space updated",
        description: `${type.charAt(0).toUpperCase() + type.slice(1)} has been updated successfully.`,
      });
      
      // Callback to trigger any parent component updates
      if (onSpaceUpdated) {
        onSpaceUpdated(result);
      }
    } catch (error) {
      console.error('Error updating space:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update space. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPending(false);
    }
  };

  const fetchSpaceDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('spaces')
        .select(`
          id, 
          name, 
          type, 
          status, 
          description, 
          floor_id, 
          position, 
          size,
          rotation,
          room_number,
          properties
        `)
        .eq('id', id)
        .single();
        
      if (error) throw error;
      
      if (data) {
        // Fetch additional type-specific properties
        let roomDetails = {};
        let hallwayDetails = {};
        let doorDetails = {};
        
        // Process specific properties based on space type
        if (data.type === 'hallway') {
          const { data: hallwayData, error: hallwayError } = await supabase
            .from('hallway_properties')
            .select('*')
            .eq('space_id', id)
            .single();
            
          if (!hallwayError && hallwayData) {
            hallwayDetails = {
              section: hallwayData.section || '',
              hallwayType: hallwayData.hallway_type || '',
              trafficFlow: hallwayData.traffic_flow || 'two_way',
              accessibility: hallwayData.accessibility || 'fully_accessible',
              emergencyRoute: hallwayData.emergency_route || 'not_designated',
              maintenancePriority: hallwayData.maintenance_priority || 'low',
              capacityLimit: hallwayData.capacity_limit || 0,
            };
          }
        } else if (data.type === 'room') {
          const { data: roomData, error: roomError } = await supabase
            .from('room_properties')
            .select('*')
            .eq('space_id', id)
            .single();
            
          if (!roomError && roomData) {
            roomDetails = {
              roomType: roomData.room_type || '',
              currentFunction: roomData.current_function || '',
              isStorage: roomData.is_storage || false,
              storageType: roomData.storage_type || '',
              parentRoomId: roomData.parent_room_id || null,
              phoneNumber: roomData.phone_number || ''
            };
          }
        }
        
        // Merge all data and reset form
        const parsedPosition = typeof data.position === 'string' ? JSON.parse(data.position) : data.position || { x: 0, y: 0 };
        const parsedSize = typeof data.size === 'string' ? JSON.parse(data.size) : data.size || { width: 150, height: 100 };
        const parsedProperties = typeof data.properties === 'string' ? JSON.parse(data.properties) : data.properties || {};
        
        // Build form values
        const formValues = {
          id: data.id,
          type: data.type,
          name: data.name,
          status: data.status,
          description: data.description || '',
          floorId: data.floor_id,
          roomNumber: data.room_number || '',
          position: parsedPosition,
          size: parsedSize,
          rotation: data.rotation || 0,
          ...roomDetails,
          ...hallwayDetails,
          ...doorDetails,
          ...parsedProperties
        };
        
        form.reset(formValues);
      }
    } catch (error) {
      console.error('Error fetching space details:', error);
      toast({
        title: "Error",
        description: "Failed to load space details. Please try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (open) {
      fetchSpaceDetails();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <PencilIcon className="h-4 w-4 mr-1" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit {type.charAt(0).toUpperCase() + type.slice(1)}</DialogTitle>
          <DialogDescription>
            Update the details for this {type}.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            {type === "room" && <RoomFormContent form={form} roomId={id} onSubmit={onSubmit} isPending={isPending} onCancel={() => setOpen(false)} />}
            {type === "hallway" && (
              <EditHallwayForm 
                form={form} 
                isPending={isPending} 
                onSubmit={onSubmit}
                onCancel={() => setOpen(false)}
                spaceId={id}
              />
            )}
            {type === "door" && (
              <Tabs defaultValue="basic">
                <TabsList className="w-full">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="security">Security</TabsTrigger>
                  <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
                  <TabsTrigger value="history">History</TabsTrigger>
                </TabsList>
                <div className="space-y-4 py-4">
                  <TabsContent value="basic">
                    <BasicInfoTab form={form} />
                  </TabsContent>
                  <TabsContent value="security">
                    <SecurityTab form={form} />
                  </TabsContent>
                  <TabsContent value="maintenance">
                    <MaintenanceTab form={form} />
                  </TabsContent>
                  <TabsContent value="history">
                    <HistoryTab form={form} doorId={id} />
                  </TabsContent>
                  <FormButtons onCancel={() => setOpen(false)} isPending={isPending} />
                </div>
              </Tabs>
            )}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
