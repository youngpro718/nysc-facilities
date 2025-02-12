import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { OccupantForm } from "../OccupantForm";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useOccupantAssignments } from "../hooks/useOccupantAssignments";
import { handleOccupantUpdate } from "../services/occupantService";

interface EditOccupantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  occupant: any;
  onSuccess: () => void;
}

export function EditOccupantDialog({
  open,
  onOpenChange,
  occupant,
  onSuccess,
}: EditOccupantDialogProps) {
  const [selectedRooms, setSelectedRooms] = useState<string[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const isMobile = useIsMobile();

  const { data: currentAssignments, isLoading } = useOccupantAssignments(occupant?.id);

  const handleUpdate = async (formData: any) => {
    try {
      await handleOccupantUpdate({
        occupantId: occupant.id,
        formData,
        selectedRooms,
        selectedKeys,
        currentAssignments,
      });

      toast.success("Occupant updated successfully");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (isLoading) {
    return null;
  }

  const initialData = occupant ? {
    ...occupant,
    rooms: currentAssignments?.rooms || [],
    keys: currentAssignments?.keys || [],
  } : undefined;

  const content = (
    <div className="space-y-6">
      <OccupantForm 
        initialData={initialData} 
        onSubmit={handleUpdate}
      />
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="px-4">
          <DrawerHeader className="text-left">
            <DrawerTitle>Edit Occupant</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-8 overflow-y-auto">
            {content}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Occupant</DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}