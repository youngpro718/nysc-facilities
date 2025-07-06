
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CreateConnectionData } from "../types/connectionTypes";
import { Direction } from "../../connections/types/ConnectionTypes";

export function useConnectionMutations(spaceType: "room" | "hallway" | "door") {
  const queryClient = useQueryClient();

  const createConnectionMutation = useMutation({
    mutationFn: async (data: CreateConnectionData) => {
      // Space connections functionality is disabled - no space_connections table exists
      throw new Error("Space connections are not available in this version");
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
      // Space connections functionality is disabled - no space_connections table exists
      throw new Error("Space connections are not available in this version");
    },
    onSuccess: () => {
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
