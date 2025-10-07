import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Trash2, Save, Shield } from "lucide-react";
import { CourtRole } from "@/hooks/useRolePermissions";

interface TitleAccessRule {
  id?: string;
  title: string;
  role: CourtRole;
  description?: string;
}

const AVAILABLE_ROLES: Array<{ value: CourtRole; label: string; description: string }> = [
  { 
    value: "standard", 
    label: "Standard User", 
    description: "Basic access - can report issues and make requests" 
  },
  { 
    value: "supply_room_staff", 
    label: "Supply Staff", 
    description: "Manages inventory and fulfills supply requests" 
  },
  { 
    value: "clerk", 
    label: "Court Manager", 
    description: "Manages courts and court operations" 
  },
  { 
    value: "facilities_manager", 
    label: "Facility Coordinator (Admin)", 
    description: "Full access to everything" 
  },
];

export function TitleAccessManager() {
  const [newTitle, setNewTitle] = useState("");
  const [newRole, setNewRole] = useState<CourtRole | "">("");
  const queryClient = useQueryClient();

  // Fetch title rules from database
  const { data: titleRules, isLoading } = useQuery({
    queryKey: ["title-access-rules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("title_access_rules")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) {
        // If table doesn't exist, return empty array
        if (error.code === "42P01") {
          return [];
        }
        throw error;
      }

      return data as TitleAccessRule[];
    },
  });

  // Add new rule
  const addRuleMutation = useMutation({
    mutationFn: async (rule: TitleAccessRule) => {
      const { data, error } = await supabase
        .from("title_access_rules")
        .insert([{ title: rule.title, role: rule.role }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Title rule added successfully");
      queryClient.invalidateQueries({ queryKey: ["title-access-rules"] });
      setNewTitle("");
      setNewRole("");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to add rule");
    },
  });

  // Delete rule
  const deleteRuleMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("title_access_rules")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Title rule deleted");
      queryClient.invalidateQueries({ queryKey: ["title-access-rules"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete rule");
    },
  });

  const handleAddRule = () => {
    if (!newTitle.trim()) {
      toast.error("Please enter a job title");
      return;
    }
    if (!newRole) {
      toast.error("Please select an access level");
      return;
    }

    addRuleMutation.mutate({
      title: newTitle.trim(),
      role: newRole as CourtRole,
    });
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-500/10 text-red-700 border-red-500/20";
      case "facilities_manager":
        return "bg-blue-500/10 text-blue-700 border-blue-500/20";
      case "supply_room_staff":
        return "bg-green-500/10 text-green-700 border-green-500/20";
      case "clerk":
        return "bg-purple-500/10 text-purple-700 border-purple-500/20";
      default:
        return "bg-gray-500/10 text-gray-700 border-gray-500/20";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Job Title Access Rules
        </CardTitle>
        <CardDescription>
          Set which job titles get special access. Everyone else is a Standard User.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add New Rule */}
        <div className="p-4 rounded-lg border bg-muted/30 space-y-4">
          <h3 className="font-semibold text-sm">Add New Title Rule</h3>
          <div className="grid gap-4 sm:grid-cols-[1fr,1fr,auto]">
            <div className="space-y-2">
              <Label htmlFor="title">Job Title</Label>
              <Input
                id="title"
                placeholder="e.g., Supply Clerk"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Access Level</Label>
              <Select value={newRole} onValueChange={(value) => setNewRole(value as CourtRole)}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose access level" />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_ROLES.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      <div className="flex flex-col py-1">
                        <span className="font-semibold">{role.label}</span>
                        <span className="text-xs text-muted-foreground">{role.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleAddRule}
                disabled={addRuleMutation.isPending}
                className="w-full sm:w-auto"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Rule
              </Button>
            </div>
          </div>
        </div>

        {/* Current Rules */}
        <div className="space-y-2">
          <h3 className="font-semibold text-sm">Current Title Rules ({titleRules?.length || 0})</h3>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job Title</TableHead>
                  <TableHead>Access Level</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-[100px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      Loading rules...
                    </TableCell>
                  </TableRow>
                ) : titleRules && titleRules.length > 0 ? (
                  titleRules.map((rule) => {
                    const roleInfo = AVAILABLE_ROLES.find(r => r.value === rule.role);
                    return (
                      <TableRow key={rule.id}>
                        <TableCell className="font-medium">{rule.title}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getRoleBadgeColor(rule.role)}>
                            {roleInfo?.label || rule.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {roleInfo?.description || "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => rule.id && deleteRuleMutation.mutate(rule.id)}
                            disabled={deleteRuleMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      No title rules defined. Add your first rule above.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Simple Explanation */}
        <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-3">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <Shield className="h-4 w-4" />
            How This Works
          </h4>
          <div className="text-sm space-y-2">
            <p>1. Add job titles above (e.g., "Supply Clerk", "Court Clerk", "Facilities Manager")</p>
            <p>2. Choose what access level each title gets</p>
            <p>3. When someone signs up with that title, they automatically get that access</p>
            <p>4. Everyone else gets <strong>Standard User</strong> access</p>
          </div>
        </div>

        {/* Access Levels Explained */}
        <div className="p-4 rounded-lg bg-muted/50 border space-y-3">
          <h4 className="font-semibold text-sm">The 4 Access Levels:</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="bg-gray-500/10 text-gray-700 border-gray-500/20 mt-0.5">Standard User</Badge>
              <span className="text-muted-foreground">Can report issues and make supply requests</span>
            </div>
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/20 mt-0.5">Supply Staff</Badge>
              <span className="text-muted-foreground">Manages inventory and fulfills supply requests</span>
            </div>
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="bg-purple-500/10 text-purple-700 border-purple-500/20 mt-0.5">Court Manager</Badge>
              <span className="text-muted-foreground">Manages courts and court operations</span>
            </div>
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="bg-blue-500/10 text-blue-700 border-blue-500/20 mt-0.5">Facility Coordinator</Badge>
              <span className="text-muted-foreground">Full admin access to everything</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
