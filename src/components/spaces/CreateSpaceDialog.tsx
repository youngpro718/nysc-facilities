
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { CreateSpaceFormFields } from "./CreateSpaceFormFields";
import { createSpace } from "./services/createSpace";
import { CreateSpaceFormData, createSpaceSchema } from "./schemas/createSpaceSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { RoomTypeEnum } from "./rooms/types/roomEnums";

import { FormProvider } from "react-hook-form";

export function CreateSpaceDialog() {
  console.log('CreateSpaceDialog rendered');
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  
  const form = useForm<CreateSpaceFormData>({
    resolver: zodResolver(createSpaceSchema),
    defaultValues: {
      name: "",
      type: "room",
      buildingId: "",
      floorId: "",
      roomType: RoomTypeEnum.OFFICE,
      currentFunction: "office",
      description: "",
      isStorage: false,
      roomNumber: "",
      parentRoomId: null,
      storageCapacity: null,
      storageType: null,
      storageNotes: "",
      connections: [],
    },
  });

  const createSpaceMutation = useMutation({
    mutationFn: createSpace,
    onSuccess: (data) => {
      console.log('Space created successfully:', data);
      
      // Invalidate all relevant queries based on space type
      const spaceType = form.getValues("type");
      
      // Invalidate the specific table that was updated
      if (spaceType === 'room') {
        queryClient.invalidateQueries({ queryKey: ["rooms"] });
      } else if (spaceType === 'hallway') {
        queryClient.invalidateQueries({ queryKey: ["hallways"] });
      } else if (spaceType === 'door') {
        queryClient.invalidateQueries({ queryKey: ["doors"] });
      }
      
      // Also invalidate general floor space queries
      queryClient.invalidateQueries({ queryKey: ["floor-spaces"] });
      
      const spaceName = form.getValues("name");
      
      toast.success(`Successfully created ${spaceType} "${spaceName}"`);
      setOpen(false);
      form.reset();
    },
    onError: (error) => {
      console.error('Error creating space:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to create space";
      toast.error(errorMessage);
    },
  });

  const onSubmit = async (data: CreateSpaceFormData) => {
    console.log('Form submitted with data:', data);
    
    try {
      // Validate required fields
      if (!data.name?.trim()) {
        toast.error("Space name is required");
        form.setError("name", { message: "Space name is required" });
        return;
      }
      
      if (!data.buildingId) {
        toast.error("Building selection is required");
        form.setError("buildingId", { message: "Building selection is required" });
        return;
      }
      
      if (!data.floorId) {
        toast.error("Floor selection is required");
        form.setError("floorId", { message: "Floor selection is required" });
        return;
      }
      
      // Add debugging to track the mutation execution
      console.log('Calling createSpace mutation with data:', data);
      createSpaceMutation.mutate(data);
    } catch (error) {
      console.error('Error in form submission:', error);
      toast.error('An error occurred while submitting the form');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="ml-auto">
          <Plus className="mr-2 h-4 w-4" />
          Add Space
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Space</DialogTitle>
        </DialogHeader>
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
    <CreateSpaceFormFields form={form} />
    <div className="flex justify-end gap-2">
      <Button 
        type="button" 
        variant="outline" 
        onClick={() => setOpen(false)}
        disabled={createSpaceMutation.isPending}
      >
        Cancel
      </Button>
      <Button 
        type="submit" 
        disabled={createSpaceMutation.isPending}
      >
        {createSpaceMutation.isPending ? "Creating..." : "Create Space"}
      </Button>
    </div>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
