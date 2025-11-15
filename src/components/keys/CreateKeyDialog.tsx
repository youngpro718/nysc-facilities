import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { MobileOptimizedDialog } from "@/components/ui/mobile-dialog";
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
          is_elevator_card: data.isElevatorCard,
          total_quantity: totalQuantity,
          available_quantity: totalQuantity,
          key_scope: data.isElevatorCard ? null : data.keyScope,
          status: "available",
          location_data: data.isElevatorCard ? null : {
            building_id: data.buildingId || null,
            floor_id: data.isPasskey ? null : data.floorId,
            door_id: data.isPasskey ? null : (data.keyScope === 'door' ? data.doorId : null),
            room_id: data.isPasskey ? null : ((data.keyScope === 'room' || data.keyScope === 'room_door') ? data.roomId : null)
          }
        })
        .select()
        .single();

      if (keyError) throw keyError;

      console.log("Key created successfully:", newKey);

      // If it's NOT an elevator card and there's an occupant, handle key assignment
      if (!data.isElevatorCard && data.occupantId) {
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
    <MobileOptimizedDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Create New Key"
      description="Add a new key to the inventory system"
      maxWidth="2xl"
    >
      <CreateKeyForm 
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        onCancel={() => onOpenChange(false)}
      />
    </MobileOptimizedDialog>
  );
}

export default CreateKeyDialog;
