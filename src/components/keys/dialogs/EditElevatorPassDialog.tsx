import { useEffect, useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { ModalFrame } from "@/components/common/ModalFrame";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { KeyAssignment } from "../types/assignmentTypes";

interface EditElevatorPassDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignment: KeyAssignment | null;
  onUpdated?: () => void;
}

type RecipientType = "occupant" | "security" | "office";

export function EditElevatorPassDialog({ open, onOpenChange, assignment, onUpdated }: EditElevatorPassDialogProps) {
  const [recipientType, setRecipientType] = useState<RecipientType>("occupant");
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientDepartment, setRecipientDepartment] = useState("");
  const [expectedReturnAt, setExpectedReturnAt] = useState<string>("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!assignment) return;
    
    // Determine recipient type and populate fields
    if (assignment.occupant) {
      setRecipientType("occupant");
      setRecipientName(`${assignment.occupant.first_name} ${assignment.occupant.last_name}`);
      setRecipientEmail(assignment.occupant.email || "");
      setRecipientDepartment(assignment.occupant.department || "");
    } else {
      // Non-occupant assignment - check if it's security or office
      const name = assignment.recipient_name || "";
      if (name.toLowerCase().includes("security")) {
        setRecipientType("security");
        setRecipientDepartment("Security");
      } else {
        setRecipientType("office");
        setRecipientDepartment("External");
      }
      setRecipientName(name);
      setRecipientEmail(assignment.recipient_email || "");
    }
    
    setReason(assignment.spare_key_reason || "");
    setNotes(""); // Notes are for updates, not existing data
    setExpectedReturnAt(""); // Can be updated
  }, [assignment]);

  const handleSubmit = async () => {
    if (!assignment) return;
    
    setLoading(true);
    try {
      // Update key assignment with new information
      const { error } = await supabase
        .from("key_assignments")
        .update({
          recipient_name: recipientType === "occupant" ? null : recipientName,
          recipient_email: recipientType === "occupant" ? null : (recipientEmail || null),
          spare_key_reason: reason || null,
          // Add notes to existing audit trail
          updated_at: new Date().toISOString()
        })
        .eq("id", assignment.id);

      if (error) {
        toast.error("Failed to update assignment: " + error.message);
        return;
      }

      // Log the update in audit trail
      if (notes.trim()) {
        const { data: userData } = await supabase.auth.getUser();
        const updatedBy = userData?.user?.email || "admin";
        
        await supabase
          .from("key_audit_logs")
          .insert({
            key_id: assignment.keys?.id,
            assignment_id: assignment.id,
            action_type: "updated",
            details: {
              notes: notes,
              updated_by: updatedBy,
              updated_at: new Date().toISOString(),
              changes: {
                recipient_type: recipientType,
                recipient_name: recipientType === "occupant" ? null : recipientName,
                recipient_email: recipientType === "occupant" ? null : recipientEmail,
                reason: reason
              }
            }
          });
      }

      toast.success("Assignment updated successfully");
      onUpdated?.();
      onOpenChange(false);
    } catch (e: any) {
      console.error(e);
      toast.error("Failed to update assignment");
    } finally {
      setLoading(false);
    }
  };

  if (!assignment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <ModalFrame title="Edit Elevator Pass Assignment" description="Update assignment details and add notes" size="md">
        <div className="space-y-4">
          {/* Read-only assignment info */}
          <div className="bg-muted/50 p-3 rounded-lg">
            <div className="text-sm space-y-1">
              <div><strong>Key:</strong> {assignment.keys?.name}</div>
              <div><strong>Assigned:</strong> {new Date(assignment.assigned_at).toLocaleDateString()}</div>
              {assignment.occupant?.department && (
                <div><strong>Department:</strong> {assignment.occupant.department}</div>
              )}
            </div>
          </div>

          <div>
            <Label>Recipient Type</Label>
            <Select value={recipientType} onValueChange={(v) => setRecipientType(v as RecipientType)}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="occupant">Occupant</SelectItem>
                <SelectItem value="security">Security</SelectItem>
                <SelectItem value="office">Office/External</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {recipientType !== "occupant" && (
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Recipient Name</Label>
                  <Input
                    placeholder="e.g., District Attorney Office"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Email (optional)</Label>
                  <Input 
                    type="email" 
                    value={recipientEmail} 
                    onChange={(e) => setRecipientEmail(e.target.value)} 
                  />
                </div>
              </div>
              <div>
                <Label>Department</Label>
                <Input
                  placeholder="e.g., District Attorney, Security, Maintenance"
                  value={recipientDepartment}
                  onChange={(e) => setRecipientDepartment(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Expected Return (optional)</Label>
              <Input 
                type="datetime-local" 
                value={expectedReturnAt} 
                onChange={(e) => setExpectedReturnAt(e.target.value)} 
              />
            </div>
            <div>
              <Label>Reason</Label>
              <Input 
                value={reason} 
                onChange={(e) => setReason(e.target.value)} 
                placeholder="e.g., temporary access" 
              />
            </div>
          </div>

          <div>
            <Label>Update Notes</Label>
            <Textarea 
              value={notes} 
              onChange={(e) => setNotes(e.target.value)} 
              placeholder="Record any changes or updates made to this assignment..." 
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? 'Updating...' : 'Update Assignment'}
            </Button>
          </div>
        </div>
      </ModalFrame>
    </Dialog>
  );
}