
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useKeyAssignment(
  selectedOccupants: string[],
  onSuccess: () => void,
  onOpenChange: (open: boolean) => void
) {
  const [selectedKey, setSelectedKey] = useState<string>("");
  const [isAssigning, setIsAssigning] = useState(false);
  const [showSpareKeyPrompt, setShowSpareKeyPrompt] = useState(false);
  const [currentSpareCount, setCurrentSpareCount] = useState(0);

  const { data: availableKeys, isLoading } = useQuery({
    queryKey: ["available-keys"],
    queryFn: async () => {
      console.log("Fetching available keys...");
      
      const { data, error } = await supabase
        .from("keys")
        .select("id, name, type, available_quantity, is_passkey")
        .gt("available_quantity", 0)
        .eq("status", "available");

      if (error) {
        console.error("Error fetching keys:", error);
        throw error;
      }

      console.log("Available keys:", data);
      return data;
    },
  });

  const handleAssign = async (spareKeyReason?: string) => {
    console.log("Starting assignment process:", { selectedKey, selectedOccupants, spareKeyReason });
    
    if (!selectedKey) {
      toast.error("Please select a key to assign");
      return;
    }

    if (selectedOccupants.length === 0) {
      toast.error("Please select occupants to assign the key to");
      return;
    }

    setIsAssigning(true);

    try {
      // First check key availability
      const { data: keyData, error: keyError } = await supabase
        .from("keys")
        .select("available_quantity")
        .eq("id", selectedKey)
        .single();

      if (keyError) throw keyError;

      if (!keyData || keyData.available_quantity < selectedOccupants.length) {
        throw new Error("Not enough keys available for assignment");
      }

      // Check for existing assignments
      const { data: existingAssignments, error: checkError } = await supabase
        .from("key_assignments")
        .select("occupant_id, is_spare")
        .eq("key_id", selectedKey)
        .in("occupant_id", selectedOccupants)
        .is("returned_at", null);

      if (checkError) {
        console.error("Error checking existing assignments:", checkError);
        throw checkError;
      }

      console.log("Existing assignments:", existingAssignments);

      // Filter out occupants that already have this key (unless it's a spare)
      const occupantsToAssign = selectedOccupants.filter(occupantId => {
        const existingAssignment = existingAssignments?.find(a => a.occupant_id === occupantId);
        return !existingAssignment || (spareKeyReason && !existingAssignment.is_spare);
      });

      if (occupantsToAssign.length === 0) {
        if (!spareKeyReason) {
          // Count current spare keys for the first selected occupant
          const { data: spareCount, error: spareError } = await supabase
            .from("key_assignments")
            .select("id")
            .eq("key_id", selectedKey)
            .eq("occupant_id", selectedOccupants[0])
            .eq("is_spare", true)
            .is("returned_at", null);

          if (spareError) throw spareError;

          setCurrentSpareCount(spareCount?.length || 0);
          console.log("Showing spare key prompt");
          setShowSpareKeyPrompt(true);
          setIsAssigning(false);
          return;
        }
        throw new Error("All selected occupants already have this key assigned");
      }

      console.log("Creating assignments for:", {
        keyId: selectedKey,
        occupants: occupantsToAssign,
        spareKeyReason
      });

      // Create assignments
      const assignments = occupantsToAssign.map((occupantId) => ({
        key_id: selectedKey,
        occupant_id: occupantId,
        assigned_at: new Date().toISOString(),
        is_spare: !!spareKeyReason,
        spare_key_reason: spareKeyReason || null
      }));

      // Update key quantities first
      const { error: updateError } = await supabase
        .from("keys")
        .update({ 
          available_quantity: keyData.available_quantity - occupantsToAssign.length,
          status: keyData.available_quantity - occupantsToAssign.length === 0 ? 'assigned' : 'available'
        })
        .eq("id", selectedKey);

      if (updateError) throw updateError;

      // Then create assignments
      const { error: assignmentError } = await supabase
        .from("key_assignments")
        .insert(assignments);

      if (assignmentError) {
        // Rollback quantity update if assignment fails
        await supabase
          .from("keys")
          .update({ 
            available_quantity: keyData.available_quantity,
            status: 'available'
          })
          .eq("id", selectedKey);
        throw assignmentError;
      }

      toast.success(`Successfully assigned keys to ${occupantsToAssign.length} occupants`);
      onSuccess();
      setShowSpareKeyPrompt(false);
      onOpenChange(false);
      setSelectedKey("");
    } catch (error: any) {
      console.error("Error assigning keys:", error);
      toast.error(error.message || "Failed to assign keys");
    } finally {
      setIsAssigning(false);
    }
  };

  return {
    selectedKey,
    setSelectedKey,
    isAssigning,
    showSpareKeyPrompt,
    setShowSpareKeyPrompt,
    currentSpareCount,
    availableKeys,
    isLoading,
    handleAssign
  };
}
