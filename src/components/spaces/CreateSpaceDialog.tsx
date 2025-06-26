
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
import { useToast } from "@/hooks/use-toast";
import { CreateSpaceFormFields } from "./CreateSpaceFormFields";
import { createSpace } from "./services/createSpace";
import { CreateSpaceFormData, createSpaceSchema } from "./schemas/createSpaceSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { RoomTypeEnum, StatusEnum } from "./rooms/types/roomEnums";

export function CreateSpaceDialog() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm<CreateSpaceFormData>({
    resolver: zodResolver(createSpaceSchema),
    defaultValues: {
      name: "",
      type: "room",
      buildingId: "",
      roomType: RoomTypeEnum.OFFICE,
      currentFunction: "office",
      description: "",
      isStorage: false,
      roomNumber: "",
      parentRoomId: null,
      storageCapacity: null,
      storageType: null,
      storageNotes: "",
      floorId: "",
      connections: [],
    },
  });

  const createSpaceMutation = useMutation({
    mutationFn: createSpace,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [`${variables.type}s`] });
      queryClient.invalidateQueries({ queryKey: ["new_spaces"] });
      toast({
        title: "Space created",
        description: `Successfully created ${variables.type} "${variables.name}"`,
      });
      setOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create space",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateSpaceFormData) => {
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
            <Button 
              type="submit" 
              className="w-full"
              disabled={createSpaceMutation.isPending}
            >
              {createSpaceMutation.isPending ? "Creating..." : "Create Space"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
