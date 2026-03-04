import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "@/services/core/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Paintbrush, Blinds, Armchair, Package, SquareStack, Pencil, Trash2, Calendar } from "lucide-react";
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
  compact?: boolean;
}

export type FinishType = 'painting' | 'carpeting' | 'blinds' | 'furniture' | 'other';
export type FinishStatus = 'scheduled' | 'in_progress' | 'completed';

export interface FinishEntry {
  id: string;
  room_id: string;
  finish_type: FinishType;
  status: FinishStatus | null;
  scheduled_date: string | null;
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
  carpeting: { icon: SquareStack, label: "Flooring", color: "text-orange-600 dark:text-orange-400" },
  blinds: { icon: Blinds, label: "Blinds", color: "text-blue-500" },
  furniture: { icon: Armchair, label: "Furniture", color: "text-purple-500" },
  other: { icon: Package, label: "Other", color: "text-muted-foreground" },
};

const statusConfig: Record<FinishStatus, { label: string; className: string }> = {
  scheduled: { label: "📅 Scheduled", className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-700" },
  in_progress: { label: "🔧 In Progress", className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-700" },
  completed: { label: "✓ Completed", className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-700" },
};

export function FinishesStep({ roomId, compact = false }: FinishesStepProps) {
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
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as FinishEntry[];
    },
    enabled: !!roomId,
  });

  // Sort: scheduled/in_progress first, then completed by date
  const sortedEntries = [...entries].sort((a, b) => {
    const aScheduled = a.status === 'scheduled' || a.status === 'in_progress';
    const bScheduled = b.status === 'scheduled' || b.status === 'in_progress';
    if (aScheduled && !bScheduled) return -1;
    if (!aScheduled && bScheduled) return 1;
    return 0;
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        {!compact && (
          <div>
            <h3 className="text-lg font-semibold">Finishes & Furnishings</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Track painting, flooring, blinds, and furniture — scheduled and completed
            </p>
          </div>
        )}
        <Button
          type="button"
          onClick={() => setIsDialogOpen(true)}
          size="sm"
          className={compact ? "w-full" : ""}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Entry
        </Button>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading...</div>
      ) : sortedEntries.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Package className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No entries yet</p>
            <p className="text-xs mt-1">Track painting, flooring, and more — past and upcoming</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {sortedEntries.map((entry) => {
            const config = finishTypeConfig[entry.finish_type];
            const Icon = config.icon;
            const details = (entry.details || {}) as Record<string, string>;
            const entryStatus = entry.status || 'completed';
            const statusInfo = statusConfig[entryStatus];
            const isUpcoming = entryStatus === 'scheduled' || entryStatus === 'in_progress';

            const displayDate = isUpcoming
              ? entry.scheduled_date
              : entry.completed_date;

            return (
              <Card key={entry.id} className={isUpcoming ? "border-blue-200 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-950/10" : ""}>
                <CardContent className="py-3 px-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`p-1.5 rounded-md bg-muted shrink-0 ${config.color}`}>
                        {isUpcoming
                          ? <Calendar className="h-4 w-4" />
                          : <Icon className="h-4 w-4" />
                        }
                      </div>
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-sm">{config.label}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${statusInfo.className}`}>
                            {statusInfo.label}
                          </span>
                        </div>
                        {displayDate && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(displayDate), "MMM d, yyyy")}
                          </div>
                        )}
                        {/* Paint details */}
                        {entry.color && (
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-muted-foreground">Color:</span>
                            <span className="font-medium">{entry.color}</span>
                            {details?.color_code && (
                              <span className="text-muted-foreground">({details.color_code})</span>
                            )}
                            {details?.color_hex && (
                              <div
                                className="w-3.5 h-3.5 rounded-sm border border-border shrink-0"
                                style={{ backgroundColor: details.color_hex }}
                              />
                            )}
                          </div>
                        )}
                        {/* Flooring type */}
                        {details?.flooring_type && (
                          <div className="text-xs text-muted-foreground">
                            Type: <span className="font-medium">{details.flooring_type.toUpperCase()}</span>
                          </div>
                        )}
                        {/* Finish/Brand */}
                        {details?.finish && (
                          <div className="text-xs text-muted-foreground">Finish: {details.finish}</div>
                        )}
                        {details?.brand && (
                          <div className="text-xs text-muted-foreground">Brand: {details.brand}</div>
                        )}
                        {/* Blinds */}
                        {details?.style && (
                          <div className="text-xs text-muted-foreground">Style: {details.style}</div>
                        )}
                        {/* Furniture */}
                        {details?.items && (
                          <div className="text-xs text-muted-foreground truncate">Items: {details.items}</div>
                        )}
                        {entry.vendor_contractor && (
                          <div className="text-xs text-muted-foreground">Vendor: {entry.vendor_contractor}</div>
                        )}
                        {entry.notes && (
                          <div className="text-xs text-muted-foreground italic mt-1 line-clamp-2">{entry.notes}</div>
                        )}
                        {entry.cost && (
                          <div className="text-xs font-medium">${entry.cost.toLocaleString()}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleEdit(entry)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => setDeletingEntry(entry)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
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
