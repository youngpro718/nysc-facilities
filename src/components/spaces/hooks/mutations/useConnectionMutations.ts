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

      // Determine the target space ID based on the connection type
      let toSpaceId: string | undefined;
      if (data.connectionType === "room") {
        toSpaceId = data.roomId;
      } else if (data.connectionType === "hallway") {
        toSpaceId = data.hallwayId;
      } else if (data.connectionType === "door") {
        toSpaceId = data.doorId;
      }

      if (!toSpaceId) {
        throw new Error(`Target ${data.connectionType} ID is required`);
      }

      // First check if connection already exists
      const { data: existingConnection, error: existingError } = await supabase
        .from("space_connections")
        .select("id")
        .or(
          `from_space_id.eq.${data.spaceId},to_space_id.eq.${toSpaceId}`,
          `from_space_id.eq.${toSpaceId},to_space_id.eq.${data.spaceId}`
        )
        .eq("status", "active")
        .single();

      if (existingError && existingError.code !== 'PGRST116') {
        console.error("Error checking existing connection:", existingError);
        throw new Error("Failed to check for existing connection");
      }

      if (existingConnection) {
        throw new Error("Connection already exists between these spaces");
      }

      const insertData = {
        from_space_id: data.spaceId,
        to_space_id: toSpaceId,
        space_type: data.connectionType,
        connection_type: data.connectionType || "direct",
        direction: data.direction || "bidirectional",
        position: data.position || "middle",
        status: "active" as const
      };
      
      console.log("Inserting space connection data:", insertData);

      // Create the new connection
      const { data: result, error } = await supabase
        .from("space_connections")
        .insert(insertData)
        .select()
        .single();
      
      if (error) {
        console.error("Error creating space connection:", error);
        throw error;
      }

      return result;
    },
    onSuccess: (data, variables) => {
      // Invalidate both spaces' connections
      queryClient.invalidateQueries({ 
        queryKey: ["space-connections", variables.spaceId]
      });
      
      let toSpaceId = variables.roomId || variables.hallwayId || variables.doorId;
      if (toSpaceId) {
        queryClient.invalidateQueries({
          queryKey: ["space-connections", toSpaceId]
        });
      }
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
      
      // Get the connection details first
      const { data: connection } = await supabase
        .from("space_connections")
        .select("from_space_id")
        .eq("id", connectionId)
        .single();

      // Soft delete by updating status
      const { error } = await supabase
        .from("space_connections")
        .update({ status: "inactive" })
        .eq("id", connectionId);
      
      if (error) throw error;

      return connection;
    },
    onSuccess: (data) => {
      if (data?.from_space_id) {
        queryClient.invalidateQueries({ 
          queryKey: ["space-connections", data.from_space_id, spaceType]
        });
      }
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
