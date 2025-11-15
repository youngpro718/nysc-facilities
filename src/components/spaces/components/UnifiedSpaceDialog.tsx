import { useState, useEffect } from "react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Pencil, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { UnifiedSpaceFormFields } from "./UnifiedSpaceFormFields";
import { unifiedSpaceService } from "../services/unifiedSpaceService";
import { 
  unifiedSpaceSchema,
  createSpaceSchema,
  editSpaceSchema,
  UnifiedSpaceFormData 
} from "../schemas/unifiedSpaceSchema";
import { RoomTypeEnum } from "../rooms/types/roomEnums";
import { dbToFormRoom } from "../forms/room/roomFieldMapping";

interface UnifiedSpaceDialogProps {
  mode: "create" | "edit";
  id?: string;
  type?: "room" | "hallway" | "door";
  initialData?: any;
  open?: boolean;
  setOpen?: (open: boolean) => void;
  variant?: "button" | "custom";
  onSpaceUpdated?: () => void;
  children?: React.ReactNode;
  buttonText?: string;
}

export function UnifiedSpaceDialog({
  mode,
  id,
  type,
  initialData,
  open: controlledOpen,
  setOpen: controlledSetOpen,
  variant = "button",
  onSpaceUpdated,
  children,
  buttonText,
}: UnifiedSpaceDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = controlledSetOpen ?? setInternalOpen;
  const queryClient = useQueryClient();

  // Use appropriate schema based on mode
  const schema = mode === "create" ? createSpaceSchema : editSpaceSchema;

  const form = useForm<UnifiedSpaceFormData>({
    resolver: zodResolver(schema),
    defaultValues: mode === "create" ? {
      name: "",
      type: type || "room",
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
    } : (initialData ? dbToFormRoom(initialData, id) : {}),
  });

  // Initialize form data for edit mode
  useEffect(() => {
    if (mode === "edit" && open && initialData && type === "room") {
      const formData = dbToFormRoom(initialData, id);
      setTimeout(() => {
        form.reset(formData);
      }, 0);
    }
  }, [open, initialData, type, id, form, mode]);

  const spaceMutation = useMutation({
    mutationFn: async (data: UnifiedSpaceFormData) => {
      if (mode === "create") {
        return await unifiedSpaceService.createSpace(data);
      } else if (mode === "edit" && id) {
        return await unifiedSpaceService.updateSpace(id, data);
      }
      throw new Error("Invalid operation");
    },
    onSuccess: (result) => {
      if (!result?.success) {
        throw new Error(result?.error || "Operation failed");
      }

      console.log(`Space ${mode}d successfully:`, result.data);
      
      // Invalidate relevant queries
      const spaceType = form.getValues("type") || type;
      if (spaceType === 'room') {
        queryClient.invalidateQueries({ queryKey: ["rooms"] });
      } else if (spaceType === 'hallway') {
        queryClient.invalidateQueries({ queryKey: ["hallways"] });
      } else if (spaceType === 'door') {
        queryClient.invalidateQueries({ queryKey: ["doors"] });
      }
      
      queryClient.invalidateQueries({ queryKey: ["floor-spaces"] });
      queryClient.invalidateQueries({ queryKey: ["spaces"] });
      
      const spaceName = form.getValues("name");
      toast.success(`Successfully ${mode}d ${spaceType} "${spaceName}"`);
      setOpen(false);
      form.reset();
      
      if (onSpaceUpdated) {
        onSpaceUpdated();
      }
    },
    onError: (error) => {
      console.error(`Error ${mode}ing space:`, error);
      const errorMessage = error instanceof Error ? error.message : `Failed to ${mode} space`;
      toast.error(errorMessage);
    },
  });

  const onSubmit = async (data: UnifiedSpaceFormData) => {
    console.log(`=== UNIFIED SPACE ${mode.toUpperCase()} SUBMIT ===`);
    console.log('Form data:', data);
    
    try {
      // Validation
      if (!data.name?.trim()) {
        toast.error("Space name is required");
        form.setError("name", { message: "Space name is required" });
        return;
      }
      
      if (mode === "create" && !data.buildingId) {
        toast.error("Building selection is required");
        form.setError("buildingId", { message: "Building selection is required" });
        return;
      }
      
      if (!data.floorId) {
        toast.error("Floor selection is required");
        form.setError("floorId", { message: "Floor selection is required" });
        return;
      }
      
      // Set ID for edit mode
      if (mode === "edit" && id) {
        data.id = id;
      }
      
      console.log(`Calling ${mode} mutation...`);
      spaceMutation.mutate(data);
    } catch (error) {
      console.error(`Error in ${mode} submission:`, error);
      toast.error(`An error occurred while ${mode}ing the space`);
    }
  };

  const dialogTitle = mode === "create" 
    ? "Create New Space" 
    : `Edit ${type ? type.charAt(0).toUpperCase() + type.slice(1) : 'Space'}`;

  const submitButtonText = spaceMutation.isPending 
    ? (mode === "create" ? "Creating..." : "Updating...")
    : (mode === "create" ? "Create Space" : "Update Space");

  return (
    <>
      {variant === "button" && (
        <Button
          className={mode === "create" ? "ml-auto" : ""}
          variant={mode === "create" ? "default" : "outline"}
          size={mode === "create" ? "default" : "sm"}
          onClick={() => setOpen(true)}
        >
          {mode === "create" ? (
            <>
              <Plus className="mr-2 h-4 w-4" />
              {buttonText || "Add Space"}
            </>
          ) : (
            <>
              <Pencil className="h-4 w-4 mr-2" />
              {buttonText || "Edit"}
            </>
          )}
        </Button>
      )}
      
      {variant === "custom" && children && (
        <div onClick={() => setOpen(true)}>
          {children}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="max-h-[80vh] overflow-y-auto">
            <div className="p-1">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <UnifiedSpaceFormFields 
                    form={form} 
                    mode={mode}
                    roomId={id}
                  />
                  
                  <div className="flex justify-end gap-2 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setOpen(false)}
                      disabled={spaceMutation.isPending}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={spaceMutation.isPending}
                    >
                      {spaceMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {submitButtonText}
                        </>
                      ) : (
                        submitButtonText
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}