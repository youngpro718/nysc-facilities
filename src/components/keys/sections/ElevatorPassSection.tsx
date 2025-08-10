import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { format } from "date-fns";
import { RotateCcw, Users, Download } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { ModalFrame } from "@/components/common/ModalFrame";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { IssueElevatorPassDialog } from "@/components/keys/dialogs/IssueElevatorPassDialog";
import AllocateElevatorCardsToOfficeDialog from "@/components/keys/dialogs/AllocateElevatorCardsToOfficeDialog";

interface ElevatorPassAssignment {
  assignment_id: string;
  key_id: string;
  occupant_id: string;
  assigned_at: string;
  returned_at: string | null;
  status: string;
  return_reason: string | null;
  is_spare: boolean;
  spare_key_reason: string | null;
  key_name: string;
  first_name: string;
  last_name: string;
  department: string | null;
  email: string | null;
  is_overdue: boolean;
  days_since_assigned: number;
  // new recipient fields for non-occupants
  recipient_type?: string | null;
  recipient_name?: string | null;
  recipient_email?: string | null;
}

export function ElevatorPassSection() {
  const [selectedAssignments, setSelectedAssignments] = useState<string[]>([]);
  const [processingBulk, setProcessingBulk] = useState(false);
  const [reasonOpen, setReasonOpen] = useState(false);
  const [bulkReasonOpen, setBulkReasonOpen] = useState(false);
  const [singleReason, setSingleReason] = useState<string>("normal_return");
  const [singleNotes, setSingleNotes] = useState<string>("");
  const [bulkReasonStr, setBulkReasonStr] = useState<string>("Bulk return");
  const [bulkNotes, setBulkNotes] = useState<string>("");
  const [currentAssignmentId, setCurrentAssignmentId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState<string>("all");
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [issueOpen, setIssueOpen] = useState(false);
  const [allocateOpen, setAllocateOpen] = useState(false);
  const queryClient = useQueryClient();

  // Captain's Office holdings and allocation history
  const officeName = "Captain's Office";
  const { data: elevatorCardKey } = useQuery({
    queryKey: ["elevator-card-key"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("keys")
        .select("id")
        .eq("is_elevator_card", true)
        .limit(1)
        .single();
      if (error) throw error;
      return data as { id: string } | null;
    },
  });

  const { data: officeHoldings } = useQuery({
    queryKey: ["office-card-holdings", officeName, elevatorCardKey?.id],
    queryFn: async () => {
      if (!elevatorCardKey?.id) return null;
      const { data, error } = await supabase
        .from("v_office_elevator_card_holdings")
        .select("quantity_held")
        .eq("office_name", officeName)
        .eq("key_id", elevatorCardKey.id)
        .maybeSingle();
      if (error) throw error;
      return data as { quantity_held: number } | null;
    },
    enabled: !!elevatorCardKey?.id,
  });

  const { data: officeAllocations } = useQuery({
    queryKey: ["office-card-allocations", officeName, elevatorCardKey?.id],
    queryFn: async () => {
      if (!elevatorCardKey?.id) return [] as any[];
      const { data, error } = await supabase
        .from("office_elevator_card_allocations")
        .select("allocated_at, quantity_delta, notes")
        .eq("office_name", officeName)
        .eq("key_id", elevatorCardKey.id)
        .order("allocated_at", { ascending: false })
        .limit(25);
      if (error) throw error;
      return data as { allocated_at: string; quantity_delta: number; notes: string | null }[];
    },
    enabled: !!elevatorCardKey?.id,
  });

  const { data: assignments, isLoading } = useQuery({
    queryKey: ["elevator-pass-assignments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("elevator_pass_assignments")
        .select("*")
        .is("returned_at", null)
        .order("assigned_at", { ascending: false });

      if (error) throw error;
      return data as ElevatorPassAssignment[];
    },
  });

  const returnAssignmentMutation = useMutation({
    mutationFn: async ({ assignmentId, reason }: { assignmentId: string; reason?: string }) => {
      const { error } = await supabase
        .from("key_assignments")
        .update({
          status: "returned",
          returned_at: new Date().toISOString(),
          return_reason: reason || "Manual return",
        })
        .eq("id", assignmentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["elevator-pass-assignments"] });
      toast.success("Elevator pass returned successfully");
    },
    onError: (error) => {
      console.error("Error returning elevator pass:", error);
      toast.error("Failed to return elevator pass");
    },
  });

  const bulkReturnMutation = useMutation({
    mutationFn: async ({ assignmentIds, reason }: { assignmentIds: string[]; reason?: string }) => {
      const { data, error } = await supabase
        .rpc("bulk_update_assignment_status", {
          assignment_ids: assignmentIds,
          new_status: "returned",
          return_reason: reason || "Bulk return",
        });

      if (error) throw error;
      return data;
    },
    onSuccess: (updatedCount) => {
      queryClient.invalidateQueries({ queryKey: ["elevator-pass-assignments"] });
      toast.success(`${updatedCount} elevator passes returned successfully`);
      setSelectedAssignments([]);
    },
    onError: (error) => {
      console.error("Error bulk returning elevator passes:", error);
      toast.error("Failed to return elevator passes");
    },
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedAssignments(assignments?.map(a => a.assignment_id) || []);
    } else {
      setSelectedAssignments([]);
    }
  };

  const handleSelectAssignment = (assignmentId: string, checked: boolean) => {
    if (checked) {
      setSelectedAssignments(prev => [...prev, assignmentId]);
    } else {
      setSelectedAssignments(prev => prev.filter(id => id !== assignmentId));
    }
  };

  const handleReturn = (assignmentId: string) => {
    setCurrentAssignmentId(assignmentId);
    setSingleReason("normal_return");
    setSingleNotes("");
    setReasonOpen(true);
  };

  const handleBulkReturn = async () => {
    if (selectedAssignments.length === 0) return;
    setBulkReasonOpen(true);
  };

  const getStatusBadge = (assignment: ElevatorPassAssignment) => {
    if (assignment.is_overdue) {
      return <Badge variant="destructive">Overdue ({assignment.days_since_assigned} days)</Badge>;
    }
    return <Badge variant="secondary">Active</Badge>;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-muted rounded"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>

      {/* Filters */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="col-span-1">
          <Label htmlFor="search">Search</Label>
          <Input
            id="search"
            placeholder="Search by occupant or pass name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="col-span-1">
          <Label>Department</Label>
          <Select value={department} onValueChange={setDepartment}>
            <SelectTrigger>
              <SelectValue placeholder="All departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {Array.from(new Set((assignments || []).map(a => a.department || "—"))).map((dept) => (
                <SelectItem key={dept} value={dept}>{dept}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-1 flex items-end gap-2">
          <div className="flex items-center gap-2">
            <Switch id="overdue-only" checked={overdueOnly} onCheckedChange={setOverdueOnly} />
            <Label htmlFor="overdue-only">Overdue only</Label>
          </div>
        </div>
      </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          <h3 className="font-semibold">Active Elevator Pass Assignments</h3>
          <Badge variant="outline">{assignments?.length || 0} active</Badge>
          {typeof officeHoldings?.quantity_held === 'number' && (
            <Badge variant="secondary">Captain's Office: {officeHoldings.quantity_held} held</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const rows = (assignments || []).map((a) => ({
                assignment_id: a.assignment_id,
                key_name: a.key_name,
                occupant: a.occupant_id ? `${a.first_name} ${a.last_name}`.trim() : "",
                department: a.occupant_id ? (a.department || "") : "",
                email: a.occupant_id ? (a.email || "") : (a.recipient_email || ""),
                recipient_type: a.occupant_id ? "occupant" : (a.recipient_type || ""),
                recipient_name: a.occupant_id ? "" : (a.recipient_name || ""),
                assigned_at: format(new Date(a.assigned_at), "yyyy-MM-dd HH:mm:ss"),
                status: a.status,
                is_spare: a.is_spare ? "yes" : "no",
                days_since_assigned: a.days_since_assigned,
                is_overdue: a.is_overdue ? "yes" : "no",
              }));
              const headers = Object.keys(rows[0] || { assignment_id: "", key_name: "", occupant: "", department: "", email: "", recipient_type: "", recipient_name: "", assigned_at: "", status: "", is_spare: "", days_since_assigned: "", is_overdue: "" });
              const csv = [
                headers.join(","),
                ...rows.map(r =>
                  headers
                    .map(h => {
                      const val = String((r as any)[h] ?? "");
                      const escaped = val.replace(/\"/g, '""');
                      return `"${escaped}"`;
                    })
                    .join(",")
                ),
              ].join("\n");
              const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `elevator_pass_assignments_${new Date().toISOString()}.csv`;
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            <Download className="h-4 w-4 mr-2" /> Export CSV
          </Button>
          <Button variant="outline" onClick={() => setAllocateOpen(true)}>Allocate to Captain's Office</Button>
          <Button onClick={() => setIssueOpen(true)}>Issue Elevator Pass</Button>
          {selectedAssignments.length > 0 && (
            <Button
              onClick={handleBulkReturn}
              disabled={processingBulk}
              variant="outline"
              size="sm"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Return Selected ({selectedAssignments.length})
            </Button>
          )}
        </div>
      </div>

      {(() => {
        const filtered = (assignments || []).filter((a) => {
          const nameStr = a.occupant_id ? `${a.first_name} ${a.last_name}` : (a.recipient_name || "");
          const emailStr = a.occupant_id ? (a.email || "") : (a.recipient_email || "");
          const matchesSearch = !search || nameStr.toLowerCase().includes(search.toLowerCase()) || a.key_name.toLowerCase().includes(search.toLowerCase()) || emailStr.toLowerCase().includes(search.toLowerCase());
          const matchesDept = a.occupant_id ? (department === "all" || (a.department || "—") === department) : (department === "all");
          const matchesOverdue = !overdueOnly || a.is_overdue;
          return matchesSearch && matchesDept && matchesOverdue;
        });
        return filtered.length > 0 ? (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedAssignments.length === assignments.length}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Recipient</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Pass Name</TableHead>
                <TableHead>Assigned Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((assignment) => (
                <TableRow key={assignment.assignment_id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedAssignments.includes(assignment.assignment_id)}
                      onCheckedChange={(checked) => 
                        handleSelectAssignment(assignment.assignment_id, checked as boolean)
                      }
                    />
                  </TableCell>
                  <TableCell>
                    {assignment.occupant_id ? (
                      <div>
                        <div className="font-medium">
                          {assignment.first_name} {assignment.last_name}
                        </div>
                        {assignment.email && (
                          <div className="text-sm text-muted-foreground">{assignment.email}</div>
                        )}
                      </div>
                    ) : (
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {assignment.recipient_name || "—"}
                          {assignment.recipient_type && (
                            <Badge variant="secondary" className="text-xs capitalize">{assignment.recipient_type}</Badge>
                          )}
                        </div>
                        {assignment.recipient_email && (
                          <div className="text-sm text-muted-foreground">{assignment.recipient_email}</div>
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {assignment.occupant_id ? (assignment.department || "—") : "—"}
                  </TableCell>
                  <TableCell>
                    <div>
                      {assignment.key_name}
                      {assignment.is_spare && (
                        <Badge variant="outline" className="ml-2">Spare</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {format(new Date(assignment.assigned_at), "MMM dd, yyyy")}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(assignment)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReturn(assignment.assignment_id)}
                      disabled={returnAssignmentMutation.isPending}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Return with reason
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No matching elevator pass assignments</p>
          </div>
        );
      })()}

      {/* Single Return Reason Dialog */}
      <Dialog open={reasonOpen} onOpenChange={setReasonOpen}>
        <ModalFrame
          title="Return Elevator Pass"
          description="Provide a reason and optional notes for returning this pass."
          size="sm"
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="single-reason">Reason</Label>
              <select
                id="single-reason"
                className="w-full border rounded-md p-2 bg-background"
                value={singleReason}
                onChange={(e) => setSingleReason(e.target.value)}
              >
                <option value="normal_return">Normal return</option>
                <option value="replacement">Replacement</option>
                <option value="status_change">Status change (promotion/resignation)</option>
                <option value="lost_found">Lost/Found</option>
                <option value="manual">Manual</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="single-notes">Notes (optional)</Label>
              <Textarea
                id="single-notes"
                placeholder="Add any additional context"
                value={singleNotes}
                onChange={(e) => setSingleNotes(e.target.value)}
                className="min-h-[80px]"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setReasonOpen(false)}>Cancel</Button>
              <Button
                onClick={() => {
                  if (!currentAssignmentId) return;
                  const combined = singleNotes ? `${singleReason}: ${singleNotes}` : singleReason;
                  returnAssignmentMutation.mutate(
                    { assignmentId: currentAssignmentId, reason: combined },
                    {
                      onSuccess: () => {
                        setReasonOpen(false);
                        setCurrentAssignmentId(null);
                        setSingleNotes("");
                      }
                    }
                  );
                }}
                disabled={returnAssignmentMutation.isPending}
              >
                Confirm Return
              </Button>
            </div>
          </div>
        </ModalFrame>
      </Dialog>

      {/* Bulk Return Reason Dialog */}
      <Dialog open={bulkReasonOpen} onOpenChange={setBulkReasonOpen}>
        <ModalFrame
          title={`Return ${selectedAssignments.length} Pass${selectedAssignments.length === 1 ? '' : 'es'}`}
          description="Provide a reason and optional notes for the bulk return."
          size="sm"
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bulk-reason">Reason</Label>
              <select
                id="bulk-reason"
                className="w-full border rounded-md p-2 bg-background"
                value={bulkReasonStr}
                onChange={(e) => setBulkReasonStr(e.target.value)}
              >
                <option value="Bulk return">Bulk return</option>
                <option value="status_change">Status change (promotion/resignation)</option>
                <option value="replacement">Replacement</option>
                <option value="lost_found">Lost/Found</option>
                <option value="manual">Manual</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bulk-notes">Notes (optional)</Label>
              <Textarea
                id="bulk-notes"
                placeholder="Add any additional context"
                value={bulkNotes}
                onChange={(e) => setBulkNotes(e.target.value)}
                className="min-h-[80px]"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setBulkReasonOpen(false)}>Cancel</Button>
              <Button
                onClick={async () => {
                  if (selectedAssignments.length === 0) return;
                  setProcessingBulk(true);
                  const combined = bulkNotes ? `${bulkReasonStr}: ${bulkNotes}` : bulkReasonStr;
                  try {
                    await bulkReturnMutation.mutateAsync({ assignmentIds: selectedAssignments, reason: combined });
                    setBulkReasonOpen(false);
                    setBulkNotes("");
                  } finally {
                    setProcessingBulk(false);
                  }
                }}
                disabled={processingBulk}
              >
                Confirm Bulk Return
              </Button>
            </div>
          </div>
        </ModalFrame>
      </Dialog>

      {/* Office Allocation History */}
      <div className="rounded-md border p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium">Captain's Office Allocation History</h4>
          <Button variant="outline" size="sm" onClick={() => setAllocateOpen(true)}>
            Allocate More
          </Button>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(officeAllocations || []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    No allocations recorded yet
                  </TableCell>
                </TableRow>
              ) : (
                (officeAllocations || []).map((a, idx) => (
                  <TableRow key={`${a.allocated_at}-${idx}`}>
                    <TableCell>{format(new Date(a.allocated_at), "yyyy-MM-dd HH:mm")}</TableCell>
                    <TableCell>{a.quantity_delta}</TableCell>
                    <TableCell className="max-w-[600px] truncate" title={a.notes || undefined}>{a.notes || ""}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Issue Elevator Pass */}
      <IssueElevatorPassDialog
        open={issueOpen}
        onOpenChange={setIssueOpen}
        onIssued={() => queryClient.invalidateQueries({ queryKey: ["elevator-pass-assignments"] })}
      />

      <AllocateElevatorCardsToOfficeDialog
        open={allocateOpen}
        onOpenChange={(o) => {
          setAllocateOpen(o);
          if (!o) {
            queryClient.invalidateQueries({ queryKey: ["elevator-pass-assignments"] });
            queryClient.invalidateQueries({ queryKey: ["elevator-card-key"] });
            queryClient.invalidateQueries({ queryKey: ["office-card-holdings"] });
          }
        }}
      />
    </div>
  );
}