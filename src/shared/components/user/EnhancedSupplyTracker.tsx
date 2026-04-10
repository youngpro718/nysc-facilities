import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  Clock, 
  CheckCircle, 
  Box,
  ChevronDown,
  ChevronUp,
  Receipt,
  X,
  Archive,
  EyeOff,
  Eye,
  Bell,
  User
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { ReceiptDialog } from '@features/supply/components/supply/ReceiptDialog';
import type { ReceiptData } from '@features/supply/types/receipt';
import { useSupplyReceipts } from '@features/supply/hooks/useSupplyReceipts';
import { createReceiptData } from '@/lib/receiptUtils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { confirmPickup, cancelSupplyRequest, archiveSupplyRequest } from '@features/supply/services/unifiedSupplyService';
import { toast } from 'sonner';
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

interface StaffProfile {
  first_name: string | null;
  last_name: string | null;
}

interface SupplyRequestItem {
  quantity_requested?: number;
  quantity_approved?: number;
  quantity_fulfilled?: number;
  inventory_items?: {
    name?: string;
    unit?: string;
  } | null;
}

interface RequesterProfile {
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  department?: string | null;
}

interface SupplyRequest {
  id: string;
  title: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  fulfilled_at?: string;
  approved_at?: string;
  ready_at?: string;
  fulfilled_by?: string;
  approval_notes?: string;
  fulfillment_notes?: string;
  supply_request_items?: SupplyRequestItem[];
  notes?: string;
  profiles?: RequesterProfile | null;
  assigned_fulfiller?: StaffProfile | null;
  completed_by?: StaffProfile | null;
  metadata?: {
    archived?: boolean;
    archived_at?: string;
  };
}

const formatStaffName = (profile: StaffProfile | null | undefined, full = false): string => {
  if (!profile?.first_name) return 'Staff';
  if (full) return `${profile.first_name}${profile.last_name ? ` ${profile.last_name}` : ''}`;
  return `${profile.first_name}${profile.last_name ? ` ${profile.last_name.charAt(0)}.` : ''}`;
};

interface EnhancedSupplyTrackerProps {
  requests: SupplyRequest[];
  featured?: boolean;
}

const statusLabel: Record<string, string> = {
  submitted: 'Submitted',
  received: 'Received',
  picking: 'Picking',
  ready: 'Ready for Pickup',
  completed: 'Completed',
  cancelled: 'Cancelled',
  rejected: 'Rejected',
};

const statusBorder: Record<string, string> = {
  submitted: 'border-l-blue-500',
  received: 'border-l-blue-500',
  picking: 'border-l-purple-500',
  ready: 'border-l-amber-500',
  completed: 'border-l-green-500',
  cancelled: 'border-l-muted-foreground',
  rejected: 'border-l-destructive',
};

const priorityDot: Record<string, string> = {
  urgent: 'bg-destructive',
  high: 'bg-destructive',
  medium: 'bg-amber-500',
  low: 'bg-muted-foreground/50',
};

