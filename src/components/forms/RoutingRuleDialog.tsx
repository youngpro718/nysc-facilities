import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface RoutingRule {
  id: string;
  rule_name: string;
  form_type: string | null;
  priority: number;
  is_active: boolean;
  conditions: any;
  assign_to_user_id: string | null;
  assign_to_role: string | null;
  auto_approve: boolean;
  escalation_time_hours: number | null;
}

interface RoutingRuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingRule: RoutingRule | null;
}

export function RoutingRuleDialog({ open, onOpenChange, editingRule }: RoutingRuleDialogProps) {
  const [formData, setFormData] = useState({
    rule_name: "",
    form_type: "",
    priority: 0,
    is_active: true,
    conditions: "{}",
    assign_to_role: "",
    auto_approve: false,
    escalation_time_hours: "",
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    if (editingRule) {
      setFormData({
        rule_name: editingRule.rule_name,
        form_type: editingRule.form_type || "",
        priority: editingRule.priority,
        is_active: editingRule.is_active,
        conditions: JSON.stringify(editingRule.conditions, null, 2),
        assign_to_role: editingRule.assign_to_role || "",
        auto_approve: editingRule.auto_approve,
        escalation_time_hours: editingRule.escalation_time_hours?.toString() || "",
      });
    } else {
      setFormData({
        rule_name: "",
        form_type: "",
        priority: 0,
        is_active: true,
        conditions: "{}",
        assign_to_role: "",
        auto_approve: false,
        escalation_time_hours: "",
      });
    }
  }, [editingRule, open]);

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        ...data,
        form_type: data.form_type || null,
        escalation_time_hours: data.escalation_time_hours
          ? parseInt(data.escalation_time_hours)
          : null,
        conditions: JSON.parse(data.conditions),
      };

      if (editingRule) {
        const { error } = await supabase
          .from("form_routing_rules")
          .update(payload)
          .eq("id", editingRule.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("form_routing_rules").insert(payload);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routing-rules"] });
      toast.success(editingRule ? "Rule updated" : "Rule created");
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error("Failed to save rule: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate JSON
    try {
      JSON.parse(formData.conditions);
    } catch {
      toast.error("Invalid JSON in conditions");
      return;
    }

    saveMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingRule ? "Edit Routing Rule" : "Create Routing Rule"}</DialogTitle>
          <DialogDescription>
            Configure how form submissions should be automatically routed
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="rule_name">Rule Name</Label>
            <Input
              id="rule_name"
              value={formData.rule_name}
              onChange={(e) => setFormData({ ...formData, rule_name: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="form_type">Form Type (optional)</Label>
            <Select
              value={formData.form_type}
              onValueChange={(value) => setFormData({ ...formData, form_type: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All form types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All form types</SelectItem>
                <SelectItem value="key_request">Key Request</SelectItem>
                <SelectItem value="supply_request">Supply Request</SelectItem>
                <SelectItem value="maintenance_request">Maintenance Request</SelectItem>
                <SelectItem value="issue_report">Issue Report</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="priority">Priority</Label>
            <Input
              id="priority"
              type="number"
              value={formData.priority}
              onChange={(e) =>
                setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })
              }
              required
            />
            <p className="text-sm text-muted-foreground mt-1">
              Higher priority rules are evaluated first
            </p>
          </div>

          <div>
            <Label htmlFor="conditions">Conditions (JSON)</Label>
            <Textarea
              id="conditions"
              value={formData.conditions}
              onChange={(e) => setFormData({ ...formData, conditions: e.target.value })}
              rows={6}
              className="font-mono text-sm"
              required
            />
            <p className="text-sm text-muted-foreground mt-1">
              Example: {`{"priority": "urgent", "keywords": ["emergency"]}`}
            </p>
          </div>

          <div>
            <Label htmlFor="assign_to_role">Assign to Role</Label>
            <Select
              value={formData.assign_to_role}
              onValueChange={(value) => setFormData({ ...formData, assign_to_role: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="supply_room_staff">Supply Room Staff</SelectItem>
                <SelectItem value="maintenance_staff">Maintenance Staff</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="escalation_time_hours">Escalation Time (hours)</Label>
            <Input
              id="escalation_time_hours"
              type="number"
              value={formData.escalation_time_hours}
              onChange={(e) =>
                setFormData({ ...formData, escalation_time_hours: e.target.value })
              }
              placeholder="Optional"
            />
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
            <Label htmlFor="is_active">Active</Label>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="auto_approve"
              checked={formData.auto_approve}
              onCheckedChange={(checked) => setFormData({ ...formData, auto_approve: checked })}
            />
            <Label htmlFor="auto_approve">Auto-approve</Label>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Saving..." : "Save Rule"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
