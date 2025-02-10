
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BuildingCard } from "@/components/dashboard/BuildingCard";
import { BuildingCardSkeleton } from "@/components/dashboard/BuildingCardSkeleton";

const Index = () => {
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
              room_lighting_status (*)
            )
          )
        `);
      if (error) throw error;
      return data;
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
      return data;
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
      return data;
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

  const buildingImages = [
    "/lovable-uploads/dd39eed6-def6-420f-97c1-790e968fc8d8.png",
    "/lovable-uploads/52abee84-9ecc-4ce9-a008-e151553ba782.png",
  ];

  if (buildingsLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Welcome to the Courthouse Facility Management System
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2].map((i) => (
            <BuildingCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome to the Courthouse Facility Management System
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {buildings?.map((building, index) => {
          const floorCount = building.floors?.length || 0;
          const roomCount =
            building.floors?.reduce(
              (acc, floor) => acc + (floor.rooms?.length || 0),
              0
            ) || 0;

          const workingFixtures =
            building.floors?.reduce(
              (acc, floor) =>
                acc +
                (floor.rooms?.reduce(
                  (roomAcc, room) =>
                    roomAcc + (room.room_lighting_status?.[0]?.working_fixtures || 0),
                  0
                ) || 0),
              0
            ) || 0;

          const totalFixtures =
            building.floors?.reduce(
              (acc, floor) =>
                acc +
                (floor.rooms?.reduce(
                  (roomAcc, room) =>
                    roomAcc + (room.room_lighting_status?.[0]?.total_fixtures || 0),
                  0
                ) || 0),
              0
            ) || 0;

          const buildingIssues =
            issues?.filter(
              (issue) =>
                issue.building_id === building.id && issue.photos?.length > 0
            ) || [];

          const buildingActivities =
            activities?.filter((activity) => {
              if (activity.metadata && typeof activity.metadata === "object") {
                const metadata = activity.metadata as Record<string, any>;
                return metadata.building_id === building.id;
              }
              return false;
            }) || [];

          return (
            <BuildingCard
              key={building.id}
              building={building}
              buildingImage={buildingImages[index % buildingImages.length]}
              floorCount={floorCount}
              roomCount={roomCount}
              workingFixtures={workingFixtures}
              totalFixtures={totalFixtures}
              buildingIssues={buildingIssues}
              buildingActivities={buildingActivities}
              onMarkAsSeen={handleMarkAsSeen}
            />
          );
        })}
      </div>
    </div>
  );
};

export default Index;
