import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

const fetchLightingZones = async () => {
  const { data, error } = await supabase
    .from('lighting_zones')
    .select('*')
    .order('name');
  
  if (error) throw error;
  return data || [];
};

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
            (zones || []).map((zone: { id: string; name: string; type: string; floor_id: string }) => (
              <Badge
                key={zone.id}
                variant="outline"
                className="cursor-pointer"
                onClick={() => onZoneSelected?.(zone.id)}
              >
                {zone.name}
              </Badge>
            ))
          )}
        </div>
      )}
    </div>
  );
}
