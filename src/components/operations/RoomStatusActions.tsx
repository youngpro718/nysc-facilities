/**
 * RoomStatusActions Component
 * 
 * Quick action buttons for updating room status
 * Includes RBAC checks and confirmation dialogs
 * 
 * @module components/operations/RoomStatusActions
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Loader2,
} from 'lucide-react';
import { useRoomStatusUpdate } from '@/hooks/operations/useRoomStatusUpdate';
import { usePermissions } from '@/hooks/common/usePermissions';
import { RoomStatus } from '@/features/facilities/model';

interface RoomStatusActionsProps {
  roomId: string;
  currentStatus: string;
  className?: string;
}

const STATUS_CONFIG = {
  [RoomStatus.AVAILABLE]: {
    label: 'Available',
    icon: CheckCircle,
    color: 'text-green-500',
    variant: 'default' as const,
  },
  [RoomStatus.OCCUPIED]: {
    label: 'Occupied',
    icon: Clock,
    color: 'text-blue-500',
    variant: 'secondary' as const,
  },
  [RoomStatus.MAINTENANCE]: {
    label: 'Maintenance',
    icon: AlertTriangle,
    color: 'text-yellow-500',
    variant: 'outline' as const,
  },
  [RoomStatus.RESERVED]: {
    label: 'Reserved',
    icon: Clock,
    color: 'text-purple-500',
    variant: 'outline' as const,
  },
};

export function RoomStatusActions({ 
  roomId, 
  currentStatus,
  className 
}: RoomStatusActionsProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [notes, setNotes] = useState('');
  
  const { can } = usePermissions();
  const { mutate: updateStatus, isPending } = useRoomStatusUpdate();

  const canUpdateStatus = can('facility.update_status');

  const handleStatusClick = (status: string) => {
    if (status === currentStatus) return;
    setSelectedStatus(status);
    setIsDialogOpen(true);
  };

  const handleConfirm = () => {
    updateStatus(
      {
        roomId,
        newStatus: selectedStatus,
        notes: notes.trim() || undefined,
      },
      {
        onSuccess: () => {
          setIsDialogOpen(false);
          setNotes('');
          setSelectedStatus('');
        },
      }
    );
  };

  const handleCancel = () => {
    setIsDialogOpen(false);
    setNotes('');
    setSelectedStatus('');
  };

  if (!canUpdateStatus) {
    return (
      <div className={className}>
        <Badge variant="outline" className="text-muted-foreground">
          <XCircle className="h-3 w-3 mr-1" />
          No permission to update status
        </Badge>
      </div>
    );
  }

  return (
    <>
      <div className={className}>
        <div className="space-y-2">
          <Label className="text-sm font-medium">Quick Status Update</Label>
          <div className="flex flex-wrap gap-2">
            {Object.entries(STATUS_CONFIG).map(([status, config]) => {
              const Icon = config.icon;
              const isCurrent = status === currentStatus;
              const isDisabled = isCurrent || isPending;

              return (
                <Button
                  key={status}
                  variant={isCurrent ? config.variant : 'outline'}
                  size="sm"
                  disabled={isDisabled}
                  onClick={() => handleStatusClick(status)}
                  className={isCurrent ? '' : 'hover:border-primary'}
                >
                  <Icon className={`h-4 w-4 mr-2 ${isCurrent ? config.color : ''}`} />
                  {config.label}
                  {isCurrent && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      Current
                    </Badge>
                  )}
                </Button>
              );
            })}
          </div>
        </div>
      </div>

      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Status Change</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to change the room status from{' '}
              <strong>{STATUS_CONFIG[currentStatus as RoomStatus]?.label || currentStatus}</strong> to{' '}
              <strong>{STATUS_CONFIG[selectedStatus as RoomStatus]?.label || selectedStatus}</strong>.
              This action will be logged in the audit trail.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-2 py-4">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any relevant notes about this status change..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              disabled={isPending}
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel} disabled={isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirm Change
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

/**
 * Dropdown version for compact layouts
 */
export function RoomStatusDropdown({ 
  roomId, 
  currentStatus,
  className 
}: RoomStatusActionsProps) {
  const [notes, setNotes] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string>('');
  
  const { can } = usePermissions();
  const { mutate: updateStatus, isPending } = useRoomStatusUpdate();

  const canUpdateStatus = can('facility.update_status');

  const handleStatusChange = (newStatus: string) => {
    if (newStatus === currentStatus) return;
    setPendingStatus(newStatus);
    setIsDialogOpen(true);
  };

  const handleConfirm = () => {
    updateStatus(
      {
        roomId,
        newStatus: pendingStatus,
        notes: notes.trim() || undefined,
      },
      {
        onSuccess: () => {
          setIsDialogOpen(false);
          setNotes('');
          setPendingStatus('');
        },
      }
    );
  };

  if (!canUpdateStatus) {
    return (
      <Badge variant="outline" className={className}>
        {STATUS_CONFIG[currentStatus as RoomStatus]?.label || currentStatus}
      </Badge>
    );
  }

  return (
    <>
      <Select
        value={currentStatus}
        onValueChange={handleStatusChange}
        disabled={isPending}
      >
        <SelectTrigger className={className}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(STATUS_CONFIG).map(([status, config]) => {
            const Icon = config.icon;
            return (
              <SelectItem key={status} value={status}>
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${config.color}`} />
                  {config.label}
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>

      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Status Change</AlertDialogTitle>
            <AlertDialogDescription>
              Change status to{' '}
              <strong>{STATUS_CONFIG[pendingStatus as RoomStatus]?.label || pendingStatus}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-2 py-4">
            <Label htmlFor="dropdown-notes">Notes (optional)</Label>
            <Textarea
              id="dropdown-notes"
              placeholder="Add any relevant notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              disabled={isPending}
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
