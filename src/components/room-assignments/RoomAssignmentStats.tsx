import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Building, MapPin, Star } from "lucide-react";
import { RoomAssignmentWithDetails } from "./hooks/useRoomAssignmentsList";

interface RoomAssignmentStatsProps {
  assignments: RoomAssignmentWithDetails[] | undefined;
}

export function RoomAssignmentStats({ assignments }: RoomAssignmentStatsProps) {
  if (!assignments) {
    return null;
  }

  const totalAssignments = assignments.length;
  const primaryAssignments = assignments.filter(a => a.is_primary).length;
  const uniqueOccupants = new Set(assignments.map(a => a.occupant_id)).size;
  const uniqueRooms = new Set(assignments.map(a => a.room_id)).size;

  const stats = [
    {
      title: "Total Assignments",
      value: totalAssignments,
      icon: MapPin,
      color: "bg-blue-500",
    },
    {
      title: "Primary Assignments",
      value: primaryAssignments,
      icon: Star,
      color: "bg-yellow-500",
    },
    {
      title: "Assigned Occupants",
      value: uniqueOccupants,
      icon: Users,
      color: "bg-green-500",
    },
    {
      title: "Rooms in Use",
      value: uniqueRooms,
      icon: Building,
      color: "bg-purple-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-4 xl:gap-6">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 xl:pb-3">
              <CardTitle className="text-sm xl:text-base font-medium">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-full ${stat.color} text-white`}>
                <Icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="xl:pt-2">
              <div className="text-2xl xl:text-3xl font-bold">{stat.value}</div>
              <Badge variant="outline" className="mt-2">
                {stat.value === 1 ? stat.title.slice(0, -1) : stat.title}
              </Badge>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}