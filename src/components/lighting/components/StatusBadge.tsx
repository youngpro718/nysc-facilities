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
      return "bg-green-100 text-green-800 border-green-200";
    case "maintenance_needed":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "non_functional":
      return "bg-red-100 text-red-800 border-red-200";
    case "pending_maintenance":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "scheduled_replacement":
      return "bg-purple-100 text-purple-800 border-purple-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
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
