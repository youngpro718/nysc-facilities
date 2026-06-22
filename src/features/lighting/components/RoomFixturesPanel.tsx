import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Lightbulb, Plus, Trash2, AlertTriangle } from "lucide-react";
import { db } from "@/services/core/supabaseClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useSpaceFixtures, useUpdateFixtureStatus, useCreateFixture, lightingKeys } from "../hooks/useLightingData";
import type { LightStatus, LightingType } from "../services/lightingService";
import { getErrorMessage } from "@/lib/errorUtils";

interface RoomFixturesPanelProps {
  roomId: string;
  floorId?: string;
}

const STATUS_OPTIONS: { value: LightStatus; label: string; tone: string }[] = [
  { value: "functional", label: "Functional", tone: "bg-emerald-100 text-emerald-800 border-emerald-300" },
  { value: "non_functional", label: "Out", tone: "bg-red-100 text-red-800 border-red-300" },
  { value: "maintenance_needed", label: "Maintenance needed", tone: "bg-amber-100 text-amber-800 border-amber-300" },
];

function nextLabel(existing: string[]): string {
  const used = new Set(existing);
  for (let i = 1; i <= 99; i++) {
    const candidate = `A${i}`;
    if (!used.has(candidate)) return candidate;
  }
  return `A${existing.length + 1}`;
}

export function RoomFixturesPanel({ roomId, floorId }: RoomFixturesPanelProps) {
  const queryClient = useQueryClient();
  const { data: fixtures = [], isLoading } = useSpaceFixtures(roomId, "room");
  const createFixture = useCreateFixture();
  const updateStatus = useUpdateFixtureStatus();
  const [busyId, setBusyId] = useState<string | null>(null);

  // Look up building_id from the floor (best-effort)
  const { data: floor } = useQuery({
    queryKey: ["floor-building", floorId],
    queryFn: async () => {
      if (!floorId) return null;
      const { data, error } = await db.from("floors").select("id,building_id").eq("id", floorId).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!floorId,
    staleTime: 60_000,
  });

  // Repeat-offender heuristic: scan_count >= 3 OR ballast issue history
  const isRepeatOffender = (f: { times_scanned?: number | null; scan_count?: number | null; ballast_issue?: boolean }) =>
    ((f.times_scanned ?? f.scan_count ?? 0) >= 3) || !!f.ballast_issue;

  const sorted = useMemo(
    () => [...fixtures].sort((a, b) => (a.name || "").localeCompare(b.name || "", undefined, { numeric: true })),
    [fixtures]
  );

  const handleAdd = async () => {
    try {
      const label = nextLabel(fixtures.map((f) => f.name));
      await createFixture.mutateAsync({
        name: label,
        type: "standard" as LightingType,
        status: "functional",
        position: "ceiling",
        bulb_count: 1,
        space_id: roomId,
        space_type: "room",
        floor_id: floorId,
        building_id: floor?.building_id ?? undefined,
      });
      toast.success(`Added fixture ${label}`);
    } catch (err) {
      toast.error(`Add failed: ${getErrorMessage(err)}`);
    }
  };

  const handleStatusChange = async (fixtureId: string, status: LightStatus) => {
    setBusyId(fixtureId);
    try {
      await updateStatus.mutateAsync({
        fixtureId,
        payload: {
          status,
          ballast_issue: false,
          requires_electrician: false,
          resolved_at: status === "functional" ? new Date().toISOString() : undefined,
        },
      });
    } catch (err) {
      toast.error(`Update failed: ${getErrorMessage(err)}`);
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (fixtureId: string, name: string) => {
    if (!confirm(`Remove fixture ${name}?`)) return;
    setBusyId(fixtureId);
    try {
      const { error } = await db.from("lighting_fixtures").delete().eq("id", fixtureId);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: lightingKeys.fixturesBySpace(roomId, "room") });
      queryClient.invalidateQueries({ queryKey: lightingKeys.fixtures() });
      toast.success("Fixture removed");
    } catch (err) {
      toast.error(`Remove failed: ${getErrorMessage(err)}`);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Label each fixture so issues can be reported against a specific one.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleAdd}
          disabled={createFixture.isPending}
          className="min-h-[44px]"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add fixture
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-20 w-full" />
      ) : sorted.length === 0 ? (
        <Card>
          <CardContent className="py-6 text-center text-sm text-muted-foreground">
            No fixtures tracked yet. Tap <span className="font-medium">Add fixture</span> to start (A1, A2, A3…).
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-2">
          {sorted.map((f) => {
            const repeat = isRepeatOffender(f as never);
            return (
              <li
                key={f.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-card p-3"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Badge variant="outline" className="font-mono">
                    {f.name}
                  </Badge>
                  {repeat && (
                    <span className="inline-flex items-center gap-1 text-xs text-amber-700">
                      <AlertTriangle className="h-3 w-3" />
                      Repeat offender
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={f.status ?? "functional"}
                    onValueChange={(v) => handleStatusChange(f.id, v as LightStatus)}
                    disabled={busyId === f.id}
                  >
                    <SelectTrigger className="h-9 w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => handleDelete(f.id, f.name)}
                    disabled={busyId === f.id}
                    aria-label={`Remove ${f.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
