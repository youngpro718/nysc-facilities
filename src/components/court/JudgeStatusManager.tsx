import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { UserMinus, UserPlus, Gavel, Crown, MoreHorizontal, Loader2, AlertTriangle, ArrowRightLeft, Pencil, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useCourtPersonnel, type JudgeStatus } from "@/hooks/useCourtPersonnel";
import { updateJudgeStatus, addNewJudge, getJudgeDepartureInfo, processJudgeDeparture, moveJudgeToPart, updateJudgeDetails, swapChambers, getAllAssignmentSlots, type JudgeDepartureInfo, type AssignmentSlot } from "@/services/court/judgeManagement";
import { PersonnelSelector } from "./PersonnelSelector";

/**
 * Inline dropdown for quickly changing a judge's status.
 * Shows next to the judge name in the assignment table.
 */
export function JudgeStatusDropdown({
  judgeName,
  compact = false,
}: {
  judgeName: string;
  compact?: boolean;
}) {
  const { personnel } = useCourtPersonnel();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [departureOpen, setDepartureOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const [editDetailsOpen, setEditDetailsOpen] = useState(false);
  const [swapChambersOpen, setSwapChambersOpen] = useState(false);

  // Find this judge in personnel
  const judge = [...personnel.judges, ...personnel.departedJudges].find(
    (j) => j.name === judgeName
  );

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: JudgeStatus }) => {
      await updateJudgeStatus(id, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["court-personnel"] });
      queryClient.invalidateQueries({ queryKey: ["court-assignments-enhanced"] });
      queryClient.invalidateQueries({ queryKey: ["term-sheet-board"] });
      toast({ title: "Judge status updated" });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  if (!judge) return null;

  const currentStatus = judge.judgeStatus || "active";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {compact ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreHorizontal className="h-3 w-3" />
          </Button>
        ) : (
          <Button variant="ghost" size="sm" className="h-6 px-1.5 gap-1">
            <JudgeStatusBadge status={currentStatus} />
            <MoreHorizontal className="h-3 w-3 opacity-50" />
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        {/* Actions */}
        <DropdownMenuItem onClick={() => setMoveOpen(true)}>
          <ArrowRightLeft className="h-4 w-4 mr-2 text-blue-600" />
          Move to Part...
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setEditDetailsOpen(true)}>
          <Pencil className="h-4 w-4 mr-2 text-slate-600" />
          Edit Details
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setSwapChambersOpen(true)}>
          <Home className="h-4 w-4 mr-2 text-purple-600" />
          Switch Chambers...
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {/* Status changes */}
        {currentStatus !== "active" && (
          <DropdownMenuItem
            onClick={() =>
              statusMutation.mutate({ id: judge.id, status: "active" })
            }
          >
            <Gavel className="h-4 w-4 mr-2 text-green-600" />
            Set as Active Justice
          </DropdownMenuItem>
        )}
        {currentStatus !== "jho" && (
          <DropdownMenuItem
            onClick={() =>
              statusMutation.mutate({ id: judge.id, status: "jho" })
            }
          >
            <Crown className="h-4 w-4 mr-2 text-amber-600" />
            Set as JHO
          </DropdownMenuItem>
        )}
        {currentStatus !== "departed" && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setDepartureOpen(true)}
              className="text-red-600 focus:text-red-600"
            >
              <UserMinus className="h-4 w-4 mr-2" />
              Mark as Departed
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>

      {/* Departure workflow dialog */}
      <JudgeDepartureDialog
        open={departureOpen}
        onOpenChange={setDepartureOpen}
        judgeId={judge.id}
        judgeName={judge.name}
      />
      {/* Move to Part dialog */}
      <MoveJudgeDialog
        open={moveOpen}
        onOpenChange={setMoveOpen}
        judgeName={judge.name}
      />
      {/* Edit Details dialog */}
      <EditJudgeDetailsDialog
        open={editDetailsOpen}
        onOpenChange={setEditDetailsOpen}
        judgeId={judge.id}
        judgeName={judge.name}
        currentCourtAttorney={judge.courtAttorney || ""}
        currentChambersRoom={judge.chambersRoom || ""}
      />
      {/* Switch Chambers dialog */}
      <SwitchChambersDialog
        open={swapChambersOpen}
        onOpenChange={setSwapChambersOpen}
        judgeId={judge.id}
        judgeName={judge.name}
      />
    </DropdownMenu>
  );
}

