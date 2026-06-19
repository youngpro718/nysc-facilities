import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  ArrowRightIcon,
  CalendarIcon,
  CheckCircledIcon,
  ClockIcon,
  CrossCircledIcon,
  PlusIcon,
  TrashIcon,
} from "@radix-ui/react-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ModalFrame } from "@shared/components/common/common/ModalFrame";
import { useToast } from "@shared/hooks/use-toast";
import type { KeyPersonnelRow } from "@features/court/services/keyPersonnelManagement";
import {
  cancelChambersMovePlan,
  completeChambersMovePlan,
  listChamberRooms,
  listChambersMovePlans,
  type ChambersMovePlan,
  updateChambersMovePlan,
} from "@features/court/services/chambersMoveManagement";
import { ChambersTransitionWizard } from "./ChambersTransitionWizard";

interface MoveRow {
  rowId: string;
  personnelId: string;
  fromRoomId: string;
  toRoomId: string;
}

function createMoveRow(): MoveRow {
  return {
    rowId: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    personnelId: "",
    fromRoomId: "",
    toRoomId: "",
  };
}

function personName(person: KeyPersonnelRow | null | undefined) {
  return person?.full_name || person?.display_name || "Unknown person";
}

function planDate(date: string) {
  return format(new Date(`${date}T12:00:00`), "MMM d, yyyy");
}

function workTypeLabel(workType: string) {
  if (workType === "cleaning") return "Floor cleaning";
  if (workType === "security_coverage") return "Officer coverage";
  return workType.charAt(0).toUpperCase() + workType.slice(1).replace("_", " ");
}

