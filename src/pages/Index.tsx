
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
    "/lovable-uploads/aed346ca-c3c6-4e0c-b236-528b0e54e20c.png",
    "/lovable-uploads/83d441a4-13af-461a-800b-3b483c153ed4.png",
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
