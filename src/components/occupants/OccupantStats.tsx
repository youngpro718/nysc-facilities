import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building, Key, Briefcase, UserCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface OccupantStatsProps {
  stats?: {
    total: number;
    active: number;
    departments: number;
    rooms: number;
    keys: number;
  };
  isLoading: boolean;
}

export function OccupantStats({ stats, isLoading }: OccupantStatsProps) {
  const statCards = [
    {
      title: "Total Occupants",
      value: stats?.total || 0,
      description: "All registered personnel",
      icon: <Users className="h-5 w-5 text-blue-600" />,
      color: "bg-blue-50 dark:bg-blue-950",
      textColor: "text-blue-600 dark:text-blue-400",
    },
    {
      title: "Active Occupants",
      value: stats?.active || 0,
      description: "Currently active personnel",
      icon: <UserCheck className="h-5 w-5 text-green-600" />,
      color: "bg-green-50 dark:bg-green-950",
      textColor: "text-green-600 dark:text-green-400",
    },
    {
      title: "Departments",
      value: stats?.departments || 0,
      description: "Unique departments",
      icon: <Briefcase className="h-5 w-5 text-purple-600" />,
      color: "bg-purple-50 dark:bg-purple-950",
      textColor: "text-purple-600 dark:text-purple-400",
    },
    {
      title: "Room Assignments",
      value: stats?.rooms || 0,
      description: "Total assigned rooms",
      icon: <Building className="h-5 w-5 text-amber-600" />,
      color: "bg-amber-50 dark:bg-amber-950",
      textColor: "text-amber-600 dark:text-amber-400",
    },
    {
      title: "Active Keys",
      value: stats?.keys || 0,
      description: "Keys currently assigned",
      icon: <Key className="h-5 w-5 text-red-600" />,
      color: "bg-red-50 dark:bg-red-950",
      textColor: "text-red-600 dark:text-red-400",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      {statCards.map((card, index) => (
        <Card key={index} className="overflow-hidden">
          <CardHeader className={`flex flex-row items-center justify-between space-y-0 pb-2 ${card.color}`}>
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <div className="rounded-full p-1">{card.icon}</div>
          </CardHeader>
          <CardContent className="pt-4">
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{card.value.toLocaleString()}</div>
            )}
            <p className="text-xs text-muted-foreground">{card.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
