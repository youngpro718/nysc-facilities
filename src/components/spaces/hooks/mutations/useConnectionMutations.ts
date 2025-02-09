
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CreateConnectionData } from "../types/connectionTypes";
import { Direction } from "../../connections/types/ConnectionTypes";

export function useConnectionMutations(spaceType: "room" | "hallway" | "door") {
  const queryClient = useQueryClient();

  const createConnectionMutation = useMutation({
    mutationFn: async (data: CreateConnectionData) => {
      console.log("Creating connection with data:", data);
      
      if (!data.spaceId) {
        throw new Error("Space ID is required");
      }

      const insertData = {
        from_space_id: data.spaceId,
        to_space_id: data.roomId || data.hallwayId || data.doorId,
        space_type: spaceType,
        connection_type: data.connectionType || "direct",
        direction: data.direction,
        position: data.position,
        status: "active" as const,
        metadata: {}
      };
      
      console.log("Inserting space connection data:", insertData);
      const { data: result, error } = await supabase
        .from("space_connections")
        .insert(insertData)
        .select();
      
      if (error) {
        console.error("Error creating space connection:", error);
        throw error;
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["space-connections"] });
      toast.success("Connection created successfully");
    },
    onError: (error) => {
      console.error("Error creating connection:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create connection");
    },
  });

  const deleteConnectionMutation = useMutation({
    mutationFn: async (connectionId: string) => {
      console.log("Deleting connection:", connectionId);
      const { error } = await supabase
        .from("space_connections")
        .delete()
        .eq("id", connectionId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["space-connections"] });
      toast.success("Connection removed successfully");
    },
    onError: (error) => {
      console.error("Error deleting connection:", error);
      toast.error("Failed to remove connection");
    },
  });

  return {
    createConnection: createConnectionMutation.mutate,
    isCreatingConnection: createConnectionMutation.isPending,
    deleteConnection: deleteConnectionMutation.mutate,
    isDeletingConnection: deleteConnectionMutation.isPending,
  };
}
