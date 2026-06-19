import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format, subDays } from "date-fns";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckCircledIcon,
  Cross2Icon,
  PlusIcon,
  TrashIcon,
} from "@radix-ui/react-icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ModalFrame } from "@shared/components/common/common/ModalFrame";
import { useToast } from "@shared/hooks/use-toast";
import type { KeyPersonnelRow } from "@features/court/services/keyPersonnelManagement";
import {
  createChambersTransition,
  type ChamberRoom,
  type ChambersTransitionWorkType,
} from "@features/court/services/chambersMoveManagement";

interface MoveRow {
  id: string;
  personnelId: string;
  fromRoomId: string;
  toRoomId: string;
}

interface PreparationRow {
  id: string;
  workType: ChambersTransitionWorkType;
  roomId: string;
  date: string;
  startTime: string;
  endTime: string;
  requiresOfficer: boolean;
  notes: string;
}

const WORK_LABELS: Record<ChambersTransitionWorkType, string> = {
  painting: "Painting",
  cleaning: "Floor or room cleaning",
  electrical: "Electrical work",
  construction: "Construction",
  general: "Other preparation",
  security_coverage: "Move-day officer coverage",
};

const QUICK_WORK: ChambersTransitionWorkType[] = [
  "painting",
  "cleaning",
  "electrical",
  "construction",
  "general",
];

function rowId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function blankMove(): MoveRow {
  return {
    id: rowId(),
    personnelId: "",
    fromRoomId: "",
    toRoomId: "",
  };
}

function personName(person: KeyPersonnelRow | null | undefined) {
  return person?.full_name || person?.display_name || "Unknown person";
}

function displayDate(date: string) {
  return date
    ? format(new Date(`${date}T12:00:00`), "MMM d, yyyy")
    : "Not selected";
}

