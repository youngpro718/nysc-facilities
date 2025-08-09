import { useEffect, useMemo, useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { ModalFrame } from "@/components/common/ModalFrame";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface IssueElevatorPassDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onIssued?: () => void;
}

type RecipientType = "occupant" | "security" | "office";

type PassOption = {
  id: string;
  name: string;
  available_quantity: number | null;
};

type Occupant = {
  id: string;
  first_name: string;
  last_name: string;
  email?: string | null;
  department?: string | null;
};

export function IssueElevatorPassDialog({ open, onOpenChange, onIssued }: IssueElevatorPassDialogProps) {
  const [recipientType, setRecipientType] = useState<RecipientType>("occupant");
  const [occupantQuery, setOccupantQuery] = useState("");
  const [occupantId, setOccupantId] = useState<string | null>(null);
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [passId, setPassId] = useState<string>("");
  const [expectedReturnAt, setExpectedReturnAt] = useState<string>("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [passOptions, setPassOptions] = useState<PassOption[]>([]);
  const [occupantOptions, setOccupantOptions] = useState<Occupant[]>([]);

  useEffect(() => {
    if (!open) return;
    // Load available elevator cards and auto-select (no dropdown in UI)
    (async () => {
      const { data, error } = await supabase
        .from("keys")
        .select("id,name,available_quantity")
        .eq("is_elevator_card", true)
        .order("name");
      if (error) {
        console.error(error);
        toast.error("Failed to load elevator card pool");
        return;
      }
      const list = (data || []) as any as PassOption[];
      setPassOptions(list);
      if (!list.length) {
        toast.error("No elevator card pool is configured. Please add an elevator card in Keys.");
        setPassId("");
      } else {
        // Auto-pick first/only pool item
        setPassId(list[0].id);
      }
    })();
  }, [open]);

  useEffect(() => {
    if (!open || recipientType !== "occupant") return;
    const run = async () => {
      const q = occupantQuery.trim();
      if (!q) { setOccupantOptions([]); return; }
      const { data, error } = await supabase
        .from("occupants")
        .select("id,first_name,last_name,email,department")
        .or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,email.ilike.%${q}%`)
        .limit(10);
      if (error) {
        console.error(error);
        return;
      }
      setOccupantOptions((data || []) as any);
    };
    const t = setTimeout(run, 200);
    return () => clearTimeout(t);
  }, [open, recipientType, occupantQuery]);

  // Auto-fill name for security recipients
  useEffect(() => {
    if (recipientType === "security") {
      setRecipientName("Security");
    }
  }, [recipientType]);

  const canSubmit = useMemo(() => {
    if (!passId) return false; // auto-selected from pool
    if (recipientType === "occupant") return !!occupantId;
    return recipientName.trim().length > 0; // non-occupant requires name
  }, [passId, recipientType, occupantId, recipientName]);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const issuedBy = userData?.user?.email || "admin";
      // Narrow-cast supabase to any to bypass missing RPC typings
      const { error } = await (supabase as any).rpc("fn_issue_elevator_pass", {
        p_key_id: passId,
        p_recipient_type: recipientType,
        p_occupant_id: recipientType === "occupant" ? occupantId : null,
        p_recipient_name: recipientType === "occupant" ? null : recipientName,
        p_recipient_email: recipientType === "occupant" ? null : (recipientEmail || null),
        p_expected_return_at: expectedReturnAt ? new Date(expectedReturnAt).toISOString() : null,
        p_reason: reason || null,
        p_notes: notes ? `${notes} (issued_by: ${issuedBy})` : `(issued_by: ${issuedBy})`,
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Elevator pass issued");
      onIssued?.();
      onOpenChange(false);
      // reset
      setRecipientType("occupant");
      setOccupantQuery("");
      setOccupantId(null);
      setRecipientName("");
      setRecipientEmail("");
      setPassId("");
      setExpectedReturnAt("");
      setReason("");
      setNotes("");
    } catch (e: any) {
      console.error(e);
      toast.error("Failed to issue pass");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <ModalFrame title="Issue Elevator Pass" description="Record a new elevator pass issuance" size="md">
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Recipient Type</Label>
              <Select value={recipientType} onValueChange={(v) => setRecipientType(v as RecipientType)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="occupant">Occupant</SelectItem>
                  <SelectItem value="security">Security</SelectItem>
                  <SelectItem value="office">Office</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="pt-6 text-sm text-muted-foreground">
              {passOptions.length > 0 ? (
                <div>
                  Using elevator card pool: <span className="font-medium">{passOptions[0].name}</span>
                  {typeof passOptions[0].available_quantity === 'number' ? ` (avail: ${passOptions[0].available_quantity})` : ''}
                </div>
              ) : (
                <div>No elevator card pool configured</div>
              )}
            </div>
          </div>

          {recipientType === "occupant" ? (
            <div className="space-y-2">
              <Label>Occupant</Label>
              <Input
                placeholder="Search by name or email"
                value={occupantQuery}
                onChange={(e) => setOccupantQuery(e.target.value)}
              />
              {occupantOptions.length > 0 && (
                <div className="border rounded-md max-h-40 overflow-auto text-sm">
                  {occupantOptions.map(o => (
                    <div
                      key={o.id}
                      className={`px-3 py-2 cursor-pointer hover:bg-muted ${occupantId === o.id ? 'bg-muted' : ''}`}
                      onClick={() => { setOccupantId(o.id); setOccupantQuery(`${o.first_name} ${o.last_name} (${o.email || ''})`); }}
                    >
                      {o.first_name} {o.last_name} {o.email ? `• ${o.email}` : ''}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Recipient Name</Label>
                <Input
                  placeholder="e.g., Security or Office name"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  disabled={recipientType === "security"}
                />
              </div>
              <div>
                <Label>Email (optional)</Label>
                <Input type="email" value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)} />
              </div>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Expected Return (optional)</Label>
              <Input type="datetime-local" value={expectedReturnAt} onChange={(e) => setExpectedReturnAt(e.target.value)} />
            </div>
            <div>
              <Label>Reason (optional)</Label>
              <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g., temporary access" />
            </div>
          </div>

          <div>
            <Label>Notes (optional)</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any details to record" />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={!canSubmit || loading}>{loading ? 'Issuing…' : 'Issue Pass'}</Button>
          </div>
        </div>
      </ModalFrame>
    </Dialog>
  );
}
