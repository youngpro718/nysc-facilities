import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchRoomLightingStats } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// Using centralized service from lib/supabase

function formatDurationMinutes(mins: number | null | undefined) {
  if (!mins && mins !== 0) return "—";
  const d = Math.floor(mins / (60 * 24));
  const h = Math.floor((mins - d * 24 * 60) / 60);
  const m = mins % 60;
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function RoomSummaryChips() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["room-lighting-stats"],
    queryFn: fetchRoomLightingStats,
  });

  const summary = useMemo(() => {
    const list = stats || [];
    console.log("RoomSummaryChips: Processing stats", { list, statsType: typeof stats, statsLength: Array.isArray(stats) ? stats.length : 'not array' });
    
    // Ensure list is an array
    if (!Array.isArray(list)) {
      console.warn("RoomSummaryChips: stats is not an array", list);
      return { roomsWithIssues: 0, bulbOutages: 0, electricianOutages: 0, longestOpen: null, mttrAvg: null };
    }
    
    const roomsWithIssues = list.filter(r => ((r as any)?.open_issues_total || 0) > 0).length;
    const bulbOutages = list.reduce((acc, r) => acc + ((r as any)?.open_replaceable || 0), 0);
    const electricianOutages = list.reduce((acc, r) => acc + ((r as any)?.open_electrician || 0), 0);
    const longestOpen = list.reduce<number | null>((max, r) => {
      const v = (r as any)?.longest_open_minutes;
      if (v === null || v === undefined) return max;
      if (max === null) return v;
      return Math.max(max, v);
    }, null);
    const mttrValues = list.map(r => (r as any)?.mttr_minutes).filter((v): v is number => v !== null && v !== undefined);
    const mttrAvg = mttrValues.length ? Math.round(mttrValues.reduce((a, b) => a + b, 0) / mttrValues.length) : null;
    return { roomsWithIssues, bulbOutages, electricianOutages, longestOpen, mttrAvg };
  }, [stats]);

  return (
    <div className="flex flex-wrap gap-2">
      {isLoading ? (
        <div className="text-xs text-muted-foreground">Loading room summary…</div>
      ) : (
        <>
          <Badge variant="outline" className="text-xs">
            Rooms with issues: <span className="ml-1 font-medium">{summary.roomsWithIssues}</span>
          </Badge>
          <Badge variant="secondary" className="text-xs">
            Bulb outages: <span className="ml-1 font-medium">{summary.bulbOutages}</span>
          </Badge>
          <Badge variant="destructive" className="text-xs">
            Electrician needed: <span className="ml-1 font-medium">{summary.electricianOutages}</span>
          </Badge>
          <Badge variant="outline" className="text-xs">
            Longest out: <span className="ml-1 font-medium">{formatDurationMinutes(summary.longestOpen)}</span>
          </Badge>
          <Badge variant="outline" className="text-xs">
            MTTR: <span className="ml-1 font-medium">{formatDurationMinutes(summary.mttrAvg)}</span>
          </Badge>
        </>
      )}
    </div>
  );
}