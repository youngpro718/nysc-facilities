import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { toast } from "sonner";
import { RoutingRuleDialog } from "@/components/forms/RoutingRuleDialog";

interface RoutingRule {
  id: string;
  rule_name: string;
  form_type: string | null;
  priority: number;
  is_active: boolean;
  conditions: unknown;
  assign_to_user_id: string | null;
  assign_to_role: string | null;
  auto_approve: boolean;
  escalation_time_hours: number | null;
}

export default function RoutingRules() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<RoutingRule | null>(null);
  const queryClient = useQueryClient();

  const { data: rules, isLoading } = useQuery({
    queryKey: ["routing-rules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("form_routing_rules")
        .select("*")
        .order("priority", { ascending: false });

      if (error) throw error;
      return data as RoutingRule[];
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("form_routing_rules")
        .update({ is_active })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routing-rules"] });
      toast.success("Rule updated");
    },
    onError: (error) => {
      toast.error("Failed to update rule: " + error.message);
    },
  });

  const deleteRuleMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("form_routing_rules")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routing-rules"] });
      toast.success("Rule deleted");
    },
    onError: (error) => {
      toast.error("Failed to delete rule: " + error.message);
    },
  });

  const updatePriorityMutation = useMutation({
    mutationFn: async ({ id, priority }: { id: string; priority: number }) => {
      const { error } = await supabase
        .from("form_routing_rules")
        .update({ priority })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routing-rules"] });
    },
  });

  const movePriority = (rule: RoutingRule, direction: "up" | "down") => {
    if (!rules) return;
    
    const currentIndex = rules.findIndex((r) => r.id === rule.id);
    const newPriority = direction === "up" ? rule.priority + 1 : rule.priority - 1;
    
    updatePriorityMutation.mutate({ id: rule.id, priority: newPriority });
  };

  const handleEdit = (rule: RoutingRule) => {
    setEditingRule(rule);
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingRule(null);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingRule(null);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Form Routing Rules</h1>
          <p className="text-muted-foreground mt-1">
            Automatically route form submissions based on content and criteria
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          New Rule
        </Button>
      </div>

      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <div className="space-y-4">
          {rules?.map((rule) => (
            <Card key={rule.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-xl">{rule.rule_name}</CardTitle>
                    <Badge variant={rule.is_active ? "default" : "secondary"}>
                      {rule.is_active ? "Active" : "Inactive"}
                    </Badge>
                    <Badge variant="outline">Priority: {rule.priority}</Badge>
                    {rule.auto_approve && <Badge variant="default">Auto-approve</Badge>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => movePriority(rule, "up")}
                    >
                      <ArrowUp className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => movePriority(rule, "down")}
                    >
                      <ArrowDown className="w-4 h-4" />
                    </Button>
                    <Switch
                      checked={rule.is_active}
                      onCheckedChange={(checked) =>
                        toggleActiveMutation.mutate({ id: rule.id, is_active: checked })
                      }
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(rule)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this rule?")) {
                          deleteRuleMutation.mutate(rule.id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <CardDescription>
                  {rule.form_type ? `Form type: ${rule.form_type}` : "All form types"}
                  {rule.escalation_time_hours && ` • Escalates after ${rule.escalation_time_hours}h`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <span className="font-semibold">Conditions:</span>
                    <pre className="mt-1 p-2 bg-muted rounded text-sm">
                      {JSON.stringify(rule.conditions, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <span className="font-semibold">Assignment:</span>{" "}
                    {rule.assign_to_role ? (
                      <Badge variant="secondary">{rule.assign_to_role}</Badge>
                    ) : (
                      <span className="text-muted-foreground">Specific user</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {rules?.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  No routing rules configured. Create your first rule to start auto-routing forms.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <RoutingRuleDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        editingRule={editingRule}
      />
    </div>
  );
}
