
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useKeyAssignments } from "../hooks/useKeyAssignments";
import { KeyAssignmentTable } from "../components/KeyAssignmentTable";
import { KeyAssignment } from "../types/assignmentTypes";

export function KeyAssignmentSection() {
  const [isProcessing, setIsProcessing] = useState(false);
  const { data: assignments, isLoading, refetch } = useKeyAssignments();

  const getOccupantFullName = (occupant: KeyAssignment['occupant']) => {
    if (!occupant) return 'Unknown';
    return `${occupant.first_name} ${occupant.last_name}`;
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
    } catch (error: any) {
      console.error("Error returning key:", error);
      toast.error(error.message || "Failed to return key");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">Active Assignments</h2>
        <p className="text-muted-foreground">Currently assigned keys and their holders</p>
      </div>

      <KeyAssignmentTable
        assignments={assignments}
        isProcessing={isProcessing}
        onReturnKey={handleReturn}
        getOccupantFullName={getOccupantFullName}
      />
    </div>
  );
}