export function ChambersTransitionWizard({
  open,
  onOpenChange,
  personnel,
  rooms,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  personnel: KeyPersonnelRow[];
  rooms: ChamberRoom[];
  onCreated: () => void;
}) {
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState("Chambers transition");
  const [effectiveDate, setEffectiveDate] = useState("");
  const [notes, setNotes] = useState("");
  const [moves, setMoves] = useState<MoveRow[]>([blankMove()]);
  const [preparations, setPreparations] = useState<PreparationRow[]>([]);
  const [error, setError] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const today = format(new Date(), "yyyy-MM-dd");

  const judges = useMemo(
    () =>
      personnel.filter((person) => {
        const role = `${person.primary_role || ""} ${person.title || ""}`.toLowerCase();
        return role.includes("judge") || role.includes("justice");
      }),
    [personnel],
  );

  const reset = () => {
    setStep(1);
    setTitle("Chambers transition");
    setEffectiveDate("");
    setNotes("");
    setMoves([blankMove()]);
    setPreparations([]);
    setError("");
  };

  const updateMove = (id: string, updates: Partial<MoveRow>) => {
    setMoves((current) =>
      current.map((move) => (move.id === id ? { ...move, ...updates } : move)),
    );
  };

  const selectPerson = (id: string, personnelId: string) => {
    const person = personnel.find((item) => item.id === personnelId);
    const currentRoom = rooms.find(
      (room) => room.room_number === person?.chambers_room_number,
    );
    updateMove(id, {
      personnelId,
      fromRoomId: currentRoom?.id || "",
    });
  };

  const defaultPreparationDate = () => {
    if (!effectiveDate) return today;
    const dayBefore = format(
      subDays(new Date(`${effectiveDate}T12:00:00`), 1),
      "yyyy-MM-dd",
    );
    return dayBefore < today ? today : dayBefore;
  };

  const addPreparation = (workType: ChambersTransitionWorkType) => {
    const firstDestination = moves.find((move) => move.toRoomId)?.toRoomId || "";
    const moveDay = workType === "security_coverage";
    setPreparations((current) => [
      ...current,
      {
        id: rowId(),
        workType,
        roomId: firstDestination,
        date: moveDay ? effectiveDate : defaultPreparationDate(),
        startTime: moveDay ? "08:00" : "09:00",
        endTime: moveDay ? "17:00" : "16:00",
        requiresOfficer: moveDay,
        notes: "",
      },
    ]);
  };

  const updatePreparation = (
    id: string,
    updates: Partial<PreparationRow>,
  ) => {
    setPreparations((current) =>
      current.map((item) => (item.id === id ? { ...item, ...updates } : item)),
    );
  };

  const validateMoves = () => {
    const validMoves = moves.filter(
      (move) => move.personnelId && move.toRoomId,
    );
    if (!title.trim()) return "Enter a transition title.";
    if (!effectiveDate) return "Choose the move date.";
    if (validMoves.length === 0) {
      return "Add at least one person and destination room.";
    }
    if (validMoves.length !== moves.length) {
      return "Finish or remove each incomplete move row.";
    }
    if (
      new Set(validMoves.map((move) => move.personnelId)).size !==
      validMoves.length
    ) {
      return "A person can appear only once.";
    }
    if (
      new Set(validMoves.map((move) => move.toRoomId)).size !==
      validMoves.length
    ) {
      return "Each destination room can be used only once.";
    }
    return "";
  };

  const validatePreparations = () => {
    const incomplete = preparations.some(
      (item) => !item.roomId || !item.date || !item.startTime,
    );
    return incomplete
      ? "Each preparation item needs a room, date, and start time."
      : "";
  };

  const goNext = () => {
    const validationError =
      step === 1 ? validateMoves() : validatePreparations();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError("");
    setStep((current) => Math.min(3, current + 1));
  };

  const createTransition = useMutation({
    mutationFn: async () => {
      const moveError = validateMoves();
      const preparationError = validatePreparations();
      if (moveError || preparationError) {
        throw new Error(moveError || preparationError);
      }

      return createChambersTransition({
        title: title.trim(),
        effectiveDate,
        notes: notes.trim(),
        legs: moves.map((move, index) => ({
          personnel_id: move.personnelId,
          from_room_id: move.fromRoomId || null,
          to_room_id: move.toRoomId,
          sequence_order: index + 1,
        })),
        workItems: preparations.map((item) => ({
          room_id: item.roomId,
          work_type: item.workType,
          title: `${WORK_LABELS[item.workType]} — Room ${
            rooms.find((room) => room.id === item.roomId)?.room_number || ""
          }`,
          scheduled_start_date: new Date(
            `${item.date}T${item.startTime}:00`,
          ).toISOString(),
          scheduled_end_date: item.endTime
            ? new Date(`${item.date}T${item.endTime}:00`).toISOString()
            : null,
          requires_officer: item.requiresOfficer,
          notes: item.notes.trim(),
        })),
      });
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["chambers-move-plans"] });
      queryClient.invalidateQueries({ queryKey: ["maintenance-schedules"] });
      queryClient.invalidateQueries({ queryKey: ["maintenance-calendar"] });
      queryClient.invalidateQueries({ queryKey: ["maintenance-stats"] });
      queryClient.invalidateQueries({ queryKey: ["staff-tasks"] });
      onCreated();
      onOpenChange(false);
      reset();
      toast({
        title: "Chambers transition scheduled",
        description: `${result.maintenance_schedules_created} maintenance schedule${
          result.maintenance_schedules_created === 1 ? "" : "s"
        } and ${result.coverage_tasks_created} officer coverage task${
          result.coverage_tasks_created === 1 ? "" : "s"
        } created.`,
      });
    },
    onError: (mutationError: Error) => {
      setError(mutationError.message);
      toast({
        title: "Could not create transition",
        description: mutationError.message,
        variant: "destructive",
      });
    },
  });

  const stepLabels = ["Move", "Preparation", "Review"];

  return (
    <ModalFrame
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) reset();
      }}
      title="Plan chambers transition"
      description="Create the occupancy change, preparation schedules, and required officer coverage in one entry."
      size="xl"
    >
      <div className="space-y-5">
        <div className="grid grid-cols-3 overflow-hidden rounded-md border border-border">
          {stepLabels.map((label, index) => {
            const number = index + 1;
            const active = number === step;
            const completed = number < step;
            return (
              <div
                key={label}
                className={`flex items-center gap-2 border-r border-border px-3 py-2.5 text-xs last:border-r-0 sm:px-4 ${
                  active ? "bg-foreground text-background" : "bg-muted/20"
                }`}
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-semibold ${
                    active
                      ? "border-background/40"
                      : completed
                        ? "border-foreground bg-foreground text-background"
                        : "border-border text-muted-foreground"
                  }`}
                >
                  {completed ? <CheckCircledIcon className="h-3.5 w-3.5" /> : number}
                </span>
                <span className="font-medium">{label}</span>
              </div>
            );
          })}
        </div>

        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
          >
            <Cross2Icon className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-[1.4fr_0.8fr]">
              <div className="space-y-2">
                <Label htmlFor="transition-title">Transition title</Label>
                <Input
                  id="transition-title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="transition-date">Move date</Label>
                <Input
                  id="transition-date"
                  type="date"
                  value={effectiveDate}
                  min={today}
                  onChange={(event) => setEffectiveDate(event.target.value)}
                />
              </div>
            </div>

            <div className="overflow-hidden rounded-md border border-border">
              <div className="flex items-center justify-between border-b border-border bg-muted/20 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold">Who is moving</p>
                  <p className="text-xs text-muted-foreground">
                    Add everyone in the chain so the rooms update together.
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setMoves((current) => [...current, blankMove()])}
                >
                  <PlusIcon className="mr-1.5 h-3.5 w-3.5" />
                  Add person
                </Button>
              </div>

              <div className="divide-y divide-border">
                {moves.map((move, index) => {
                  const usedDestinations = moves
                    .filter((item) => item.id !== move.id)
                    .map((item) => item.toRoomId)
                    .filter(Boolean);
                  return (
                    <div
                      key={move.id}
                      className="grid gap-3 px-4 py-4 md:grid-cols-[1.2fr_1fr_auto_1fr_auto] md:items-end"
                    >
                      <div className="space-y-2">
                        <Label>Person</Label>
                        <Select
                          value={move.personnelId}
                          onValueChange={(value) => selectPerson(move.id, value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select judge" />
                          </SelectTrigger>
                          <SelectContent>
                            {judges.map((judge) => (
                              <SelectItem
                                key={judge.id}
                                value={judge.id}
                                disabled={moves.some(
                                  (item) =>
                                    item.id !== move.id &&
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
                          value={move.fromRoomId || "__none__"}
                          onValueChange={(value) =>
                            updateMove(move.id, {
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

                      <ArrowRightIcon className="mb-2 hidden h-4 w-4 text-muted-foreground md:block" />

                      <div className="space-y-2">
                        <Label>Destination</Label>
                        <Select
                          value={move.toRoomId}
                          onValueChange={(value) =>
                            updateMove(move.id, { toRoomId: value })
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
                                  room.id === move.fromRoomId ||
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
                        disabled={moves.length === 1}
                        onClick={() =>
                          setMoves((current) =>
                            current.filter((item) => item.id !== move.id),
                          )
                        }
                        aria-label={`Remove person ${index + 1}`}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="transition-notes">Coordination notes</Label>
              <Textarea
                id="transition-notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Move contacts, access restrictions, or other context"
                rows={3}
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div>
              <p className="text-sm font-semibold">Preparation work</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Add only what is needed. Maintenance schedules are created automatically,
                and an officer task is created only when coverage is checked.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {QUICK_WORK.map((workType) => (
                <Button
                  key={workType}
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => addPreparation(workType)}
                >
                  <PlusIcon className="mr-1.5 h-3.5 w-3.5" />
                  {WORK_LABELS[workType]}
                </Button>
              ))}
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => addPreparation("security_coverage")}
              >
                <PlusIcon className="mr-1.5 h-3.5 w-3.5" />
                Move-day coverage
              </Button>
            </div>

            {preparations.length === 0 ? (
              <div className="rounded-md border border-dashed border-border px-5 py-8 text-center">
                <p className="text-sm font-medium">No preparation work added</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  That is okay. The transition can contain only the room move.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {preparations.map((item, index) => {
                  const isCoverage = item.workType === "security_coverage";
                  return (
                    <div
                      key={item.id}
                      className="rounded-md border border-border bg-muted/10 p-4"
                    >
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold">
                            Preparation {index + 1}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {isCoverage
                              ? "Creates one court officer task."
                              : "Creates one maintenance schedule."}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            setPreparations((current) =>
                              current.filter((row) => row.id !== item.id),
                            )
                          }
                          aria-label={`Remove preparation ${index + 1}`}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Work type</Label>
                          <Select
                            value={item.workType}
                            onValueChange={(value: ChambersTransitionWorkType) =>
                              updatePreparation(item.id, {
                                workType: value,
                                requiresOfficer:
                                  value === "security_coverage"
                                    ? true
                                    : item.requiresOfficer,
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(WORK_LABELS).map(([value, label]) => (
                                <SelectItem key={value} value={value}>
                                  {label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Room</Label>
                          <Select
                            value={item.roomId}
                            onValueChange={(value) =>
                              updatePreparation(item.id, { roomId: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select room" />
                            </SelectTrigger>
                            <SelectContent>
                              {rooms.map((room) => (
                                <SelectItem key={room.id} value={room.id}>
                                  {room.room_number} — {room.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Date</Label>
                          <Input
                            type="date"
                            value={item.date}
                            onChange={(event) =>
                              updatePreparation(item.id, {
                                date: event.target.value,
                              })
                            }
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label>Start</Label>
                            <Input
                              type="time"
                              value={item.startTime}
                              onChange={(event) =>
                                updatePreparation(item.id, {
                                  startTime: event.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>End</Label>
                            <Input
                              type="time"
                              value={item.endTime}
                              onChange={(event) =>
                                updatePreparation(item.id, {
                                  endTime: event.target.value,
                                })
                              }
                            />
                          </div>
                        </div>
                      </div>

                      {!isCoverage && (
                        <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-md border border-border bg-background px-3 py-3">
                          <Checkbox
                            checked={item.requiresOfficer}
                            onCheckedChange={(checked) =>
                              updatePreparation(item.id, {
                                requiresOfficer: checked === true,
                              })
                            }
                            className="mt-0.5"
                          />
                          <span>
                            <span className="block text-sm font-medium">
                              Court officer presence required
                            </span>
                            <span className="block text-xs text-muted-foreground">
                              Creates one linked coverage task for this work window.
                            </span>
                          </span>
                        </label>
                      )}

                      <div className="mt-4 space-y-2">
                        <Label>Instructions</Label>
                        <Textarea
                          value={item.notes}
                          onChange={(event) =>
                            updatePreparation(item.id, {
                              notes: event.target.value,
                            })
                          }
                          placeholder="Access, vendor, surface, or officer instructions"
                          rows={2}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <div className="grid gap-4 border-b border-border pb-5 sm:grid-cols-[1.4fr_0.6fr]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Transition
                </p>
                <h3 className="mt-2 text-lg font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Effective {displayDate(effectiveDate)}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="border-l border-border pl-3">
                  <p className="font-mono text-xl font-semibold">{moves.length}</p>
                  <p className="text-xs text-muted-foreground">Room moves</p>
                </div>
                <div className="border-l border-border pl-3">
                  <p className="font-mono text-xl font-semibold">
                    {preparations.length}
                  </p>
                  <p className="text-xs text-muted-foreground">Preparations</p>
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Occupancy
              </p>
              <div className="mt-3 divide-y divide-border rounded-md border border-border">
                {moves.map((move) => {
                  const person = personnel.find(
                    (item) => item.id === move.personnelId,
                  );
                  const fromRoom = rooms.find(
                    (room) => room.id === move.fromRoomId,
                  );
                  const toRoom = rooms.find((room) => room.id === move.toRoomId);
                  return (
                    <div
                      key={move.id}
                      className="flex flex-wrap items-center gap-2 px-4 py-3 text-sm"
                    >
                      <span className="font-medium">{personName(person)}</span>
                      <span className="font-mono text-xs text-muted-foreground">
                        {fromRoom?.room_number || "Unassigned"}
                      </span>
                      <ArrowRightIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="font-mono text-xs font-semibold">
                        {toRoom?.room_number}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Records to create
              </p>
              {preparations.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  No preparation schedules or coverage tasks.
                </p>
              ) : (
                <div className="mt-3 divide-y divide-border rounded-md border border-border">
                  {preparations.map((item) => {
                    const room = rooms.find((row) => row.id === item.roomId);
                    return (
                      <div
                        key={item.id}
                        className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <p className="text-sm font-medium">
                            {WORK_LABELS[item.workType]} · Room {room?.room_number}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {displayDate(item.date)} · {item.startTime}
                            {item.endTime ? `–${item.endTime}` : ""}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {item.workType !== "security_coverage" && (
                            <Badge variant="outline">Maintenance schedule</Badge>
                          )}
                          {(item.requiresOfficer ||
                            item.workType === "security_coverage") && (
                            <Badge variant="secondary">Officer task</Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {notes && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Coordination notes
                </p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {notes}
                </p>
              </div>
            )}
          </div>
        )}

        <div className="sticky bottom-0 -mx-4 -mb-3 flex items-center justify-between gap-3 border-t border-border bg-background px-4 pb-3 pt-4 sm:-mx-6 sm:-mb-6 sm:px-6 sm:pb-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (step === 1) onOpenChange(false);
              else {
                setError("");
                setStep((current) => current - 1);
              }
            }}
          >
            {step === 1 ? (
              "Cancel"
            ) : (
              <>
                <ArrowLeftIcon className="mr-1.5 h-4 w-4" />
                Back
              </>
            )}
          </Button>

          {step < 3 ? (
            <Button type="button" onClick={goNext} className="active:translate-y-px">
              Continue
              <ArrowRightIcon className="ml-1.5 h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="button"
              disabled={createTransition.isPending}
              onClick={() => createTransition.mutate()}
              className="active:translate-y-px"
            >
              {createTransition.isPending ? "Creating..." : "Create transition"}
            </Button>
          )}
        </div>
      </div>
    </ModalFrame>
  );
}
