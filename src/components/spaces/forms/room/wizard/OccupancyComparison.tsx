import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, History, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface OccupancyComparisonProps {
  roomId?: string;
}

export function OccupancyComparison({ roomId }: OccupancyComparisonProps) {
  const { data: occupancyData, isLoading } = useQuery({
    queryKey: ["room-occupancy-comparison", roomId],
    queryFn: async () => {
      if (!roomId) return { current: [], previous: [] };

      // Get current occupants
      const { data: currentData, error: currentError } = await supabase
        .from("occupant_room_assignments")
        .select(`
          id,
          assignment_type,
          is_primary,
          occupant:occupants!occupant_room_assignments_occupant_id_fkey(
            id,
            first_name,
            last_name
          )
        `)
        .eq("room_id", roomId)
        .is("end_date", null);

      if (currentError) throw currentError;

      // Get previous occupants (limited to last 5)
      const { data: previousData, error: previousError } = await supabase
        .from("occupant_room_assignments")
        .select(`
          id,
          assignment_type,
          end_date,
          occupant:occupants!occupant_room_assignments_occupant_id_fkey(
            id,
            first_name,
            last_name
          )
        `)
        .eq("room_id", roomId)
        .not("end_date", "is", null)
        .order("end_date", { ascending: false })
        .limit(5);

      if (previousError) throw previousError;

      return {
        current: currentData || [],
        previous: previousData || [],
      };
    },
    enabled: !!roomId,
  });

  if (!roomId) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            Save the room first to view occupancy information.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Occupancy Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  const { current, previous } = occupancyData || { current: [], previous: [] };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Occupancy Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Current Occupants */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">Current Occupants</h4>
              <Badge variant="default">{current.length}</Badge>
            </div>

            {current.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">
                No current occupants assigned
              </p>
            ) : (
              <div className="space-y-2">
                {current.map((assignment: any) => (
                  <div
                    key={assignment.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {assignment.occupant?.first_name} {assignment.occupant?.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {assignment.assignment_type?.replace(/_/g, " ")}
                      </p>
                    </div>
                    {assignment.is_primary && (
                      <Badge variant="secondary" className="text-xs">
                        Primary
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => window.open(`/occupants?room=${roomId}`, "_blank")}
            >
              Assign New Occupant
            </Button>
          </div>

          {/* Previous Occupants */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">Previous Occupants</h4>
              <Badge variant="outline">{previous.length}</Badge>
            </div>

            {previous.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">
                No previous occupancy history
              </p>
            ) : (
              <div className="space-y-2">
                {previous.slice(0, 3).map((assignment: any) => (
                  <div
                    key={assignment.id}
                    className="flex items-center gap-2 p-2 rounded-lg bg-muted/30"
                  >
                    <div className="flex-1">
                      <p className="text-sm">
                        {assignment.occupant?.first_name} {assignment.occupant?.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {assignment.assignment_type?.replace(/_/g, " ")}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                ))}
              </div>
            )}

            {previous.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => window.open(`/occupants?room=${roomId}&tab=history`, "_blank")}
              >
                <History className="h-4 w-4 mr-2" />
                View Full History
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
