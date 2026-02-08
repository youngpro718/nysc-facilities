
import { useState, useEffect } from "react";
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

  // Ensure valid defaults when switching types, especially for hallway enums
  const watchType = form.watch('type');
  useEffect(() => {
    if (watchType === 'hallway') {
      if (!form.getValues('hallwayType')) form.setValue('hallwayType', 'public_main' as unknown, { shouldDirty: true });
      if (!form.getValues('section')) form.setValue('section', 'connector' as unknown, { shouldDirty: true });
      if (!form.getValues('size')) form.setValue('size', { width: 300, height: 50 } as unknown, { shouldDirty: true });
      if (!form.getValues('position')) form.setValue('position', { x: 0, y: 0 } as unknown, { shouldDirty: true });
    }
    if (watchType === 'door') {
      if (!form.getValues('doorType')) form.setValue('doorType', 'standard' as unknown, { shouldDirty: true });
    }
  }, [watchType]);

  const createSpaceMutation = useMutation({
    mutationFn: createSpace,
    onSuccess: (data) => {
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
      const errorMessage = error instanceof Error ? error.message : "Failed to create space";
      toast.error(errorMessage);
    },
  });

  const onSubmit = async (data: CreateSpaceFormData) => {
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
      
      createSpaceMutation.mutate(data);
    } catch (error) {
      toast.error('An error occurred while submitting the form');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="ml-auto" data-testid="add-space-button">
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
