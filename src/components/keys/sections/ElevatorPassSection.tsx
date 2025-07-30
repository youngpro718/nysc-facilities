import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { format } from "date-fns";
import { RotateCcw, Users } from "lucide-react";

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
}

export function ElevatorPassSection() {
  const [selectedAssignments, setSelectedAssignments] = useState<string[]>([]);
  const [processingBulk, setProcessingBulk] = useState(false);
  const queryClient = useQueryClient();

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
    mutationFn: async (assignmentIds: string[]) => {
      const { data, error } = await supabase
        .rpc("bulk_update_assignment_status", {
          assignment_ids: assignmentIds,
          new_status: "returned",
          return_reason: "Bulk return",
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
    returnAssignmentMutation.mutate({ assignmentId });
  };

  const handleBulkReturn = async () => {
    if (selectedAssignments.length === 0) return;
    
    setProcessingBulk(true);
    try {
      await bulkReturnMutation.mutateAsync(selectedAssignments);
    } finally {
      setProcessingBulk(false);
    }
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
        </div>
        
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

      {assignments && assignments.length > 0 ? (
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
                <TableHead>Occupant</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Pass Name</TableHead>
                <TableHead>Assigned Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.map((assignment) => (
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
                    <div>
                      <div className="font-medium">
                        {assignment.first_name} {assignment.last_name}
                      </div>
                      {assignment.email && (
                        <div className="text-sm text-muted-foreground">
                          {assignment.email}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {assignment.department || "—"}
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
                      Return
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
          <p>No active elevator pass assignments</p>
        </div>
      )}
    </div>
  );
}