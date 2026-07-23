import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Lightbulb, Plus, Trash2, AlertTriangle, ChevronDown } from "lucide-react";
import { db } from "@/services/core/supabaseClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useSpaceFixtures, useUpdateFixtureStatus, useCreateFixture, lightingKeys } from "../hooks/useLightingData";
import { nextFixtureLabels } from "../services/lightingService";
import type { LightStatus, LightingType, UpdateFixtureStatusPayload } from "../services/lightingService";
import { getErrorMessage } from "@/lib/errorUtils";

interface RoomFixturesPanelProps {
  roomId: string;
  floorId?: string;
}

const STATUS_OPTIONS: { value: LightStatus; label: string }[] = [
  { value: "functional", label: "Functional" },
  { value: "non_functional", label: "Out" },
  { value: "maintenance_needed", label: "Maintenance needed" },
];

export function RoomFixturesPanel({ roomId, floorId }: RoomFixturesPanelProps) {
  const queryClient = useQueryClient();
  const { data: fixtures = [], isLoading } = useSpaceFixtures(roomId, "room");
  const createFixture = useCreateFixture();
  const updateStatus = useUpdateFixtureStatus();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null);

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

  const isRepeatOffender = (f: { times_scanned?: number | null; ballast_issue?: boolean }) =>
    ((f.times_scanned ?? 0) >= 3) || !!f.ballast_issue;

  const sorted = useMemo(
    () => [...fixtures].sort((a, b) => (a.name || "").localeCompare(b.name || "", undefined, { numeric: true })),
    [fixtures]
  );

  const handleAdd = async () => {
    try {
      const [label] = nextFixtureLabels(fixtures.map((f) => f.name));
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

  const patch = async (fixtureId: string, payload: UpdateFixtureStatusPayload) => {
    setBusyId(fixtureId);
    try {
      await updateStatus.mutateAsync({ fixtureId, payload });
    } catch (err) {
      toast.error(`Update failed: ${getErrorMessage(err)}`);
    } finally {
      setBusyId(null);
    }
  };

  const handleStatusChange = (f: { id: string; status: LightStatus | null }, status: LightStatus) =>
    patch(f.id, {
      status,
      resolved_at: status === "functional" ? new Date().toISOString() : undefined,
    });

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const { id, name } = pendingDelete;
    setPendingDelete(null);
    setBusyId(id);
    try {
      const { error } = await db.from("lighting_fixtures").delete().eq("id", id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: lightingKeys.fixturesBySpace(roomId, "room") });
      queryClient.invalidateQueries({ queryKey: lightingKeys.fixtures() });
      toast.success(`Removed fixture ${name}`);
    } catch (err) {
      toast.error(`Remove failed: ${getErrorMessage(err)}`);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Lightbulb className="h-4 w-4 text-muted-foreground shrink-0" />
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
          className="min-h-[44px] shrink-0"
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
              <li key={f.id} className="rounded-md border bg-card">
                <Collapsible>
                  <div className="flex flex-wrap items-center justify-between gap-2 p-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <Badge variant="outline" className="font-mono">{f.name}</Badge>
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
                        onValueChange={(v) => handleStatusChange(f as { id: string; status: LightStatus | null }, v as LightStatus)}
                        disabled={busyId === f.id}
                      >
                        <SelectTrigger className="h-9 w-[180px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <CollapsibleTrigger asChild>
                        <Button type="button" variant="ghost" size="icon" className="h-9 w-9" aria-label={`Toggle details for ${f.name}`}>
                          <ChevronDown className={cn("h-4 w-4 transition-transform data-[state=open]:rotate-180")} />
                        </Button>
                      </CollapsibleTrigger>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9"
                        onClick={() => setPendingDelete({ id: f.id, name: f.name })}
                        disabled={busyId === f.id}
                        aria-label={`Remove ${f.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <CollapsibleContent className="border-t bg-muted/20 p-3 space-y-3">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <Label htmlFor={`bc-${f.id}`} className="text-xs">Bulbs in fixture</Label>
                        <Input
                          id={`bc-${f.id}`}
                          type="number"
                          min={1}
                          max={20}
                          defaultValue={f.bulb_count ?? 1}
                          className="h-9"
                          onBlur={(e) => {
                            const v = Math.max(1, Math.min(20, Number(e.target.value) || 1));
                            if (v !== (f.bulb_count ?? 1)) {
                              patch(f.id, { status: (f.status ?? "functional") as LightStatus, bulb_count: v });
                            }
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between gap-3 rounded-md border bg-card px-3 py-2">
                        <Label htmlFor={`bal-${f.id}`} className="text-xs">Ballast issue</Label>
                        <Switch
                          id={`bal-${f.id}`}
                          checked={!!f.ballast_issue}
                          onCheckedChange={(checked) =>
                            patch(f.id, { status: (f.status ?? "functional") as LightStatus, ballast_issue: checked })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between gap-3 rounded-md border bg-card px-3 py-2 sm:col-span-2">
                        <Label htmlFor={`el-${f.id}`} className="text-xs">Requires electrician</Label>
                        <Switch
                          id={`el-${f.id}`}
                          checked={!!f.requires_electrician}
                          onCheckedChange={(checked) =>
                            patch(f.id, { status: (f.status ?? "functional") as LightStatus, requires_electrician: checked })
                          }
                        />
                      </div>
                      <div className="space-y-1 sm:col-span-2">
                        <Label htmlFor={`notes-${f.id}`} className="text-xs">Notes</Label>
                        <Textarea
                          id={`notes-${f.id}`}
                          rows={2}
                          defaultValue={f.notes ?? ""}
                          placeholder="e.g. End-cap closest to door is loose"
                          onBlur={(e) => {
                            const v = e.target.value;
                            if ((v || null) !== (f.notes ?? null)) {
                              patch(f.id, { status: (f.status ?? "functional") as LightStatus, notes: v });
                            }
                          }}
                        />
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </li>
            );
          })}
        </ul>
      )}

      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove fixture {pendingDelete?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the fixture from this room. Existing issue history stays in the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
