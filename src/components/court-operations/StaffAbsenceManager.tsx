import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Calendar, UserX, UserCheck, AlertCircle, Plus, Loader2, List } from "lucide-react";
import { format } from "date-fns";
import { AbsenceCalendar } from "./AbsenceCalendar";

interface StaffAbsence {
  id: string;
  staff_id: string;
  absence_reason: string | null;
  kind: string;
  starts_on: string;
  ends_on: string;
  notes: string | null;
  coverage_assigned: boolean | null;
  covering_staff_id: string | null;
  affected_room_id: string | null;
  notification_sent: boolean | null;
  created_at: string;
  staff?: {
    display_name: string;
    role: string;
  };
  covering_staff?: {
    display_name: string;
  };
}

export function StaffAbsenceManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showCoverageDialog, setShowCoverageDialog] = useState(false);
  const [selectedAbsence, setSelectedAbsence] = useState<StaffAbsence | null>(null);

  // Fetch all staff absences
  const { data: absences, isLoading } = useQuery({
    queryKey: ["staff-absences"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff_absences")
        .select(`
          *,
          staff:staff_id (
            display_name,
            role
          ),
          covering_staff:covering_staff_id (
            display_name
          )
        `)
        .order("starts_on", { ascending: false });

      if (error) throw error;
      return data as StaffAbsence[];
    },
  });

  // Fetch available staff for coverage
  const { data: availableStaff } = useQuery({
    queryKey: ["available-staff"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff")
        .select("id, display_name, role")
        .order("display_name");

      if (error) throw error;
      return data;
    },
  });

  // Get active absences (ongoing or upcoming)
  const activeAbsences = absences?.filter(a => {
    const endDate = new Date(a.ends_on);
    return endDate >= new Date();
  }) || [];

  const getStaffName = (staff: any) => {
    if (!staff) return "Unknown";
    return staff.display_name || "Unknown";
  };

  const getReasonBadge = (reason: string | null) => {
    if (!reason) return <Badge variant="secondary">N/A</Badge>;
    const variants: Record<string, any> = {
      sick: "destructive",
      emergency: "destructive",
      vacation: "default",
      personal: "secondary",
      training: "outline",
      other: "secondary",
    };
    return <Badge variant={variants[reason] || "secondary"}>{reason}</Badge>;
  };

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <UserX className="h-4 w-4 text-red-500" />
              Active Absences
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeAbsences.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Currently out or upcoming
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              Needs Coverage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeAbsences.filter(a => !a.coverage_assigned).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              No coverage assigned
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-green-500" />
              Coverage Assigned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeAbsences.filter(a => a.coverage_assigned).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Coverage in place
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for List and Calendar Views */}
      <Tabs defaultValue="list" className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="list" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              List View
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Calendar View
            </TabsTrigger>
          </TabsList>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Record Absence
          </Button>
        </div>

        <TabsContent value="list">
          <Card>
            <CardHeader>
              <CardTitle>Staff Absences</CardTitle>
              <CardDescription>Manage staff absences and coverage assignments</CardDescription>
            </CardHeader>
            <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : absences && absences.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff Member</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead>Coverage</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {absences.map((absence) => {
                    const isActive = new Date(absence.ends_on) >= new Date();
                    return (
                      <TableRow key={absence.id} className={!isActive ? "opacity-50" : ""}>
                        <TableCell className="font-medium">
                          {getStaffName(absence.staff)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{absence.staff?.role || "N/A"}</Badge>
                        </TableCell>
                        <TableCell>{getReasonBadge(absence.absence_reason || absence.kind)}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{format(new Date(absence.starts_on), "MMM dd, yyyy")}</div>
                            <div className="text-muted-foreground">
                              to {format(new Date(absence.ends_on), "MMM dd, yyyy")}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {absence.coverage_assigned ? (
                            <div className="flex items-center gap-2">
                              <UserCheck className="h-4 w-4 text-green-500" />
                              <span className="text-sm">
                                {getStaffName(absence.covering_staff)}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <AlertCircle className="h-4 w-4 text-amber-500" />
                              <span className="text-sm text-muted-foreground">Not assigned</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {!absence.coverage_assigned && isActive && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedAbsence(absence);
                                setShowCoverageDialog(true);
                              }}
                            >
                              Assign Coverage
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No staff absences recorded
            </div>
          )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendar">
          <AbsenceCalendar />
        </TabsContent>
      </Tabs>

      {/* Add Absence Dialog */}
      <AddAbsenceDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        availableStaff={availableStaff || []}
      />

      {/* Assign Coverage Dialog */}
      <AssignCoverageDialog
        open={showCoverageDialog}
        onOpenChange={setShowCoverageDialog}
        absence={selectedAbsence}
        availableStaff={availableStaff || []}
      />
    </div>
  );
}

// Add Absence Dialog Component
function AddAbsenceDialog({ open, onOpenChange, availableStaff }: any) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    staff_id: "",
    role: "",
    absence_reason: "",
    start_date: "",
    end_date: "",
    notes: "",
    affected_room_id: "",
  });

  const recordAbsenceMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.rpc("record_staff_absence", {
        p_staff_id: data.staff_id,
        p_role: data.role,
        p_absence_reason: data.absence_reason,
        p_start_date: data.start_date,
        p_end_date: data.end_date,
        p_notes: data.notes || null,
        p_affected_room_id: data.affected_room_id || null,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-absences"] });
      toast({
        title: "✅ Absence recorded",
        description: "Staff absence has been recorded and notifications sent.",
      });
      onOpenChange(false);
      setFormData({
        staff_id: "",
        role: "",
        absence_reason: "",
        start_date: "",
        end_date: "",
        notes: "",
        affected_room_id: "",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to record absence",
        description: error.message,
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Record Staff Absence</DialogTitle>
          <DialogDescription>
            Record a staff member&apos;s absence and send notifications to administrators
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Staff Member</Label>
            <Select
              value={formData.staff_id}
              onValueChange={(value) => {
                const staff = availableStaff.find((s: any) => s.id === value);
                setFormData({ ...formData, staff_id: value, role: staff?.role || "" });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select staff member" />
              </SelectTrigger>
              <SelectContent>
                {availableStaff.map((staff: any) => (
                  <SelectItem key={staff.id} value={staff.id}>
                    {staff.display_name} ({staff.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Absence Reason</Label>
            <Select
              value={formData.absence_reason}
              onValueChange={(value) => setFormData({ ...formData, absence_reason: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sick">Sick Leave</SelectItem>
                <SelectItem value="vacation">Vacation</SelectItem>
                <SelectItem value="emergency">Emergency</SelectItem>
                <SelectItem value="personal">Personal</SelectItem>
                <SelectItem value="training">Training</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Start Date</Label>
              <Input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>
            <div>
              <Label>End Date</Label>
              <Input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label>Notes (Optional)</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional details..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => recordAbsenceMutation.mutate(formData)}
            disabled={
              !formData.staff_id ||
              !formData.absence_reason ||
              !formData.start_date ||
              !formData.end_date ||
              recordAbsenceMutation.isPending
            }
          >
            {recordAbsenceMutation.isPending && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            Record Absence
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Assign Coverage Dialog Component
function AssignCoverageDialog({ open, onOpenChange, absence, availableStaff }: any) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [coveringStaffId, setCoveringStaffId] = useState("");

  const assignCoverageMutation = useMutation({
    mutationFn: async () => {
      if (!absence || !coveringStaffId) return;

      const { error } = await supabase.rpc("assign_absence_coverage", {
        p_absence_id: absence.id,
        p_covering_staff_id: coveringStaffId,
        p_actor_id: user?.id,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-absences"] });
      toast({
        title: "✅ Coverage assigned",
        description: "Coverage staff has been assigned and notified.",
      });
      onOpenChange(false);
      setCoveringStaffId("");
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to assign coverage",
        description: error.message,
      });
    },
  });

  if (!absence) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Coverage</DialogTitle>
          <DialogDescription>
            Assign a staff member to cover for {absence.staff?.display_name || "Unknown"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-3 bg-muted rounded-lg text-sm">
            <div className="font-medium mb-1">Absence Details</div>
            <div className="text-muted-foreground">
              <div>Reason: {absence.absence_reason || absence.kind}</div>
              <div>
                Dates: {format(new Date(absence.starts_on), "MMM dd")} -{" "}
                {format(new Date(absence.ends_on), "MMM dd, yyyy")}
              </div>
              {absence.notes && <div className="mt-1">Notes: {absence.notes}</div>}
            </div>
          </div>

          <div>
            <Label>Covering Staff Member</Label>
            <Select value={coveringStaffId} onValueChange={setCoveringStaffId}>
              <SelectTrigger>
                <SelectValue placeholder="Select staff member" />
              </SelectTrigger>
              <SelectContent>
                {availableStaff
                  .filter((s: any) => s.id !== absence.staff_id)
                  .map((staff: any) => (
                    <SelectItem key={staff.id} value={staff.id}>
                      {staff.display_name} ({staff.role})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => assignCoverageMutation.mutate()}
            disabled={!coveringStaffId || assignCoverageMutation.isPending}
          >
            {assignCoverageMutation.isPending && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            Assign Coverage
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