/**
 * Small badge showing judge status
 */
export function JudgeStatusBadge({ status }: { status: JudgeStatus | string }) {
  if (status === "jho") {
    return (
      <Badge
        variant="secondary"
        className="text-[10px] px-1 py-0 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 font-semibold"
      >
        JHO
      </Badge>
    );
  }
  if (status === "departed") {
    return (
      <Badge
        variant="secondary"
        className="text-[10px] px-1 py-0 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
      >
        Departed
      </Badge>
    );
  }
  return null;
}

/**
 * Departure workflow dialog — when a judge leaves, you must handle
 * their courtroom assignment and chambers before they're removed.
 */
function JudgeDepartureDialog({
  open,
  onOpenChange,
  judgeId,
  judgeName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  judgeId: string;
  judgeName: string;
}) {
  const { personnel } = useCourtPersonnel();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [assignmentAction, setAssignmentAction] = useState<"clear" | "reassign">("clear");
  const [chambersAction, setChambersAction] = useState<"clear" | "reassign">("clear");
  const [newJustice, setNewJustice] = useState("");
  const [newChambersOccupant, setNewChambersOccupant] = useState("");

  // Fetch departure info when dialog opens
  const { data: info, isLoading } = useQuery({
    queryKey: ["judge-departure-info", judgeId],
    queryFn: () => getJudgeDepartureInfo(judgeId),
    enabled: open,
  });

  const departureMutation = useMutation({
    mutationFn: async () => {
      await processJudgeDeparture({
        personnelId: judgeId,
        displayName: judgeName,
        assignmentAction,
        newJusticeForAssignment: assignmentAction === "reassign" ? newJustice : undefined,
        chambersAction,
        newChambersOccupant: chambersAction === "reassign" ? newChambersOccupant : undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["court-personnel"] });
      queryClient.invalidateQueries({ queryKey: ["court-assignments-enhanced"] });
      queryClient.invalidateQueries({ queryKey: ["assignment-stats"] });
      queryClient.invalidateQueries({ queryKey: ["term-sheet-board"] });
      toast({
        title: "Judge departed",
        description: `${judgeName} has been marked as departed. Courtroom and chambers have been ${assignmentAction === "reassign" ? "reassigned" : "cleared"}.`,
      });
      // Reset
      setAssignmentAction("clear");
      setChambersAction("clear");
      setNewJustice("");
      setNewChambersOccupant("");
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  const canSubmit =
    (assignmentAction === "clear" || (assignmentAction === "reassign" && newJustice)) &&
    (chambersAction === "clear" || (chambersAction === "reassign" && newChambersOccupant));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Judge Departure — {judgeName}
          </DialogTitle>
          <DialogDescription>
            Before removing this judge, decide who takes over their courtroom and chambers.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4 py-2">
            {/* Current info summary */}
            <div className="rounded-md border p-3 bg-muted/50 space-y-1.5 text-sm">
              <p className="font-medium">Currently assigned:</p>
              {info?.assignment ? (
                <div className="text-muted-foreground space-y-0.5">
                  <p>Courtroom: <span className="text-foreground font-medium">Room {info.assignment.roomNumber}</span></p>
                  <p>Part: <span className="text-foreground font-medium">{info.assignment.part}</span></p>
                  {info.assignment.sergeant && <p>Sergeant: {info.assignment.sergeant}</p>}
                  {info.assignment.clerks && info.assignment.clerks.length > 0 && (
                    <p>Clerks: {info.assignment.clerks.join(", ")}</p>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">No courtroom assignment found</p>
              )}
              {info?.chambersRoom && (
                <p className="text-muted-foreground">Chambers: <span className="text-foreground font-medium">Room {info.chambersRoom}</span></p>
              )}
              {info?.courtAttorney && (
                <p className="text-muted-foreground">Court Attorney: <span className="text-foreground font-medium">{info.courtAttorney}</span></p>
              )}
            </div>

            {/* Courtroom handoff */}
            {info?.assignment && (
              <div className="space-y-2">
                <Label className="text-xs font-medium">
                  Courtroom (Room {info.assignment.roomNumber}, Part {info.assignment.part})
                </Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={assignmentAction === "clear" ? "default" : "outline"}
                    size="sm"
                    className="flex-1"
                    onClick={() => { setAssignmentAction("clear"); setNewJustice(""); }}
                  >
                    Clear for now
                  </Button>
                  <Button
                    type="button"
                    variant={assignmentAction === "reassign" ? "default" : "outline"}
                    size="sm"
                    className="flex-1"
                    onClick={() => setAssignmentAction("reassign")}
                  >
                    Reassign
                  </Button>
                </div>
                {assignmentAction === "reassign" && (
                  <PersonnelSelector
                    value={newJustice}
                    onValueChange={(v) => setNewJustice(v as string)}
                    personnel={personnel.judges.filter((j) => j.name !== judgeName)}
                    placeholder="Select replacement judge..."
                    role="judge"
                    allowCustom={true}
                    allowClear={true}
                    className="w-full"
                  />
                )}
              </div>
            )}

            {/* Chambers handoff */}
            {info?.chambersRoom && (
              <div className="space-y-2">
                <Label className="text-xs font-medium">
                  Chambers (Room {info.chambersRoom})
                </Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={chambersAction === "clear" ? "default" : "outline"}
                    size="sm"
                    className="flex-1"
                    onClick={() => { setChambersAction("clear"); setNewChambersOccupant(""); }}
                  >
                    Clear for now
                  </Button>
                  <Button
                    type="button"
                    variant={chambersAction === "reassign" ? "default" : "outline"}
                    size="sm"
                    className="flex-1"
                    onClick={() => setChambersAction("reassign")}
                  >
                    Reassign
                  </Button>
                </div>
                {chambersAction === "reassign" && (
                  <PersonnelSelector
                    value={newChambersOccupant}
                    onValueChange={(v) => setNewChambersOccupant(v as string)}
                    personnel={personnel.judges.filter((j) => j.name !== judgeName)}
                    placeholder="Who's moving into chambers..."
                    role="judge"
                    allowCustom={true}
                    allowClear={true}
                    className="w-full"
                  />
                )}
              </div>
            )}

            {/* No chambers/assignment edge case */}
            {!info?.assignment && !info?.chambersRoom && (
              <p className="text-sm text-muted-foreground">
                This judge has no courtroom or chambers to hand off. They will simply be marked as departed.
              </p>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} size="sm">
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => departureMutation.mutate()}
            disabled={!canSubmit || departureMutation.isPending || isLoading}
            size="sm"
          >
            {departureMutation.isPending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <UserMinus className="h-3.5 w-3.5 mr-1.5" />
                Confirm Departure
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Move Judge dialog — pick a destination part/courtroom.
 * If the destination already has a judge, offers to swap.
 */
function MoveJudgeDialog({
  open,
  onOpenChange,
  judgeName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  judgeName: string;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedSlot, setSelectedSlot] = useState<AssignmentSlot | null>(null);
  const [search, setSearch] = useState("");

  // Fetch all assignment slots
  const { data: slots = [], isLoading } = useQuery({
    queryKey: ["assignment-slots-for-move"],
    queryFn: getAllAssignmentSlots,
    enabled: open,
  });

  const sourceSlot = slots.find((s) => s.justice === judgeName);
  const availableSlots = slots.filter((s) => s.justice !== judgeName);
  const filtered = search
    ? availableSlots.filter(
        (s) =>
          s.part.toLowerCase().includes(search.toLowerCase()) ||
          s.roomNumber.toLowerCase().includes(search.toLowerCase()) ||
          (s.justice || "").toLowerCase().includes(search.toLowerCase())
      )
    : availableSlots;

  const moveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedSlot) throw new Error("No destination selected");
      await moveJudgeToPart({
        judgeName,
        targetAssignmentId: selectedSlot.assignmentId,
        swapWithJudge: selectedSlot.justice || undefined,
        sourceAssignmentId: sourceSlot?.assignmentId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["court-assignments-enhanced"] });
      queryClient.invalidateQueries({ queryKey: ["term-sheet-board"] });
      queryClient.invalidateQueries({ queryKey: ["assignment-stats"] });
      const action = selectedSlot?.justice ? `swapped with ${selectedSlot.justice}` : `moved to Part ${selectedSlot?.part}`;
      toast({ title: `${judgeName} ${action}` });
      setSelectedSlot(null);
      setSearch("");
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-blue-600" />
            Move {judgeName}
          </DialogTitle>
          <DialogDescription>
            {sourceSlot
              ? `Currently in Part ${sourceSlot.part} (Room ${sourceSlot.roomNumber}). Pick a new part.`
              : "No current assignment. Pick a part to assign to."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 flex-1 overflow-hidden">
          <Input
            placeholder="Search by part, room, or judge..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />

          {isLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="max-h-[40vh] overflow-y-auto space-y-1 pr-1">
              {filtered.map((slot) => {
                const isSelected = selectedSlot?.assignmentId === slot.assignmentId;
                const isOccupied = !!slot.justice;
                const isTraining = /^(tap\s*[ab]|part\s*1)$/i.test(slot.part) || slot.part === "1";
                return (
                  <button
                    key={slot.assignmentId}
                    onClick={() => setSelectedSlot(isSelected ? null : slot)}
                    className={`w-full text-left px-3 py-2 rounded-md border text-sm transition-colors ${
                      isSelected
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                        : "border-transparent hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Part {slot.part}</span>
                        <span className="text-muted-foreground">Room {slot.roomNumber}</span>
                        {isTraining && (
                          <Badge variant="secondary" className="text-[10px] px-1 py-0 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                            Training
                          </Badge>
                        )}
                      </div>
                      {isOccupied && (
                        <Badge variant="outline" className="text-[10px]">
                          {slot.justice}
                        </Badge>
                      )}
                    </div>
                    {isOccupied && isSelected && (
                      <p className="text-xs text-amber-600 mt-1">
                        ↔ Will swap: {slot.justice} moves to Part {sourceSlot?.part || "—"}
                      </p>
                    )}
                  </button>
                );
              })}
              {filtered.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No matching parts found</p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} size="sm">
            Cancel
          </Button>
          <Button
            onClick={() => moveMutation.mutate()}
            disabled={!selectedSlot || moveMutation.isPending}
            size="sm"
          >
            {moveMutation.isPending ? "Moving..." : selectedSlot?.justice ? "Swap Judges" : "Move Judge"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Edit Judge Details dialog — update court attorney and chambers room.
 */
function EditJudgeDetailsDialog({
  open,
  onOpenChange,
  judgeId,
  judgeName,
  currentCourtAttorney,
  currentChambersRoom,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  judgeId: string;
  judgeName: string;
  currentCourtAttorney: string;
  currentChambersRoom: string;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [courtAttorney, setCourtAttorney] = useState(currentCourtAttorney);
  const [chambersRoom, setChambersRoom] = useState(currentChambersRoom);

  // Reset when dialog opens with fresh data
  const prevOpen = useState(false);
  if (open && !prevOpen[0]) {
    if (courtAttorney !== currentCourtAttorney) setCourtAttorney(currentCourtAttorney);
    if (chambersRoom !== currentChambersRoom) setChambersRoom(currentChambersRoom);
  }
  prevOpen[0] = open;

  const saveMutation = useMutation({
    mutationFn: async () => {
      await updateJudgeDetails({
        personnelId: judgeId,
        courtAttorney: courtAttorney.trim() || null,
        chambersRoom: chambersRoom.trim() || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["court-personnel"] });
      toast({ title: "Details updated", description: `${judgeName}'s details have been saved.` });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5" />
            {judgeName} — Details
          </DialogTitle>
          <DialogDescription>
            Update court attorney and chambers info.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="space-y-1">
            <Label htmlFor="edit-attorney" className="text-xs font-medium">Court Attorney</Label>
            <Input
              id="edit-attorney"
              value={courtAttorney}
              onChange={(e) => setCourtAttorney(e.target.value)}
              placeholder="Attorney name"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  document.getElementById("edit-chambers")?.focus();
                }
              }}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="edit-chambers" className="text-xs font-medium">Chambers Room</Label>
            <Input
              id="edit-chambers"
              value={chambersRoom}
              onChange={(e) => setChambersRoom(e.target.value)}
              placeholder="e.g. 1240"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  saveMutation.mutate();
                }
              }}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} size="sm">
            Cancel
          </Button>
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} size="sm">
            {saveMutation.isPending ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Switch Chambers dialog — swap chambers with another judge.
 */
function SwitchChambersDialog({
  open,
  onOpenChange,
  judgeId,
  judgeName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  judgeId: string;
  judgeName: string;
}) {
  const { personnel } = useCourtPersonnel();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [otherJudgeId, setOtherJudgeId] = useState("");

  const otherJudges = personnel.judges.filter((j) => j.id !== judgeId);
  const currentJudge = personnel.judges.find((j) => j.id === judgeId);
  const selectedOther = otherJudges.find((j) => j.id === otherJudgeId);

  const swapMutation = useMutation({
    mutationFn: async () => {
      if (!otherJudgeId) throw new Error("Select a judge to swap with");
      await swapChambers(judgeId, otherJudgeId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["court-personnel"] });
      toast({
        title: "Chambers swapped",
        description: `${judgeName} and ${selectedOther?.name || "other judge"} have swapped chambers.`,
      });
      setOtherJudgeId("");
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Home className="h-5 w-5 text-purple-600" />
            Switch Chambers
          </DialogTitle>
          <DialogDescription>
            Swap chambers between {judgeName}
            {currentJudge?.chambersRoom ? ` (Room ${currentJudge.chambersRoom})` : " (no chambers)"} and another judge.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="space-y-1">
            <Label className="text-xs font-medium">Swap with</Label>
            <select
              value={otherJudgeId}
              onChange={(e) => setOtherJudgeId(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">Select a judge...</option>
              {otherJudges.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.name}{j.chambersRoom ? ` (Room ${j.chambersRoom})` : " (no chambers)"}
                </option>
              ))}
            </select>
          </div>

          {otherJudgeId && (
            <div className="rounded-md border p-2.5 bg-muted/50 text-sm space-y-1">
              <p className="text-xs text-muted-foreground">After swap:</p>
              <p>{judgeName} → Room {selectedOther?.chambersRoom || "none"}</p>
              <p>{selectedOther?.name} → Room {currentJudge?.chambersRoom || "none"}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} size="sm">
            Cancel
          </Button>
          <Button
            onClick={() => swapMutation.mutate()}
            disabled={!otherJudgeId || swapMutation.isPending}
            size="sm"
          >
            {swapMutation.isPending ? "Swapping..." : "Swap Chambers"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Quick dialog for adding a new judge with everything that comes with them:
 * court attorney, chambers room, courtroom, and part number.
 */
export function AddJudgeDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [status, setStatus] = useState<JudgeStatus>("active");
  const [courtAttorney, setCourtAttorney] = useState("");
  const [chambersRoom, setChambersRoom] = useState("");
  const [courtroomId, setCourtroomId] = useState("");
  const [part, setPart] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch available courtrooms for the dropdown
  const { data: courtrooms = [] } = useQuery({
    queryKey: ["courtrooms-for-judge-add"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("court_rooms")
        .select("id, room_number, courtroom_number")
        .eq("is_active", true)
        .order("room_number");
      if (error) throw error;
      return (data || []) as Array<{ id: string; room_number: string; courtroom_number: string | null }>;
    },
    enabled: open,
  });

  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setStatus("active");
    setCourtAttorney("");
    setChambersRoom("");
    setCourtroomId("");
    setPart("");
  };

  const addMutation = useMutation({
    mutationFn: async () => {
      if (!firstName.trim() || !lastName.trim()) {
        throw new Error("First and last name are required");
      }
      return addNewJudge({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        status,
        courtAttorney: courtAttorney.trim() || undefined,
        chambersRoom: chambersRoom.trim() || undefined,
        courtroomId: courtroomId || undefined,
        part: part.trim() || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["court-personnel"] });
      queryClient.invalidateQueries({ queryKey: ["court-assignments-enhanced"] });
      queryClient.invalidateQueries({ queryKey: ["assignment-stats"] });
      queryClient.invalidateQueries({ queryKey: ["term-sheet-board"] });
      toast({
        title: "Judge added",
        description: `${firstName.charAt(0).toUpperCase()}. ${lastName.toUpperCase()} has been added${part ? ` and assigned to Part ${part}` : ""}.`,
      });
      resetForm();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Add New Judge
          </DialogTitle>
          <DialogDescription>
            Enter the judge's info. Court attorney, chambers, and courtroom are optional but recommended.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {/* Name row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="first-name" className="text-xs font-medium">
                First Name *
              </Label>
              <Input
                id="first-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="e.g. Juan"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    document.getElementById("last-name")?.focus();
                  }
                }}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="last-name" className="text-xs font-medium">
                Last Name *
              </Label>
              <Input
                id="last-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="e.g. MERCHAN"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    document.getElementById("court-attorney")?.focus();
                  }
                }}
              />
            </div>
          </div>

          {/* Type toggle */}
          <div className="space-y-1">
            <Label className="text-xs font-medium">Type</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={status === "active" ? "default" : "outline"}
                size="sm"
                className="flex-1"
                onClick={() => setStatus("active")}
              >
                <Gavel className="h-3.5 w-3.5 mr-1.5" />
                Justice
              </Button>
              <Button
                type="button"
                variant={status === "jho" ? "default" : "outline"}
                size="sm"
                className="flex-1"
                onClick={() => setStatus("jho")}
              >
                <Crown className="h-3.5 w-3.5 mr-1.5" />
                JHO
              </Button>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t pt-3">
            <p className="text-xs text-muted-foreground mb-2">Comes with the judge:</p>
          </div>

          {/* Court Attorney */}
          <div className="space-y-1">
            <Label htmlFor="court-attorney" className="text-xs font-medium">
              Court Attorney
            </Label>
            <Input
              id="court-attorney"
              value={courtAttorney}
              onChange={(e) => setCourtAttorney(e.target.value)}
              placeholder="Attorney name"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  document.getElementById("chambers-room")?.focus();
                }
              }}
            />
          </div>

          {/* Chambers + Part row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="chambers-room" className="text-xs font-medium">
                Chambers Room
              </Label>
              <Input
                id="chambers-room"
                value={chambersRoom}
                onChange={(e) => setChambersRoom(e.target.value)}
                placeholder="e.g. 1240"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    document.getElementById("part-number")?.focus();
                  }
                }}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="part-number" className="text-xs font-medium">
                Part Number
              </Label>
              <Input
                id="part-number"
                value={part}
                onChange={(e) => setPart(e.target.value)}
                placeholder="e.g. 62"
              />
            </div>
          </div>

          {/* Courtroom select */}
          <div className="space-y-1">
            <Label className="text-xs font-medium">Courtroom</Label>
            <select
              value={courtroomId}
              onChange={(e) => setCourtroomId(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">Select courtroom (optional)</option>
              {courtrooms.map((cr) => (
                <option key={cr.id} value={cr.id}>
                  Room {cr.room_number}
                  {cr.courtroom_number ? ` (Court ${cr.courtroom_number})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Preview */}
          {(firstName || lastName) && (
            <div className="rounded-md border p-2.5 bg-muted/50 space-y-1">
              <p className="text-xs text-muted-foreground">Will create:</p>
              <p className="text-sm font-medium flex items-center gap-2">
                {firstName ? firstName.charAt(0).toUpperCase() + "." : "?"}{" "}
                {lastName ? lastName.toUpperCase() : "..."}
                {status === "jho" && (
                  <Badge
                    variant="secondary"
                    className="text-[10px] px-1 py-0 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                  >
                    JHO
                  </Badge>
                )}
              </p>
              <div className="text-xs text-muted-foreground space-y-0.5">
                {courtAttorney && <p>Court Attorney: {courtAttorney}</p>}
                {chambersRoom && <p>Chambers: Room {chambersRoom}</p>}
                {part && <p>Part: {part}</p>}
                {courtroomId && (
                  <p>
                    Courtroom: Room{" "}
                    {courtrooms.find((c) => c.id === courtroomId)?.room_number || "—"}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            size="sm"
          >
            Cancel
          </Button>
          <Button
            onClick={() => addMutation.mutate()}
            disabled={
              !firstName.trim() || !lastName.trim() || addMutation.isPending
            }
            size="sm"
          >
            {addMutation.isPending ? "Adding..." : "Add Judge"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
