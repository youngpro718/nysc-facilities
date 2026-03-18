import { Badge } from "@/components/ui/badge";

export type FixtureStatus =
  | "functional"
  | "maintenance_needed"
  | "non_functional"
  | "pending_maintenance"
  | "scheduled_replacement";

function statusClasses(status: FixtureStatus) {
  switch (status) {
    case "functional":
      return "bg-green-100 dark:bg-green-900/30 text-green-800 border-green-200 dark:border-green-800";
    case "maintenance_needed":
      return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 border-yellow-200 dark:border-yellow-800";
    case "non_functional":
      return "bg-red-100 dark:bg-red-900/30 text-red-800 border-red-200 dark:border-red-800";
    case "pending_maintenance":
      return "bg-amber-100 dark:bg-amber-900/30 text-amber-800 border-amber-200";
    case "scheduled_replacement":
      return "bg-purple-100 dark:bg-purple-900/30 text-purple-800 border-purple-200 dark:border-purple-800";
    default:
      return "bg-gray-100 dark:bg-gray-800/30 text-gray-800 border-gray-200";
  }
}

export function StatusBadge({ status }: { status: FixtureStatus | string }) {
  const s = (status as FixtureStatus);
  return (
    <Badge className={`text-xs ${statusClasses(s)}`}>
      {String(status).replace(/_/g, " ")}
    </Badge>
  );
}