export function ChambersMovePlanner({
  personnel,
  canEdit,
}: {
  personnel: KeyPersonnelRow[];
  canEdit: boolean;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [title, setTitle] = useState("Chambers transition");
  const [effectiveDate, setEffectiveDate] = useState("");
  const [notes, setNotes] = useState("");
  const [moveRows, setMoveRows] = useState<MoveRow[]>([createMoveRow()]);
  const [editingPlan, setEditingPlan] = useState<ChambersMovePlan | null>(null);
  const [completingPlan, setCompletingPlan] = useState<ChambersMovePlan | null>(null);
  const [cancellingPlan, setCancellingPlan] = useState<ChambersMovePlan | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: plans = [], isLoading: plansLoading } = useQuery({
    queryKey: ["chambers-move-plans"],
    queryFn: listChambersMovePlans,
  });

  const { data: rooms = [], isLoading: roomsLoading } = useQuery({
    queryKey: ["chamber-rooms"],
    queryFn: listChamberRooms,
  });

  const judges = useMemo(
    () =>
      personnel.filter((person) => {
        const role = `${person.primary_role || ""} ${person.title || ""}`.toLowerCase();
        return role.includes("judge") || role.includes("justice");
      }),
    [personnel],
  );

  const currentPlans = plans.filter((plan) => plan.status === "scheduled");
  const recentPlans = plans
    .filter((plan) => plan.status !== "scheduled")
    .slice(0, 3);
  const today = format(new Date(), "yyyy-MM-dd");

  const resetForm = () => {
    setTitle("Chambers transition");
    setEffectiveDate("");
    setNotes("");
    setMoveRows([createMoveRow()]);
    setEditingPlan(null);
  };

  const openNewPlan = () => {
    setWizardOpen(true);
  };

  const openEditPlan = (plan: ChambersMovePlan) => {
    setEditingPlan(plan);
    setTitle(plan.title);
    setEffectiveDate(plan.effective_date);
    setNotes(plan.notes || "");
    setMoveRows(
      plan.legs.map((leg) => ({
        rowId: leg.id,
        personnelId: leg.personnel_id,
        fromRoomId: leg.from_room_id || "",
        toRoomId: leg.to_room_id,
      })),
    );
    setDialogOpen(true);
  };

  const updateRow = (rowId: string, updates: Partial<MoveRow>) => {
    setMoveRows((current) =>
      current.map((row) => (row.rowId === rowId ? { ...row, ...updates } : row)),
    );
  };

  const selectPerson = (rowId: string, personnelId: string) => {
    const selectedPerson = personnel.find((person) => person.id === personnelId);
    const currentRoom = rooms.find(
      (room) => room.room_number === selectedPerson?.chambers_room_number,
    );
    updateRow(rowId, {
      personnelId,
      fromRoomId: currentRoom?.id || "",
    });
  };

  const createPlan = useMutation({
    mutationFn: async () => {
      const validRows = moveRows.filter(
        (row) => row.personnelId && row.toRoomId,
      );
      if (!effectiveDate) throw new Error("Choose an effective date.");
      if (validRows.length === 0) {
        throw new Error("Add at least one person and destination room.");
      }

      const personnelIds = validRows.map((row) => row.personnelId);
      const destinationIds = validRows.map((row) => row.toRoomId);
      if (new Set(personnelIds).size !== personnelIds.length) {
        throw new Error("A person can appear only once in a move plan.");
      }
      if (new Set(destinationIds).size !== destinationIds.length) {
        throw new Error("Each destination room can be used only once.");
      }

      const input = {
        title: title.trim() || "Chambers transition",
        effectiveDate,
        notes: notes.trim(),
        legs: validRows.map((row, index) => ({
          personnel_id: row.personnelId,
          from_room_id: row.fromRoomId || null,
          to_room_id: row.toRoomId,
          sequence_order: index + 1,
        })),
      };

      if (!editingPlan) throw new Error("Choose a scheduled move to edit.");
      await updateChambersMovePlan(editingPlan.id, input);
      return "updated";
    },
    onSuccess: (action) => {
      queryClient.invalidateQueries({ queryKey: ["chambers-move-plans"] });
      setDialogOpen(false);
      resetForm();
      toast({
        title:
          action === "updated"
            ? "Chambers move updated"
            : "Chambers move scheduled",
        description: "Current room assignments remain unchanged until the move is completed.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Could not schedule move",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const completePlan = useMutation({
    mutationFn: completeChambersMovePlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chambers-move-plans"] });
      queryClient.invalidateQueries({ queryKey: ["key-personnel"] });
      queryClient.invalidateQueries({ queryKey: ["court-personnel"] });
      queryClient.invalidateQueries({ queryKey: ["chamber-rooms"] });
      queryClient.invalidateQueries({ queryKey: ["enhanced-room-data"] });
      setCompletingPlan(null);
      toast({
        title: "Chambers move completed",
        description: "Personnel and room records now show the new assignments.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Could not complete move",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const cancelPlan = useMutation({
    mutationFn: cancelChambersMovePlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chambers-move-plans"] });
      setCancellingPlan(null);
      toast({ title: "Chambers move cancelled" });
    },
    onError: (error: Error) => {
      toast({
        title: "Could not cancel move",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <section className="overflow-hidden rounded-md border border-border bg-card">
      <div className="flex flex-col gap-4 border-b border-border bg-muted/20 px-4 py-5 md:flex-row md:items-end md:justify-between md:px-6">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            <CalendarIcon className="h-4 w-4" />
            Effective-dated changes
          </div>
          <h2 className="text-xl font-semibold tracking-tight">Chambers Moves</h2>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Plan future occupancy without changing today&apos;s room directory.
          </p>
        </div>
        {canEdit && (
          <Button onClick={openNewPlan} className="active:translate-y-px">
            <PlusIcon className="mr-2 h-4 w-4" />
            Plan chambers transition
          </Button>
        )}
      </div>

      {plansLoading ? (
        <div className="px-6 py-8 text-sm text-muted-foreground">
          Loading move plans...
        </div>
      ) : currentPlans.length === 0 && recentPlans.length === 0 ? (
        <div className="px-6 py-8">
          <p className="text-sm font-medium">No chambers moves scheduled</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Current occupancy will stay unchanged until a planned move is completed.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {[...currentPlans, ...recentPlans].map((plan) => {
            const isDue = plan.effective_date <= today;
            return (
              <div key={plan.id} className="px-4 py-4 md:px-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold">{plan.title}</p>
                      <Badge
                        variant={plan.status === "scheduled" ? "outline" : "secondary"}
                        className="capitalize"
                      >
                        {plan.status === "scheduled" && isDue ? "Ready" : plan.status}
                      </Badge>
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                      {plan.status === "completed" ? (
                        <CheckCircledIcon className="h-3.5 w-3.5" />
                      ) : plan.status === "cancelled" ? (
                        <CrossCircledIcon className="h-3.5 w-3.5" />
                      ) : (
                        <ClockIcon className="h-3.5 w-3.5" />
                      )}
                      Effective {planDate(plan.effective_date)}
                    </div>

                    <div className="mt-3 space-y-2">
                      {plan.legs.map((leg) => (
                        <div
                          key={leg.id}
                          className="flex flex-wrap items-center gap-2 text-sm"
                        >
                          <span className="font-medium">
                            {leg.person?.full_name ||
                              leg.person?.display_name ||
                              "Unknown person"}
                          </span>
                          <span className="font-mono text-xs text-muted-foreground">
                            {leg.from_room?.room_number || "Unassigned"}
                          </span>
                          <ArrowRightIcon className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="font-mono text-xs font-semibold">
                            {leg.to_room?.room_number || "Unknown room"}
                          </span>
                        </div>
                      ))}
                    </div>
                    {plan.notes && (
                      <p className="mt-3 max-w-3xl text-xs leading-relaxed text-muted-foreground">
                        {plan.notes}
                      </p>
                    )}
                    {(plan.preparations || []).length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {(plan.preparations || []).map((item) => (
                          <Badge
                            key={item.id}
                            variant="secondary"
                            className="font-normal"
                          >
                            {workTypeLabel(item.work_type)}
                            {item.room?.room_number
                              ? ` · Room ${item.room.room_number}`
                              : ""}
                            {item.requires_officer ? " · Officer" : ""}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {canEdit && plan.status === "scheduled" && (
                    <div className="flex shrink-0 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditPlan(plan)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCancellingPlan(plan)}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        disabled={!isDue}
                        onClick={() => setCompletingPlan(plan)}
                      >
                        {isDue ? "Complete move" : `Available ${planDate(plan.effective_date)}`}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ChambersTransitionWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        personnel={personnel}
        rooms={rooms}
        onCreated={() => {
          queryClient.invalidateQueries({ queryKey: ["chambers-move-plans"] });
        }}
      />

      <ModalFrame
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}
        title="Edit move details"
        description="Update the people, rooms, date, or notes. Preparation schedules remain available in Maintenance and Tasks."
        size="lg"
      >
        <form
          className="space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            createPlan.mutate();
          }}
        >
          <div className="grid gap-4 sm:grid-cols-[1.4fr_0.8fr]">
            <div className="space-y-2">
              <Label htmlFor="move-title">Plan title</Label>
              <Input
                id="move-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="move-date">Effective date</Label>
              <Input
                id="move-date"
                type="date"
                value={effectiveDate}
                min={today}
                onChange={(event) => setEffectiveDate(event.target.value)}
                required
              />
            </div>
          </div>

          <div className="rounded-md border border-border bg-muted/20">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div>
                <p className="text-sm font-semibold">Move assignments</p>
                <p className="text-xs text-muted-foreground">
                  Add every person involved so chained moves complete together.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setMoveRows((current) => [...current, createMoveRow()])}
              >
                <PlusIcon className="mr-1.5 h-3.5 w-3.5" />
                Add move
              </Button>
            </div>

            <div className="divide-y divide-border">
              {moveRows.map((row, index) => {
                const usedDestinations = moveRows
                  .filter((item) => item.rowId !== row.rowId)
                  .map((item) => item.toRoomId)
                  .filter(Boolean);
                return (
                  <div
                    key={row.rowId}
                    className="grid gap-3 px-4 py-4 md:grid-cols-[1.2fr_1fr_auto_1fr_auto] md:items-end"
                  >
                    <div className="space-y-2">
                      <Label>Person</Label>
                      <Select
                        value={row.personnelId}
                        onValueChange={(value) => selectPerson(row.rowId, value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select judge" />
                        </SelectTrigger>
                        <SelectContent>
                          {judges.map((judge) => (
                            <SelectItem
                              key={judge.id}
                              value={judge.id}
                              disabled={moveRows.some(
                                (item) =>
                                  item.rowId !== row.rowId &&
                                  item.personnelId === judge.id,
                              )}
                            >
                              {personName(judge)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Current room</Label>
                      <Select
                        value={row.fromRoomId || "__none__"}
                        onValueChange={(value) =>
                          updateRow(row.rowId, {
                            fromRoomId: value === "__none__" ? "" : value,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">Unassigned</SelectItem>
                          {rooms.map((room) => (
                            <SelectItem key={room.id} value={room.id}>
                              {room.room_number} — {room.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="hidden pb-2 md:block">
                      <ArrowRightIcon className="h-4 w-4 text-muted-foreground" />
                    </div>

                    <div className="space-y-2">
                      <Label>Destination</Label>
                      <Select
                        value={row.toRoomId}
                        onValueChange={(value) =>
                          updateRow(row.rowId, { toRoomId: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select room" />
                        </SelectTrigger>
                        <SelectContent>
                          {rooms.map((room) => (
                            <SelectItem
                              key={room.id}
                              value={room.id}
                              disabled={
                                room.id === row.fromRoomId ||
                                usedDestinations.includes(room.id)
                              }
                            >
                              {room.room_number} — {room.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={moveRows.length === 1}
                      onClick={() =>
                        setMoveRows((current) =>
                          current.filter((item) => item.rowId !== row.rowId),
                        )
                      }
                      aria-label={`Remove move ${index + 1}`}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="move-notes">Coordination notes</Label>
            <Textarea
              id="move-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Preparation work, access requirements, or people who need notice"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createPlan.isPending || roomsLoading}>
              {createPlan.isPending
                ? "Saving..."
                : editingPlan
                  ? "Save changes"
                  : "Schedule move"}
            </Button>
          </div>
        </form>
      </ModalFrame>

      <AlertDialog
        open={!!completingPlan}
        onOpenChange={(open) => !open && setCompletingPlan(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Complete this chambers move?</AlertDialogTitle>
            <AlertDialogDescription>
              This will update the personnel directory and room names to the new
              assignments. The plan remains in history after completion.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep scheduled</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                completingPlan && completePlan.mutate(completingPlan.id)
              }
            >
              Complete move
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!cancellingPlan}
        onOpenChange={(open) => !open && setCancellingPlan(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this chambers move?</AlertDialogTitle>
            <AlertDialogDescription>
              Current occupancy will remain unchanged. The cancelled plan will stay
              in recent history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep scheduled</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() =>
                cancellingPlan && cancelPlan.mutate(cancellingPlan.id)
              }
            >
              Cancel move
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
