import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface MonitoredItem {
  id: string;
  item_type: string;
  item_id: string;
  item_name: string;
  item_description?: string;
  monitored_by: string;
  monitoring_criteria: any;
  alert_thresholds: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useMonitoring = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const addToMonitoring = async (
    itemType: string,
    itemId: string,
    itemName: string,
    itemDescription?: string,
    criteria?: Record<string, any>
  ) => {
    setIsLoading(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("User not authenticated");

      // Check if item is already being monitored
      const { data: existing } = await supabase
        .from("monitored_items")
        .select("id")
        .eq("item_type", itemType)
        .eq("item_id", itemId)
        .eq("monitored_by", user.user.id)
        .eq("is_active", true)
        .single();

      if (existing) {
        toast({
          title: "Already Monitoring",
          description: "This item is already being monitored.",
          variant: "default",
        });
        return false;
      }

      const { error } = await supabase.from("monitored_items").insert({
        item_type: itemType,
        item_id: itemId,
        item_name: itemName,
        item_description: itemDescription,
        monitored_by: user.user.id,
        monitoring_criteria: criteria || {},
      });

      if (error) throw error;

      toast({
        title: "Added to Monitoring",
        description: `${itemName} is now being monitored.`,
      });

      return true;
    } catch (error) {
      console.error("Error adding to monitoring:", error);
      toast({
        title: "Error",
        description: "Failed to add item to monitoring.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const removeFromMonitoring = async (itemType: string, itemId: string) => {
    setIsLoading(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("User not authenticated");

      const { error } = await supabase
        .from("monitored_items")
        .update({ is_active: false })
        .eq("item_type", itemType)
        .eq("item_id", itemId)
        .eq("monitored_by", user.user.id);

      if (error) throw error;

      toast({
        title: "Removed from Monitoring",
        description: "Item is no longer being monitored.",
      });

      return true;
    } catch (error) {
      console.error("Error removing from monitoring:", error);
      toast({
        title: "Error",
        description: "Failed to remove item from monitoring.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const checkIsMonitored = async (itemType: string, itemId: string) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return false;

      const { data } = await supabase
        .from("monitored_items")
        .select("id")
        .eq("item_type", itemType)
        .eq("item_id", itemId)
        .eq("monitored_by", user.user.id)
        .eq("is_active", true)
        .single();

      return !!data;
    } catch (error) {
      return false;
    }
  };

  const getMonitoredItems = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return [];

      const { data, error } = await supabase
        .from("monitored_items")
        .select("*")
        .eq("monitored_by", user.user.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching monitored items:", error);
      return [];
    }
  };

  return {
    addToMonitoring,
    removeFromMonitoring,
    checkIsMonitored,
    getMonitoredItems,
    isLoading,
  };
};