// @ts-nocheck
import { useState } from "react";
import { getErrorMessage } from "@/lib/errorUtils";
import { logger } from '@/lib/logger';
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useKeyAssignments } from "../hooks/useKeyAssignments";
import { KeyAssignmentTable } from "../components/KeyAssignmentTable";
import { KeyAssignment } from "../types/assignmentTypes";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { EditElevatorPassDialog } from "../dialogs/EditElevatorPassDialog";

export function KeyAssignmentSection() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<KeyAssignment | null>(null);
  const { data: assignments, isLoading, refetch } = useKeyAssignments();

  const getOccupantFullName = (occupant: KeyAssignment['occupant']) => {
    if (!occupant) return 'Unknown';
    return `${occupant.first_name} ${occupant.last_name}`;
  };

  const handleEdit = (assignment: KeyAssignment) => {
    setSelectedAssignment(assignment);
    setEditDialogOpen(true);
  };

  const handleReturn = async (assignmentId: string, keyId: string) => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      const { data: key, error: keyError } = await supabase
        .from("keys")
        .select("available_quantity")
        .eq("id", keyId)
        .single();

      if (keyError) throw keyError;

      const updates = await Promise.all([
        supabase
          .from("key_assignments")
          .update({
            returned_at: new Date().toISOString(),
            return_reason: "normal_return"
          })
          .eq("id", assignmentId),

        supabase
          .from("keys")
          .update({
            available_quantity: (key.available_quantity || 0) + 1
          })
          .eq("id", keyId)
      ]);

      const errors = updates.map(update => update.error).filter(Boolean);
      if (errors.length > 0) {
        throw new Error(errors[0]?.message);
      }

      toast.success(`Key returned successfully by ${getOccupantFullName(assignments?.find(a => a.id === assignmentId)?.occupant)}`);
      refetch();
    } catch (error) {
      logger.error("Error returning key:", error);
      toast.error(getErrorMessage(error) || "Failed to return key");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Active Assignments</h2>
          <p className="text-muted-foreground">Currently assigned keys and their holders</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const rows = (assignments || []).map((a) => ({
              assignment_id: a.id,
              key_name: a.keys?.name || "",
              key_type: a.keys?.type || "",
              is_passkey: a.keys?.is_passkey ? "yes" : "no",
              occupant: a.occupant ? `${a.occupant.first_name} ${a.occupant.last_name}` : "",
              department: a.occupant?.department || "",
              assigned_at: a.assigned_at,
              is_spare: a.is_spare ? "yes" : "no",
              spare_reason: a.spare_key_reason || "",
            }));
            const headers = Object.keys(rows[0] || { assignment_id: "", key_name: "", key_type: "", is_passkey: "", occupant: "", department: "", assigned_at: "", is_spare: "", spare_reason: "" });
            const csv = [
              headers.join(","),
              ...rows.map(r => headers.map(h => {
                const val = String(((r as Record<string, unknown>))[h] ?? "");
                const escaped = val.replace(/"/g, '""');
                return `"${escaped}"`;
              }).join(","))
            ].join("\n");
            const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `active_key_assignments_${new Date().toISOString()}.csv`;
            a.click();
            URL.revokeObjectURL(url);
          }}
        >
          <Download className="h-4 w-4 mr-2" /> Export CSV
        </Button>
      </div>

      <KeyAssignmentTable
        assignments={assignments}
        isProcessing={isProcessing}
        onReturnKey={handleReturn}
        onEditAssignment={handleEdit}
      />

      <EditElevatorPassDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        assignment={selectedAssignment}
        onUpdated={() => {
          refetch();
          setEditDialogOpen(false);
          setSelectedAssignment(null);
        }}
      />
    </div>
  );
}
