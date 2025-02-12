import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CreateOccupantForm } from "./CreateOccupantForm";
import { toast } from "sonner";
import type { OccupantFormData } from "./schemas/occupantSchema";
import { useIsMobile } from "@/hooks/useIsMobile";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

interface CreateOccupantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateOccupantDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateOccupantDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isMobile = useIsMobile();

  const handleCreate = async (formData: OccupantFormData) => {
    try {
      setIsSubmitting(true);

      // First create the occupant
      const { data: occupant, error: occupantError } = await supabase
        .from('occupants')
        .insert([{
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone: formData.phone,
          department: formData.department,
          title: formData.title,
          status: formData.status,
          access_level: formData.access_level,
          notes: formData.notes,
        }])
        .select()
        .single();

      if (occupantError) throw occupantError;

      // Then create room assignments
      if (formData.rooms.length > 0) {
        const roomAssignments = formData.rooms.map((roomId, index) => ({
          occupant_id: occupant.id,
          room_id: roomId,
          is_primary: index === 0
        }));

        const { error: roomError } = await supabase
          .from('occupant_room_assignments')
          .insert(roomAssignments);

        if (roomError) throw roomError;
      }

      // Finally create key assignments
      if (formData.keys.length > 0) {
        const keyAssignments = formData.keys.map(keyId => ({
          key_id: keyId,
          occupant_id: occupant.id,
          assigned_at: new Date().toISOString(),
        }));

        const { error: keyError } = await supabase
          .from('key_assignments')
          .insert(keyAssignments);

        if (keyError) throw keyError;

        // Update keys status to assigned
        const { error: keyUpdateError } = await supabase
          .from('keys')
          .update({ status: 'assigned' })
          .in('id', formData.keys);

        if (keyUpdateError) throw keyUpdateError;
      }

      toast.success("Occupant created successfully");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="px-4">
          <DrawerHeader className="text-left">
            <DrawerTitle>Add New Occupant</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-8">
            <CreateOccupantForm
              onSubmit={handleCreate}
              isSubmitting={isSubmitting}
            />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Occupant</DialogTitle>
        </DialogHeader>
        <CreateOccupantForm
          onSubmit={handleCreate}
          isSubmitting={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  );
}
