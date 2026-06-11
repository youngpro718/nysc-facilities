import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { MapPin, Loader2, Pencil } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateSupplyRequestDeliveryLocation } from '@features/supply/services/unifiedSupplyService';
import { useToast } from '@shared/hooks/use-toast';
import { useRolePermissions } from '@features/auth/hooks/useRolePermissions';
import { getErrorMessage } from '@/lib/errorUtils';
import { cn } from '@/lib/utils';

interface EditDeliveryLocationButtonProps {
  requestId: string;
  currentLocation: string | null | undefined;
  variant?: 'icon' | 'inline';
  className?: string;
}

/**
 * Inline edit control for a supply request's delivery location.
 * Visible only to staff/admin roles that can manage supply requests.
 * Use `variant="icon"` inside dense table rows; `variant="inline"` next to
 * the location pill on a card.
 */
export function EditDeliveryLocationButton({
  requestId,
  currentLocation,
  variant = 'inline',
  className,
}: EditDeliveryLocationButtonProps) {
  const { canManage, canAdmin } = useRolePermissions();
  const allowed = canManage('supply_requests') || canAdmin('supply_requests');
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(currentLocation ?? '');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => updateSupplyRequestDeliveryLocation(requestId, value),
    onSuccess: () => {
      toast({
        title: 'Delivery location updated',
        description: `Order will be delivered to ${value.trim()}.`,
      });
      queryClient.invalidateQueries({ queryKey: ['supply-requests'] });
      queryClient.invalidateQueries({ queryKey: ['supply-pending-counts'] });
      setOpen(false);
    },
    onError: (error: unknown) => {
      toast({
        title: 'Update failed',
        description: getErrorMessage(error),
        variant: 'destructive',
      });
    },
  });

  if (!allowed) return null;

  const openDialog = (e: React.MouseEvent) => {
    e.stopPropagation();
    setValue(currentLocation ?? '');
    setOpen(true);
  };

  return (
    <>
      {variant === 'icon' ? (
        <Button
          variant="ghost"
          size="icon"
          className={cn('h-7 w-7', className)}
          onClick={openDialog}
          aria-label="Edit delivery location"
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          className={cn('h-7 px-2 text-xs text-muted-foreground hover:text-foreground', className)}
          onClick={openDialog}
        >
          <Pencil className="h-3 w-3 mr-1" />
          Edit
        </Button>
      )}

      <Dialog open={open} onOpenChange={(o) => !mutation.isPending && setOpen(o)}>
        <DialogContent onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Edit delivery location
            </DialogTitle>
            <DialogDescription>
              Update where this order should be dropped off. The requester will
              see the new location on their order.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <Label htmlFor="delivery-location">Delivery location</Label>
            <Input
              id="delivery-location"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="e.g. Room 927 (111)"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && value.trim() && !mutation.isPending) {
                  mutation.mutate();
                }
              }}
            />
            {currentLocation && (
              <p className="text-xs text-muted-foreground">
                Currently: <span className="font-medium">{currentLocation}</span>
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={mutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => mutation.mutate()}
              disabled={
                mutation.isPending ||
                !value.trim() ||
                value.trim() === (currentLocation ?? '').trim()
              }
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save location'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
