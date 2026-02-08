/**
 * Supply Request Actions Component
 * 
 * Admin actions for supply requests (delete, etc.)
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Loader2, MoreVertical, Trash2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteSupplyRequest } from '@/services/supplyRequestService';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/common/usePermissions';

interface SupplyRequestActionsProps {
  requestId: string;
  requestTitle: string;
  onDeleted?: () => void;
}

export function SupplyRequestActions({ requestId, requestTitle, onDeleted }: SupplyRequestActionsProps) {
  const { isAdmin } = usePermissions();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: () => deleteSupplyRequest(requestId),
    onSuccess: () => {
      toast({
        title: 'Request Deleted',
        description: `"${requestTitle}" has been deleted.`,
      });
      queryClient.invalidateQueries({ queryKey: ['supply-requests'] });
      setDeleteDialogOpen(false);
      onDeleted?.();
    },
    onError: (error: unknown) => {
      toast({
        title: 'Delete Failed',
        description: error.message || 'Could not delete the request',
        variant: 'destructive',
      });
    },
  });

  // Only show for admins
  if (!isAdmin) {
    return null;
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Request
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Supply Request?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{requestTitle}" and all its items.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
