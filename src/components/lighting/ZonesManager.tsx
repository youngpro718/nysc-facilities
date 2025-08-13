import { useQuery } from "@tanstack/react-query";
import { fetchLightingZones } from "@/services/supabase/lightingService";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

interface ZonesManagerProps {
  onCreateZoneClick?: () => void;
  onZoneSelected?: (zoneId: string) => void;
}

export function ZonesManager({ onCreateZoneClick, onZoneSelected }: ZonesManagerProps) {
  const { data: zones, isLoading } = useQuery({
    queryKey: ["lighting_zones_simple"],
    queryFn: () => fetchLightingZones(),
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Zones</h2>
        {onCreateZoneClick && (
          <Button variant="outline" size="sm" onClick={onCreateZoneClick}>
            <PlusCircle className="h-4 w-4 mr-1" />
            New Zone
          </Button>
        )}
      </div>
      {isLoading ? (
        <div className="text-xs text-muted-foreground">Loading zones…</div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {(zones || []).length === 0 ? (
            <div className="text-xs text-muted-foreground">No zones yet.</div>
          ) : (
            (zones || []).map((z: { label: string; value: string }) => (
              <Badge
                key={z.value}
                variant="outline"
                className="cursor-pointer"
                onClick={() => onZoneSelected?.(z.value)}
              >
                {z.label}
              </Badge>
            ))
          )}
        </div>
      )}
    </div>
  );
}
