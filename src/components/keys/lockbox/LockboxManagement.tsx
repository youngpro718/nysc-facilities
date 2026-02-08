import { useState } from "react";
import { getErrorMessage } from "@/lib/errorUtils";
import { logger } from '@/lib/logger';
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Edit, Trash2, MapPin, Package } from "lucide-react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { LockboxWithSlotCount, Lockbox } from "../types/LockboxTypes";
import { EditLockboxDialog } from "./EditLockboxDialog";

export function LockboxManagement() {
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [lockboxToDelete, setLockboxToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [lockboxToEdit, setLockboxToEdit] = useState<Lockbox | null>(null);

  const { data: lockboxes, isLoading } = useQuery({
    queryKey: ["lockboxes-management"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lockboxes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get slot counts for each lockbox
      const lockboxesWithCounts = await Promise.all(
        (data || []).map(async (lockbox) => {
          const { data: slots, error: slotsError } = await supabase
            .from('lockbox_slots')
            .select('status')
            .eq('lockbox_id', lockbox.id);

          if (slotsError) throw slotsError;

          return {
            ...lockbox,
            total_slots: slots.length,
            available_slots: slots.filter(s => s.status === 'in_box').length,
            checked_out_slots: slots.filter(s => s.status === 'checked_out').length,
          } as LockboxWithSlotCount;
        })
      );

      return lockboxesWithCounts;
    },
  });

  const handleDelete = async () => {
    if (!lockboxToDelete) return;

    setIsDeleting(true);
    try {
      // Delete all slots first (cascade)
      const { error: slotsError } = await supabase
        .from('lockbox_slots')
        .delete()
        .eq('lockbox_id', lockboxToDelete);

      if (slotsError) throw slotsError;

      // Delete the lockbox
      const { error: lockboxError } = await supabase
        .from('lockboxes')
        .delete()
        .eq('id', lockboxToDelete);

      if (lockboxError) throw lockboxError;

      toast.success("Lockbox deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["lockboxes-management"] });
      queryClient.invalidateQueries({ queryKey: ["lockboxes"] });
      setDeleteDialogOpen(false);
      setLockboxToDelete(null);
    } catch (error) {
      logger.error('Error deleting lockbox:', error);
      toast.error(getErrorMessage(error) || "Failed to delete lockbox");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {lockboxes?.map((lockbox) => (
          <Card key={lockbox.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Package className="h-5 w-5" />
                {lockbox.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {lockbox.location_description && (
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{lockbox.location_description}</span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-background">
                  {lockbox.total_slots} Total
                </Badge>
                <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">
                  {lockbox.available_slots} Available
                </Badge>
                <Badge variant="outline" className="bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20">
                  {lockbox.checked_out_slots} Out
                </Badge>
              </div>

              {lockbox.notes && (
                <p className="text-xs text-muted-foreground">{lockbox.notes}</p>
              )}

              <div className="flex gap-2 pt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => {
                    setLockboxToEdit(lockbox);
                    setEditDialogOpen(true);
                  }}
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-destructive hover:bg-destructive/10"
                  onClick={() => {
                    setLockboxToDelete(lockbox.id);
                    setDeleteDialogOpen(true);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {(!lockboxes || lockboxes.length === 0) && (
        <div className="text-center py-12 text-muted-foreground">
          <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No lockboxes found</p>
          <p className="text-sm">Create a new lockbox to get started</p>
        </div>
      )}

      <EditLockboxDialog 
        lockbox={lockboxToEdit}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["lockboxes-management"] });
          queryClient.invalidateQueries({ queryKey: ["lockboxes"] });
        }}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lockbox</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this lockbox? This will also delete all slots and activity logs associated with it. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
