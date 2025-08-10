
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { ModalFrame } from "@/components/common/ModalFrame";
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
    console.log('=== FORM SUBMIT STARTED ===');
    console.log('Form submitted with data:', JSON.stringify(data, null, 2));
    console.log('Form errors:', form.formState.errors);
    console.log('Form isDirty:', form.formState.isDirty);
    console.log('Form isValid:', form.formState.isValid);
    
    try {
      // Validate required fields
      if (!data.name?.trim()) {
        console.log('Validation failed: Space name is required');
        toast.error("Space name is required");
        form.setError("name", { message: "Space name is required" });
        return;
      }
      
      if (!data.buildingId) {
        console.log('Validation failed: Building selection is required');
        toast.error("Building selection is required");
        form.setError("buildingId", { message: "Building selection is required" });
        return;
      }
      
      if (!data.floorId) {
        console.log('Validation failed: Floor selection is required');
        toast.error("Floor selection is required");
        form.setError("floorId", { message: "Floor selection is required" });
        return;
      }
      
      console.log('All validations passed, calling mutation...');
      console.log('Mutation status before call:', {
        isIdle: createSpaceMutation.isIdle,
        isPending: createSpaceMutation.isPending,
        isError: createSpaceMutation.isError,
        isSuccess: createSpaceMutation.isSuccess
      });
      
      // Add debugging to track the mutation execution
      console.log('Calling createSpace mutation with data:', data);
      createSpaceMutation.mutate(data);
      console.log('Mutation.mutate() called successfully');
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
      <ModalFrame title="Create New Space" size="md">
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
        onClick={() => {
          console.log('=== CREATE SPACE BUTTON CLICKED ===');
          console.log('Form state:', {
            isValid: form.formState.isValid,
            isDirty: form.formState.isDirty,
            errors: form.formState.errors,
            values: form.getValues()
          });
        }}
      >
        {createSpaceMutation.isPending ? "Creating..." : "Create Space"}
      </Button>
    </div>
          </form>
        </FormProvider>
      </ModalFrame>
    </Dialog>
  );
}
