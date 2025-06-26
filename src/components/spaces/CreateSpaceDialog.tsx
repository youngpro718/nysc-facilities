
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
import { RoomTypeEnum, StatusEnum } from "./rooms/types/roomEnums";

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

  const createSpaceMutation = useMutation({
    mutationFn: createSpace,
    onSuccess: (data, variables) => {
      console.log('Space created successfully:', data);
      
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      queryClient.invalidateQueries({ queryKey: ["new_spaces"] });
      queryClient.invalidateQueries({ queryKey: ["spaces"] });
      queryClient.invalidateQueries({ queryKey: ["floor-spaces"] });
      
      toast.success(`Successfully created ${variables.type} "${variables.name}"`);
      setOpen(false);
      form.reset();
    },
    onError: (error) => {
      console.error('Error creating space:', error);
      toast.error(error instanceof Error ? error.message : "Failed to create space");
    },
  });

  const onSubmit = (data: CreateSpaceFormData) => {
    console.log('Form submitted with data:', data);
    
    // Validate required fields
    if (!data.name.trim()) {
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
    
    console.log('Submitting space data:', data);
    createSpaceMutation.mutate(data);
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
        <Form {...form}>
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
        </Form>
      </DialogContent>
    </Dialog>
  );
}
