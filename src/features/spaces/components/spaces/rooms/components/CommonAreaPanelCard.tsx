import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DropletIcon, InfoIcon } from "lucide-react";
import { commonAreaTypeLabel, type CommonArea } from "../../common-areas/types";

interface CommonAreaPanelCardProps {
  area: CommonArea;
}

/**
 * Read-only detail panel for a common area selected from the Rooms list.
 * Common areas are a different entity from rooms (no inventory, occupancy,
 * photos, …), so this shows the fields they do have; full editing stays on
 * the Common Areas tab.
 */
export function CommonAreaPanelCard({ area }: CommonAreaPanelCardProps) {
  return (
    <Card className="border-orange-300/70 dark:border-orange-800/70">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-xl">{area.name}</CardTitle>
          <Badge
            variant="outline"
            className="border-orange-500 text-orange-700 dark:text-orange-400"
          >
            Common Area
          </Badge>
          <Badge variant="outline" className="font-normal">
            {commonAreaTypeLabel(area.area_type)}
          </Badge>
          {area.status !== "active" && (
            <Badge variant="secondary" className="font-normal capitalize">
              {area.status.replace(/_/g, " ")}
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {area.floor?.building?.name} · {area.floor?.name}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {area.description && (
          <p className="text-sm leading-relaxed text-muted-foreground">{area.description}</p>
        )}

        <div className="flex items-center gap-2 rounded-md border border-orange-200 bg-orange-50/70 px-3 py-2 text-sm dark:border-orange-900 dark:bg-orange-950/20">
          <DropletIcon className="h-4 w-4 shrink-0 text-orange-600 dark:text-orange-400" />
          <span>
            {area.water_cooler_count > 0
              ? `${area.water_cooler_count} water ${area.water_cooler_count === 1 ? "cooler" : "coolers"}`
              : "No water coolers"}
            {area.water_cooler_notes ? ` — ${area.water_cooler_notes}` : ""}
          </span>
        </div>

        <div className="flex items-start gap-2 text-xs text-muted-foreground">
          <InfoIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            This is a common area, not a room — it appears here because it matches your filter.
            To edit it, use the Common Areas tab on the Spaces page.
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
