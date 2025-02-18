
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
        .from("key_inventory_view")
        .select("id, name, type, available_quantity, is_passkey")
        .gt("available_quantity", 0)
        .eq("status", "available");

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

      if (error) throw error;

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