export function EnhancedSupplyTracker({ requests, featured = false }: EnhancedSupplyTrackerProps) {
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showCompleted, setShowCompleted] = useState(true);
  const [selectedReceiptRequestId, setSelectedReceiptRequestId] = useState<string | null>(null);
  const { data: receipts } = useSupplyReceipts(selectedReceiptRequestId || undefined);

  const confirmPickupMutation = useMutation({
    mutationFn: confirmPickup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supply-requests'] });
      toast.success('Order marked as complete!');
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to confirm pickup'),
  });

  const cancelRequestMutation = useMutation({
    mutationFn: (requestId: string) => cancelSupplyRequest(requestId, 'Cancelled by user'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supply-requests'] });
      toast.success('Request cancelled');
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to cancel request'),
  });

  const archiveRequestMutation = useMutation({
    mutationFn: archiveSupplyRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supply-requests'] });
      toast.success('Request archived');
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to archive request'),
  });

  const visibleRequests = requests.filter(r => !(r.metadata as Record<string, unknown>)?.archived);
  const displayedRequests = showCompleted 
    ? visibleRequests 
    : visibleRequests.filter(r => r.status !== 'completed');

  const activeCount = visibleRequests.filter(r => !['completed', 'rejected', 'cancelled'].includes(r.status)).length;
  const completedCount = visibleRequests.filter(r => r.status === 'completed').length;

  if (requests.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-base font-medium mb-2">No Supply Requests</h3>
          <p className="text-sm text-muted-foreground">You haven't submitted any supply requests yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {activeCount} active{completedCount > 0 ? `, ${completedCount} completed` : ''}
        </p>
        {completedCount > 0 && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setShowCompleted(!showCompleted)}
            className="h-7 text-xs"
          >
            {showCompleted ? <EyeOff className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
            {showCompleted ? 'Hide' : 'Show'} Completed
          </Button>
        )}
      </div>

      {displayedRequests.map((request) => {
        const isExpanded = expandedId === request.id;
        const itemCount = request.supply_request_items?.length || 0;
        const isReadyForPickup = request.status === 'ready';
        const isCompleted = request.status === 'completed';
        const isActive = !['completed', 'rejected', 'cancelled'].includes(request.status);
        const staffName = request.assigned_fulfiller ? formatStaffName(request.assigned_fulfiller) : null;
        const border = statusBorder[request.status] || 'border-l-muted';
        const dot = priorityDot[request.priority] || priorityDot.low;

        return (
          <Card
            key={request.id}
            className={`border-l-[3px] ${border} transition-all ${
              isReadyForPickup ? 'ring-2 ring-warning/50 bg-warning/5' : ''
            }`}
          >
            {/* Ready for Pickup Banner */}
            {isReadyForPickup && (
              <div className="bg-warning text-warning-foreground px-4 py-2.5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 animate-pulse" />
                  <span className="font-semibold text-sm">Ready for Pickup</span>
                </div>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    confirmPickupMutation.mutate(request.id);
                  }}
                  disabled={confirmPickupMutation.isPending}
                  size="sm"
                  className="bg-background text-foreground hover:bg-background/90 h-7 text-xs"
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Confirm Pickup
                </Button>
              </div>
            )}

            {/* Compact Summary Row */}
            <div
              className="flex items-center gap-3 p-3 cursor-pointer hover:bg-accent/50 transition-colors active:bg-accent/70 touch-manipulation"
              onClick={() => setExpandedId(isExpanded ? null : request.id)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm truncate">{request.title}</span>
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dot}`} />
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                  <span>{itemCount} item{itemCount !== 1 ? 's' : ''}</span>
                  <span>·</span>
                  <span>{formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}</span>
                  {staffName && isActive && !isReadyForPickup && (
                    <>
                      <span>·</span>
                      <span className="flex items-center gap-0.5">
                        <User className="h-3 w-3" />
                        {staffName}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Receipt button visible on all non-cancelled orders */}
                {request.status !== 'cancelled' && request.status !== 'rejected' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs px-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedReceiptRequestId(request.id);
                    }}
                  >
                    <Receipt className="h-3.5 w-3.5 sm:mr-1" />
                    <span className="hidden sm:inline">Receipt</span>
                  </Button>
                )}

                <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
                  {statusLabel[request.status] || request.status}
                </Badge>

                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </div>

            {/* Expanded Details */}
            {isExpanded && (
              <div className="border-t px-4 py-4 space-y-4 bg-muted/20">
                {/* Items */}
                {itemCount > 0 && (
                  <div>
                    <p className="font-medium text-xs text-muted-foreground mb-2">Items</p>
                    <div className="space-y-1">
                      {request.supply_request_items?.slice(0, 8).map((item: unknown, idx: number) => {
                        const typedItem = item as Record<string, unknown>;
                        const invItem = typedItem.inventory_items as Record<string, unknown> | null;
                        return (
                          <div key={idx} className="text-sm flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                            <span>
                              {(invItem?.name as string) || 'Item'} × {(typedItem.quantity_requested as number) || 1}
                            </span>
                          </div>
                        );
                      })}
                      {itemCount > 8 && (
                        <p className="text-xs text-muted-foreground italic">+{itemCount - 8} more</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {request.notes && (
                  <div>
                    <p className="font-medium text-xs text-muted-foreground mb-1">Notes</p>
                    <p className="text-sm text-muted-foreground">{request.notes}</p>
                  </div>
                )}

                {/* Completed info */}
                {isCompleted && request.completed_by && (
                  <div className="bg-success/10 border border-success/30 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-success flex-shrink-0" />
                      <span>
                        Fulfilled by {formatStaffName(request.completed_by, true)}
                        {request.fulfilled_at && (
                          <span className="text-muted-foreground"> on {format(new Date(request.fulfilled_at), 'MMM d, yyyy')}</span>
                        )}
                      </span>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-3 border-t">
                  {['pending', 'submitted', 'received'].includes(request.status) && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8 text-xs">
                          <X className="h-3 w-3 mr-1" />
                          Cancel
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Cancel Supply Request?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will cancel "{request.title}". This cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Keep</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={(e) => {
                              e.stopPropagation();
                              cancelRequestMutation.mutate(request.id);
                            }}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Cancel Request
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                  {isCompleted && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="h-8 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        archiveRequestMutation.mutate(request.id);
                      }}
                    >
                      <Archive className="h-3 w-3 mr-1" />
                      Archive
                    </Button>
                  )}
                </div>
              </div>
            )}
          </Card>
        );
      })}

      {/* Receipt Dialog — use DB receipt if available, otherwise generate on-the-fly */}
      {selectedReceiptRequestId && (() => {
        const dbReceipt = receipts && receipts.length > 0 ? (receipts[0].pdf_data as ReceiptData) : null;
        const selectedRequest = requests.find(r => r.id === selectedReceiptRequestId);
        const receiptData = dbReceipt || (selectedRequest ? createReceiptData(selectedRequest as never) : null);
        if (!receiptData) return null;
        return (
          <ReceiptDialog
            open={!!selectedReceiptRequestId}
            onOpenChange={(open) => !open && setSelectedReceiptRequestId(null)}
            receiptData={receiptData}
          />
        );
      })()}
    </div>
  );
}
