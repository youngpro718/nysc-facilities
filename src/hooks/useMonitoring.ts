import { useState, useCallback } from "react";
import { logger } from '@/lib/logger';
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export interface MonitoredItem {
  id: string;
  item_type: string;
  item_id: string;
  item_name: string;
  item_description?: string;
  monitored_by: string;
  monitoring_criteria: unknown;
  alert_thresholds: unknown;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useMonitoring = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const retryOperation = async <T>(
    operation: () => Promise<T>,
    maxRetries = 3,
    delay = 1000
  ): Promise<T> => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        logger.warn(`Operation failed (attempt ${i + 1}/${maxRetries}):`, error);
        if (i === maxRetries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    throw new Error("Max retries exceeded");
  };

  const addToMonitoring = useCallback(async (
    itemType: string,
    itemId: string,
    itemName: string,
    itemDescription?: string,
    criteria?: Record<string, unknown>
  ) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to monitor items.",
        variant: "destructive",
      });
      return false;
    }

    setIsLoading(true);
    try {
      return await retryOperation(async () => {

        // Check if item is already being monitored
        const { data: existing } = await supabase
          .from("monitored_items")
          .select("id")
          .eq("item_type", itemType)
          .eq("item_id", itemId)
          .eq("monitored_by", user.id)
          .eq("is_active", true)
          .maybeSingle();

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
          monitored_by: user.id,
          monitoring_criteria: criteria || {},
        });

        if (error) throw error;

        toast({
          title: "Added to Monitoring",
          description: `${itemName} is now being monitored.`,
        });

        return true;
      });
    } catch (error) {
      logger.error("Error adding to monitoring:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add item to monitoring.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, toast, retryOperation]);

  const removeFromMonitoring = useCallback(async (itemType: string, itemId: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to remove monitoring.",
        variant: "destructive",
      });
      return false;
    }

    setIsLoading(true);
    try {
      return await retryOperation(async () => {

        const { error } = await supabase
          .from("monitored_items")
          .update({ is_active: false })
          .eq("item_type", itemType)
          .eq("item_id", itemId)
          .eq("monitored_by", user.id);

        if (error) throw error;

        toast({
          title: "Removed from Monitoring",
          description: "Item is no longer being monitored.",
        });

        return true;
      });
    } catch (error) {
      logger.error("Error removing from monitoring:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to remove item from monitoring.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, toast, retryOperation]);

  const checkIsMonitored = useCallback(async (itemType: string, itemId: string) => {
    if (!user) return false;

    try {
      const { data } = await supabase
        .from("monitored_items")
        .select("id")
        .eq("item_type", itemType)
        .eq("item_id", itemId)
        .eq("monitored_by", user.id)
        .eq("is_active", true)
        .maybeSingle();

      return !!data;
    } catch (error) {
      logger.warn("Error checking monitoring status:", error);
      return false;
    }
  }, [user]);

  const getMonitoredItems = useCallback(async () => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from("monitored_items")
        .select("*")
        .eq("monitored_by", user.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error("Error fetching monitored items:", error);
      return [];
    }
  }, [user]);

  return {
    addToMonitoring,
    removeFromMonitoring,
    checkIsMonitored,
    getMonitoredItems,
    isLoading,
  };
};