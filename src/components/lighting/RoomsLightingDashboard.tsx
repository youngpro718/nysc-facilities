import { useMemo, useState } from "react";
import { useRoomLightingStats } from "@/components/lighting/hooks/useRoomLightingStats";
import { RoomLightingStats } from "@/types/lighting";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";

interface RoomsLightingDashboardProps {
  onOpenRoom?: (roomId: string | null) => void;
}

export function RoomsLightingDashboard({ onOpenRoom }: RoomsLightingDashboardProps) {
  const { data, isLoading, refetch, isFetching } = useRoomLightingStats();
  const [q, setQ] = useState("");

  const rows = useMemo(() => {
    const list = (data || []) as RoomLightingStats[];
    if (!q.trim()) return list;
    const term = q.trim().toLowerCase();
    return list.filter(r =>
      (r.room_name || "").toLowerCase().includes(term) ||
      (r.room_number || "").toLowerCase().includes(term)
    );
  }, [data, q]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="w-full max-w-sm">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search rooms by name or number"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[160px]">Room</TableHead>
              <TableHead>Fixtures</TableHead>
              <TableHead>Open (Replaceable)</TableHead>
              <TableHead>Open (Electrician)</TableHead>
              <TableHead>Longest Open</TableHead>
              <TableHead>MTTR</TableHead>
              <TableHead>SLA</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                  Loading room stats...
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                  No rooms found.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r) => (
                <TableRow key={`${r.room_id}-${r.room_number}`}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{r.room_name || "—"}</span>
                      <span className="text-xs text-muted-foreground">{r.room_number || r.room_id || ""}</span>
                    </div>
                  </TableCell>
                  <TableCell>{r.fixture_count}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{r.open_replaceable}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={r.open_electrician > 0 ? "destructive" : "secondary"}>{r.open_electrician}</Badge>
                  </TableCell>
                  <TableCell>
                    {r.longest_open_minutes != null ? `${r.longest_open_minutes}m` : "—"}
                  </TableCell>
                  <TableCell>
                    {r.mttr_minutes != null ? `${r.mttr_minutes}m` : "—"}
                  </TableCell>
                  <TableCell>
                    {r.has_sla_breach ? (
                      <Badge variant="destructive">Breach</Badge>
                    ) : (
                      <Badge variant="outline">OK</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" onClick={() => onOpenRoom?.(r.room_id)}>
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
