import { History } from "lucide-react";
import { format } from "date-fns";

interface BuildingActivitiesProps {
  activities: unknown[];
}

export const BuildingActivities = ({ activities }: BuildingActivitiesProps) => {
  if (activities.length === 0) return null;

  return (
    <div className="space-y-4">
      <h4 className="flex items-center gap-2 font-medium">
        <History className="h-4 w-4 text-blue-500" />
        Recent Activities
      </h4>
      <div className="space-y-2">
        {activities.slice(0, 5).map((activity, index) => (
          <div
            key={index}
            className="rounded-lg border bg-card p-3 transition-colors hover:bg-accent"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium">{activity.action}</p>
                <p className="text-xs text-muted-foreground">
                  by {activity.performed_by || "System"}
                </p>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">
                {format(new Date(activity.created_at), "MMM d, h:mm a")}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};