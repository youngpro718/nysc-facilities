import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "@/services/core/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Paintbrush, Blinds, Armchair, Package, SquareStack, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { AddFinishDialog } from "./AddFinishDialog";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface FinishesStepProps {
  roomId?: string;
}

export type FinishType = 'painting' | 'carpeting' | 'blinds' | 'furniture' | 'other';

export interface FinishEntry {
  id: string;
  room_id: string;
  finish_type: FinishType;
  completed_date: string | null;
  color: string | null;
  notes: string | null;
  vendor_contractor: string | null;
  cost: number | null;
  details: Record<string, unknown>;
  created_at: string;
}

const finishTypeConfig: Record<FinishType, { icon: React.ElementType; label: string; color: string }> = {
  painting: { icon: Paintbrush, label: "Painting", color: "text-amber-500" },
  carpeting: { icon: SquareStack, label: "Carpeting", color: "text-orange-600" },
  blinds: { icon: Blinds, label: "Blinds", color: "text-blue-500" },
  furniture: { icon: Armchair, label: "Furniture", color: "text-purple-500" },
  other: { icon: Package, label: "Other", color: "text-muted-foreground" },
};

export function FinishesStep({ roomId }: FinishesStepProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<FinishEntry | null>(null);
  const [deletingEntry, setDeletingEntry] = useState<FinishEntry | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["room-finishes", roomId],
    queryFn: async () => {
      if (!roomId) return [];
      const { data, error } = await db
        .from("room_finishes_log")
        .select("*")
        .eq("room_id", roomId)
        .order("completed_date", { ascending: false, nullsFirst: false });
      
      if (error) throw error;
      return data as FinishEntry[];
    },
    enabled: !!roomId,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db
        .from("room_finishes_log")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["room-finishes", roomId] });
      toast({ title: "Entry deleted" });
      setDeletingEntry(null);
    },
    onError: (error) => {
      toast({ title: "Error deleting entry", description: String(error), variant: "destructive" });
    },
  });

  const handleEdit = (entry: FinishEntry) => {
    setEditingEntry(entry);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingEntry(null);
  };

  // Get most recent entry for each type for the summary
  const latestByType = entries.reduce((acc, entry) => {
    if (!acc[entry.finish_type]) {
      acc[entry.finish_type] = entry;
    }
    return acc;
  }, {} as Record<FinishType, FinishEntry>);

  if (!roomId) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold">Finishes & Furnishings</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Save the room first to track finishes and furnishings
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Finishes & Furnishings</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Track painting, flooring, blinds, and furniture history
          </p>
        </div>
        <Button type="button" onClick={() => setIsDialogOpen(true)} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Add Entry
        </Button>
      </div>

      {/* Quick Summary */}
      {Object.keys(latestByType).length > 0 && (
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm font-medium">Latest Updates</CardTitle>
          </CardHeader>
          <CardContent className="py-2">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
              {Object.entries(latestByType).map(([type, entry]) => {
                const config = finishTypeConfig[type as FinishType];
                const Icon = config.icon;
                return (
                  <div key={type} className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${config.color}`} />
                    <span className="text-muted-foreground">
                      {config.label}:{" "}
                      {entry.completed_date 
                        ? format(new Date(entry.completed_date), "MMM yyyy")
                        : "No date"}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Entries List */}
      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading...</div>
      ) : entries.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No finish entries yet</p>
            <p className="text-sm">Add painting, carpeting, blinds, or furniture records</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => {
            const config = finishTypeConfig[entry.finish_type];
            const Icon = config.icon;
            const details = entry.details as Record<string, string>;
            
            return (
              <Card key={entry.id}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-md bg-muted ${config.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{config.label}</span>
                          {entry.completed_date && (
                            <span className="text-sm text-muted-foreground">
                              {format(new Date(entry.completed_date), "MMM d, yyyy")}
                            </span>
                          )}
                        </div>
                        {entry.color && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground">Color:</span>
                            <span>{entry.color}</span>
                            {details?.color_code && (
                              <div 
                                className="w-4 h-4 rounded border"
                                style={{ backgroundColor: details.color_code }}
                              />
                            )}
                          </div>
                        )}
                        {entry.vendor_contractor && (
                          <div className="text-sm text-muted-foreground">
                            Vendor: {entry.vendor_contractor}
                          </div>
                        )}
                        {/* Type-specific details */}
                        {details?.finish && (
                          <div className="text-sm text-muted-foreground">
                            Finish: {details.finish}
                          </div>
                        )}
                        {details?.material && (
                          <div className="text-sm text-muted-foreground">
                            Material: {details.material}
                          </div>
                        )}
                        {details?.style && (
                          <div className="text-sm text-muted-foreground">
                            Style: {details.style}
                          </div>
                        )}
                        {details?.items && (
                          <div className="text-sm text-muted-foreground">
                            Items: {details.items}
                          </div>
                        )}
                        {details?.order_number && (
                          <div className="text-sm text-muted-foreground">
                            PO#: {details.order_number}
                          </div>
                        )}
                        {entry.notes && (
                          <div className="text-sm text-muted-foreground mt-1">
                            {entry.notes}
                          </div>
                        )}
                        {entry.cost && (
                          <div className="text-sm font-medium mt-1">
                            Cost: ${entry.cost.toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEdit(entry)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setDeletingEntry(entry)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <AddFinishDialog
        open={isDialogOpen}
        onOpenChange={handleDialogClose}
        roomId={roomId}
        editingEntry={editingEntry}
      />

      <AlertDialog open={!!deletingEntry} onOpenChange={() => setDeletingEntry(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Entry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this {deletingEntry?.finish_type} entry? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingEntry && deleteMutation.mutate(deletingEntry.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
