
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
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
  const [showCreateOrderPrompt, setShowCreateOrderPrompt] = useState(false);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);

  const { data: availableKeys, isLoading } = useQuery({
    queryKey: ["available-keys"],
    queryFn: async () => {
      console.log("Fetching available keys...");
      
      const { data, error } = await supabase
        .from("key_inventory_view")
        .select("id, name, available_quantity, is_passkey")
        // Some environments don't expose a status column on the view; instead, rely on availability count
        .gt("available_quantity", 0);

      if (error) {
        console.error("Error fetching keys:", error);
        throw error;
      }

      return data;
    },
  });

  const handleAssign = async (spareKeyReason?: string) => {
    if (!selectedKey || selectedOccupants.length === 0) {
      toast.error("Please select both a key and occupants");
      return;
    }

    setIsAssigning(true);

    try {
      const { data, error } = await supabase.rpc('assign_key_if_available', {
        key_id: selectedKey,
        occupant_id: selectedOccupants[0],
        is_spare: !!spareKeyReason
      });

      if (error) {
        // Check if error is due to insufficient stock
        if (error.message.includes("not available") || error.message.includes("available_quantity")) {
          // Show order prompt instead of error
          setShowCreateOrderPrompt(true);
          return;
        }
        throw error;
      }

      toast.success(`Successfully assigned keys to ${selectedOccupants.length} occupants`);
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

  const handleCreateOrder = async (quantity: number = 1) => {
    if (!selectedKey || selectedOccupants.length === 0) {
      toast.error("Please select both a key and recipient");
      return;
    }

    setIsCreatingOrder(true);

    try {
      // Get current user
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      
      const userId = userData.user?.id;
      if (!userId) throw new Error("User not authenticated");

      // Create order using RPC function
      const { data, error } = await supabase.rpc("create_key_order", {
        p_key_id: selectedKey,
        p_quantity: quantity,
        p_requestor_id: userId,
        p_recipient_id: selectedOccupants[0],
        p_notes: "Order created during key assignment process due to insufficient stock"
      });

      if (error) throw error;

      toast.success(`Successfully created order for ${quantity} keys`);
      onSuccess();
      setShowCreateOrderPrompt(false);
      onOpenChange(false);
      setSelectedKey("");
    } catch (error: any) {
      console.error("Error creating key order:", error);
      toast.error(error.message || "Failed to create key order");
    } finally {
      setIsCreatingOrder(false);
    }
  };

  return {
    selectedKey,
    setSelectedKey,
    isAssigning,
    showSpareKeyPrompt,
    setShowSpareKeyPrompt,
    showCreateOrderPrompt,
    setShowCreateOrderPrompt,
    currentSpareCount,
    availableKeys,
    isLoading,
    isCreatingOrder,
    handleAssign,
    handleCreateOrder
  };
}
