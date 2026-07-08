import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Shield, Plus, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errorUtils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Category {
  id: string;
  name: string;
  color: string | null;
  requires_supervisor_approval: boolean | null;
}

/**
 * Admin dialog to manage inventory categories. Currently focused on the
 * `requires_supervisor_approval` flag which — combined with the item-level
 * `requires_justification` flag — determines whether the supplies cart forces
 * a supervisor's 4-digit code before an order can be placed.
 */
export function ManageCategoriesDialog({ open, onOpenChange }: Props) {
  const qc = useQueryClient();
  const [newName, setNewName] = useState("");

  const { data: categories, isLoading } = useQuery<Category[]>({
    queryKey: ["inventory-categories-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory_categories")
        .select("id,name,color,requires_supervisor_approval")
        .order("name");
      if (error) throw error;
      return (data ?? []) as Category[];
    },
    enabled: open,
  });

  const toggleSupervisor = useMutation({
    mutationFn: async ({ id, next }: { id: string; next: boolean }) => {
      const { error } = await supabase
        .from("inventory_categories")
        .update({ requires_supervisor_approval: next })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory-categories-admin"] });
      qc.invalidateQueries({ queryKey: ["inventory-categories"] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const createCategory = useMutation({
    mutationFn: async (name: string) => {
      const { error } = await supabase
        .from("inventory_categories")
        .insert({ name: name.trim() });
      if (error) throw error;
    },
    onSuccess: () => {
      setNewName("");
      toast.success("Category added");
      qc.invalidateQueries({ queryKey: ["inventory-categories-admin"] });
      qc.invalidateQueries({ queryKey: ["inventory-categories"] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("inventory_categories")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Category removed");
      qc.invalidateQueries({ queryKey: ["inventory-categories-admin"] });
      qc.invalidateQueries({ queryKey: ["inventory-categories"] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage Categories</DialogTitle>
          <DialogDescription>
            Turn on <span className="font-medium">Supervisor approval</span> for
            any category whose items should require a supervisor's code before
            an order can be submitted.
          </DialogDescription>
        </DialogHeader>

        <form
          className="flex items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!newName.trim()) return;
            createCategory.mutate(newName);
          }}
        >
          <div className="flex-1">
            <Label htmlFor="new-cat" className="text-xs">
              New category
            </Label>
            <Input
              id="new-cat"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Restricted Supplies"
            />
          </div>
          <Button type="submit" disabled={!newName.trim() || createCategory.isPending}>
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </form>

        <div className="max-h-[50vh] overflow-y-auto border rounded-md divide-y">
          {isLoading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading…
            </div>
          ) : (categories ?? []).length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No categories yet.
            </div>
          ) : (
            (categories ?? []).map((c) => (
              <div key={c.id} className="flex items-center justify-between px-3 py-2 gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="h-3 w-3 rounded-full shrink-0"
                    style={{ backgroundColor: c.color ?? "hsl(var(--muted))" }}
                    aria-hidden
                  />
                  <span className="truncate font-medium">{c.name}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex items-center gap-2">
                    <Shield
                      className={`h-3.5 w-3.5 ${
                        c.requires_supervisor_approval
                          ? "text-amber-500"
                          : "text-muted-foreground"
                      }`}
                    />
                    <Label htmlFor={`sup-${c.id}`} className="text-xs">
                      Supervisor approval
                    </Label>
                    <Switch
                      id={`sup-${c.id}`}
                      checked={!!c.requires_supervisor_approval}
                      disabled={toggleSupervisor.isPending}
                      onCheckedChange={(next) =>
                        toggleSupervisor.mutate({ id: c.id, next })
                      }
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive"
                    disabled={deleteCategory.isPending}
                    onClick={() => {
                      if (
                        confirm(
                          `Delete category "${c.name}"? Items in this category will lose their category.`,
                        )
                      ) {
                        deleteCategory.mutate(c.id);
                      }
                    }}
                    aria-label={`Delete ${c.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
