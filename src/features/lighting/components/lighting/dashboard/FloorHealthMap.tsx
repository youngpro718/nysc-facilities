import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { Building2 } from "lucide-react";

interface FloorHealth {
  floor_id: string;
  floor_name: string;
  building_name: string;
  total: number;
  functional: number;
  issues: number;
}

export function FloorHealthMap() {
  const { data: floorHealth = [], isLoading } = useQuery({
    queryKey: ['floor-lighting-health'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lighting_fixtures_enriched')
        .select('floor_id, floor_name, building_name, status');
      
      if (error) throw error;
      
      // Group by floor
      const byFloor = new Map<string, FloorHealth>();
      for (const fixture of (data || [])) {
        if (!fixture.floor_id) continue;
        
        const existing = byFloor.get(fixture.floor_id) || {
          floor_id: fixture.floor_id,
          floor_name: fixture.floor_name || 'Unknown Floor',
          building_name: fixture.building_name || 'Unknown Building',
          total: 0,
          functional: 0,
          issues: 0
        };
        
        existing.total++;
        if (fixture.status === 'functional') {
          existing.functional++;
        } else {
          existing.issues++;
        }
        
        byFloor.set(fixture.floor_id, existing);
      }
      
      return Array.from(byFloor.values()).sort((a, b) => b.issues - a.issues);
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-10 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (floorHealth.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No floor data available</p>
      </div>
    );
  }

  const maxIssues = Math.max(...floorHealth.map(f => f.issues), 1);

  return (
    <div className="space-y-2">
      {floorHealth.slice(0, 5).map((floor) => {
        const healthPercent = floor.total > 0 
          ? Math.round((floor.functional / floor.total) * 100) 
          : 100;
        const issueIntensity = floor.issues / maxIssues;
        
        return (
          <div 
            key={floor.floor_id}
            className={cn(
              "flex items-center gap-3 p-2 rounded-lg border transition-colors",
              floor.issues > 0 ? "border-amber-500/30 bg-amber-500/5" : "border-border/50 bg-muted/30"
            )}
          >
            <div 
              className={cn(
                "w-2 h-8 rounded-full",
                healthPercent >= 90 ? "bg-emerald-500" :
                healthPercent >= 70 ? "bg-amber-500" :
                "bg-destructive"
              )}
              style={{ opacity: 0.5 + (issueIntensity * 0.5) }}
            />
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm truncate">
                  {floor.floor_name}
                </span>
                <span className={cn(
                  "text-xs font-semibold",
                  healthPercent >= 90 ? "text-emerald-500" :
                  healthPercent >= 70 ? "text-amber-500" :
                  "text-destructive"
                )}>
                  {healthPercent}%
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="truncate">{floor.building_name}</span>
                {floor.issues > 0 && (
                  <span className="text-amber-600">{floor.issues} issue{floor.issues !== 1 ? 's' : ''}</span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
