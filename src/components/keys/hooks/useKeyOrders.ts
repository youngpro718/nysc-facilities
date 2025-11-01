
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { KeyOrder, CreateKeyOrderData, ReceiveKeysData } from "../types/OrderTypes";
import { toast } from "sonner";

export function useKeyOrders() {
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [isReceivingOrder, setIsReceivingOrder] = useState(false);
  const queryClient = useQueryClient();

  // Fetch all key orders
  const { 
    data: orders, 
    isLoading: isLoadingOrders,
    refetch: refetchOrders
  } = useQuery({
    queryKey: ["key-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("key_orders")
        .select(`
          *,
          key_requests(
            *,
            profiles(first_name, last_name, email)
          ),
          keys(name, type)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as KeyOrder[] || [];
    },
  });

  // Create a new key order
  const createKeyOrder = async (orderData: CreateKeyOrderData) => {
    setIsCreatingOrder(true);
    try {
      // Get current user
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      
      const userId = userData.user?.id;
      if (!userId) throw new Error("User not authenticated");

      const { data, error } = await supabase.rpc("create_key_order", {
        p_key_id: orderData.key_id,
        p_quantity: orderData.quantity,
        p_requestor_id: userId,
        p_recipient_id: orderData.recipient_id || null,
        p_expected_delivery_date: orderData.expected_delivery_date || null,
        p_notes: orderData.notes || null
      });

      if (error) throw error;

      toast.success("Key order created successfully");
      await refetchOrders();
      return data;
    } catch (error: any) {
      console.error("Error creating key order:", error);
      toast.error(error.message || "Failed to create key order");
      return null;
    } finally {
      setIsCreatingOrder(false);
    }
  };

  // Receive keys for an order
  const receiveKeys = async (receiveData: ReceiveKeysData) => {
    setIsReceivingOrder(true);
    try {
      // Get current user
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      
      const userId = userData.user?.id;
      if (!userId) throw new Error("User not authenticated");

      const { error } = await supabase.rpc("process_key_order_receipt", {
        p_order_id: receiveData.order_id,
        p_quantity_received: receiveData.quantity_received,
        p_performed_by: userId
      });

      if (error) throw error;

      toast.success(`Successfully received ${receiveData.quantity_received} keys`);
      
      // Invalidate relevant queries
      await refetchOrders();
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["keys-inventory"] }),
        queryClient.invalidateQueries({ queryKey: ["keys-stats"] })
      ]);
      
      return true;
    } catch (error: any) {
      console.error("Error receiving keys:", error);
      toast.error(error.message || "Failed to receive keys");
      return false;
    } finally {
      setIsReceivingOrder(false);
    }
  };

  // Cancel an order
  const cancelOrder = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from("key_orders")
        .update({ status: "cancelled" })
        .eq("id", orderId);

      if (error) throw error;

      toast.success("Order canceled successfully");
      await refetchOrders();
      return true;
    } catch (error: any) {
      console.error("Error canceling order:", error);
      toast.error(error.message || "Failed to cancel order");
      return false;
    }
  };

  return {
    orders,
    isLoadingOrders,
    isCreatingOrder,
    isReceivingOrder,
    createKeyOrder,
    receiveKeys,
    cancelOrder,
    refetchOrders
  };
}
