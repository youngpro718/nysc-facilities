
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CreateKeyForm } from "./CreateKeyForm";
import type { KeyFormData } from "./types/KeyTypes";
import { useQueryClient } from "@tanstack/react-query";

interface CreateKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateKeyDialog({ 
  open, 
  onOpenChange,
  onSuccess 
}: CreateKeyDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const handleSubmit = async (data: KeyFormData) => {
    setIsSubmitting(true);
    const totalQuantity = data.quantity + data.spareKeys;
    
    try {
      // Create the key first
      const { data: newKey, error: keyError } = await supabase
        .from("keys")
        .insert({
          name: data.name,
          type: data.type,
          is_passkey: data.isPasskey,
          door_id: data.isPasskey ? null : (data.keyScope === 'door' ? data.doorId : null),
          room_id: data.isPasskey ? null : (data.keyScope === 'room' ? data.roomId : null),
          building_id: data.buildingId || null,
          floor_id: data.isPasskey ? null : data.floorId,
          total_quantity: totalQuantity,
          available_quantity: totalQuantity,
          key_scope: data.keyScope,
          status: "available"
        })
        .select()
        .single();

      if (keyError) throw keyError;

      console.log("Key created successfully:", newKey);

      // If there's an occupant, handle key assignment
      if (data.occupantId) {
        console.log("Creating key assignment for occupant:", data.occupantId);
        
        try {
          // First check for existing assignments
          const { data: existingAssignments, error: checkError } = await supabase
            .from("key_assignments")
            .select("id, is_spare")
            .eq("key_id", newKey.id)
            .eq("occupant_id", data.occupantId)
            .is("returned_at", null);

          if (checkError) throw checkError;

          // Check if a primary (non-spare) key is already assigned
          const hasPrimaryAssignment = existingAssignments?.some(a => !a.is_spare);
          
          if (hasPrimaryAssignment) {
            // If there's already a primary assignment, only create spare assignments
            if (data.spareKeys > 0) {
              const spareAssignments = Array(data.spareKeys).fill({
                key_id: newKey.id,
                occupant_id: data.occupantId,
                assigned_at: new Date().toISOString(),
                is_spare: true
              });

              const { error: spareError } = await supabase
                .from("key_assignments")
                .insert(spareAssignments);

              if (spareError) throw spareError;

              console.log(`${data.spareKeys} spare keys assigned successfully`);
            }
          } else {
            // Create primary assignment first
            const { error: primaryError } = await supabase
              .from("key_assignments")
              .insert({
                key_id: newKey.id,
                occupant_id: data.occupantId,
                assigned_at: new Date().toISOString(),
                is_spare: false
              });

            if (primaryError) throw primaryError;

            // Then create spare assignments if requested
            if (data.spareKeys > 0) {
              const spareAssignments = Array(data.spareKeys).fill({
                key_id: newKey.id,
                occupant_id: data.occupantId,
                assigned_at: new Date().toISOString(),
                is_spare: true
              });

              const { error: spareError } = await supabase
                .from("key_assignments")
                .insert(spareAssignments);

              if (spareError) throw spareError;
            }
          }
        } catch (error: any) {
          console.error("Key assignment error:", error);
          throw new Error(error.message || "Failed to assign key");
        }
      }

      // Invalidate relevant queries
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["keys"] }),
        queryClient.invalidateQueries({ queryKey: ["active-key-assignments"] }),
        queryClient.invalidateQueries({ queryKey: ["keyAssignments"] }),
        queryClient.invalidateQueries({ queryKey: ["occupant-keys"] }),
        queryClient.invalidateQueries({ queryKey: ["occupants"] })
      ]);

      toast.success("Key created successfully");
      onOpenChange(false);
      onSuccess?.();
      
    } catch (error: any) {
      console.error("Error in key creation/assignment:", error);
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] lg:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Key</DialogTitle>
          <DialogDescription>
            Add a new key to the inventory system
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-8rem)]">
          <div className="p-4">
            <CreateKeyForm 
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              onCancel={() => onOpenChange(false)}
            />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

export default CreateKeyDialog;
