
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Issue, Activity } from "@/components/dashboard/BuildingsGrid";
import { Building } from "@/utils/dashboardUtils";

interface DashboardData {
  buildings: Building[];
  buildingsLoading: boolean;
  issues: Issue[];
  activities: Activity[];
  handleMarkAsSeen: (issueId: string) => void;
}

export const useDashboardData = (): DashboardData => {
  const { data: buildings, isLoading: buildingsLoading } = useQuery({
    queryKey: ["buildings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("buildings")
        .select(`
          *,
          floors (
            id,
            rooms (
              id,
              room_number,
              name
            )
          )
        `);

      if (error) throw error;

      // Fetch lighting status for all rooms
      const roomIds = data?.flatMap(building => 
        building.floors?.flatMap(floor => 
          floor.rooms?.map(room => room.id)
        )
      ).filter(Boolean) || [];

      const { data: lightingData, error: lightingError } = await supabase
        .from("room_lighting_status")
        .select("*")
        .in("room_id", roomIds);

      if (lightingError) throw lightingError;

      // Map lighting data to buildings
      return data.map(building => ({
        ...building,
        floors: building.floors?.map(floor => ({
          ...floor,
          rooms: floor.rooms?.map(room => ({
            ...room,
            room_lighting_status: [
              lightingData?.find(status => status.room_id === room.id) || {
                working_fixtures: 0,
                non_working_fixtures: 0,
                total_fixtures: 0
              }
            ]
          }))
        })) || []
      }));
    },
  });

  const { data: issues, refetch: refetchIssues } = useQuery({
    queryKey: ["issues"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("issues")
        .select("*")
        .eq("seen", false)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Issue[];
    },
  });

  const { data: activities } = useQuery({
    queryKey: ["activities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_activity_history")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      
      // Transform the data to match the Activity interface
      return (data || []).map(activity => ({
        id: crypto.randomUUID(), // Generate an ID since it's required by the interface
        action: activity.action || "",
        performed_by: activity.performed_by || "",
        created_at: activity.created_at || "",
        metadata: activity.metadata as { building_id: string; [key: string]: any } || {}
      })) as Activity[];
    },
  });

  const handleMarkAsSeen = async (issueId: string) => {
    try {
      const { error } = await supabase
        .from("issues")
        .update({ seen: true })
        .eq("id", issueId);

      if (error) throw error;

      toast.success("Issue marked as seen");
      refetchIssues();
    } catch (error: any) {
      toast.error(error.message || "Failed to mark issue as seen");
    }
  };

  return {
    buildings: buildings || [],
    buildingsLoading,
    issues: issues || [],
    activities: activities || [],
    handleMarkAsSeen,
  };
};
