import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Package, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Truck,
  ClipboardCheck,
  Box,
  ChevronDown,
  ChevronUp,
  Plus,
  ShoppingCart,
  Receipt,
  X,
  Archive,
  EyeOff,
  Eye,
  Bell,
  User
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { QuickOrderGrid } from '@/components/supply/QuickOrderGrid';
import { ReceiptDialog } from '@/components/supply/ReceiptDialog';
import { useSupplyReceipts } from '@/hooks/useSupplyReceipts';
import { createReceiptData } from '@/lib/receiptUtils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { confirmPickup, cancelSupplyRequest, archiveSupplyRequest } from '@/services/supplyOrdersService';
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

interface SupplyRequest {
  id: string;
  title: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  fulfilled_at?: string;
  supply_request_items?: unknown[];
  notes?: string;
  assigned_fulfiller?: StaffProfile | null;
  completed_by?: StaffProfile | null;
  metadata?: {
    archived?: boolean;
    archived_at?: string;
  };
}

// Helper to format staff name (First Name + Last Initial)
const formatStaffName = (profile: StaffProfile | null | undefined, full = false): string => {
  if (!profile?.first_name) return 'Staff';
  if (full) {
    return `${profile.first_name}${profile.last_name ? ` ${profile.last_name}` : ''}`;
  }
  const lastInitial = profile.last_name ? ` ${profile.last_name.charAt(0)}.` : '';
  return `${profile.first_name}${lastInitial}`;
};

interface EnhancedSupplyTrackerProps {
  requests: SupplyRequest[];
  featured?: boolean;
}

const SUPPLY_STAGES = [
  { key: 'submitted', label: 'Submitted', icon: ClipboardCheck, color: 'text-yellow-600 dark:text-yellow-400' },
  { key: 'received', label: 'Received', icon: Clock, color: 'text-blue-600 dark:text-blue-400' },
  { key: 'picking', label: 'Picking Items', icon: Box, color: 'text-purple-600 dark:text-purple-400' },
  { key: 'ready', label: 'Ready for Pickup', icon: Package, color: 'text-green-600 dark:text-green-400' },
  { key: 'completed', label: 'Completed', icon: CheckCircle, color: 'text-emerald-600' },
];

const getStageProgress = (status: string): number => {
  const stageIndex = SUPPLY_STAGES.findIndex(s => s.key === status);
  if (stageIndex === -1) return 0;
  return ((stageIndex + 1) / SUPPLY_STAGES.length) * 100;
};

const getCurrentStageIndex = (status: string): number => {
  return SUPPLY_STAGES.findIndex(s => s.key === status);
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'urgent': return 'bg-destructive/10 text-destructive border-destructive/30';
    case 'high': return 'bg-warning/10 text-warning-foreground border-warning/30';
    case 'medium': return 'bg-warning/5 text-warning-foreground border-warning/20';
    case 'low': return 'bg-success/10 text-success-foreground border-success/30';
    default: return 'bg-muted text-muted-foreground border-border';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending':
    case 'under_review':
      return 'bg-warning';
    case 'approved':
    case 'picking':
    case 'packing':
      return 'bg-info';
    case 'ready':
    case 'fulfilled':
      return 'bg-success';
    case 'rejected':
    case 'cancelled':
      return 'bg-destructive';
    default:
      return 'bg-muted';
  }
};

export function EnhancedSupplyTracker({ requests, featured = false }: EnhancedSupplyTrackerProps) {
  const queryClient = useQueryClient();
  const [expandedRequest, setExpandedRequest] = useState<string | null>(
    requests.length > 0 ? requests[0].id : null
  );
  const [showNewRequestForm, setShowNewRequestForm] = useState(false);
  const [showCompleted, setShowCompleted] = useState(true);
  const [selectedReceiptRequestId, setSelectedReceiptRequestId] = useState<string | null>(null);
  const { data: receipts } = useSupplyReceipts(selectedReceiptRequestId || undefined);

  const confirmPickupMutation = useMutation({
    mutationFn: confirmPickup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supply-requests'] });
      toast.success('Order marked as complete!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to confirm pickup');
    },
  });

  const cancelRequestMutation = useMutation({
    mutationFn: (requestId: string) => cancelSupplyRequest(requestId, 'Cancelled by user'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supply-requests'] });
      toast.success('Request cancelled');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to cancel request');
    },
  });

  const archiveRequestMutation = useMutation({
    mutationFn: archiveSupplyRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supply-requests'] });
      toast.success('Request archived');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to archive request');
    },
  });

  // Filter out archived requests and optionally hide completed
  const visibleRequests = requests.filter(r => !(r.metadata as Record<string, unknown>)?.archived);
  const displayedRequests = showCompleted 
    ? visibleRequests 
    : visibleRequests.filter(r => r.status !== 'completed');

  const activeRequests = visibleRequests.filter(r => 
    !['completed', 'rejected', 'cancelled'].includes(r.status)
  );
  
  const completedCount = visibleRequests.filter(r => r.status === 'completed').length;

  const toggleExpand = (requestId: string) => {
    setExpandedRequest(expandedRequest === requestId ? null : requestId);
  };

  if (requests.length === 0) {
    return (
      <Card className={featured ? 'border-2 border-primary/20' : ''}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              <span>My Supply Requests</span>
            </div>
          <Dialog open={showNewRequestForm} onOpenChange={setShowNewRequestForm}>
              {/* Quick Order removed - supply staff fulfill orders, they don't create them */}
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">No Supply Requests</h3>
            <p className="text-sm text-muted-foreground mb-6">
              You haven't submitted any supply requests yet.
            </p>
            <Button onClick={() => setShowNewRequestForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Request
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2 px-3 sm:px-6">
        <CardTitle className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Package className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="text-base sm:text-lg font-semibold truncate">Supply Requests</div>
              {activeRequests.length > 0 && (
                <div className="text-xs font-normal text-muted-foreground">
                  {activeRequests.length} active
                </div>
              )}
            </div>
          </div>
          {completedCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowCompleted(!showCompleted)}
              className="h-8 text-xs flex-shrink-0"
            >
              {showCompleted ? (
                <>
                  <EyeOff className="h-3 w-3 mr-1.5" />
                  <span className="hidden sm:inline">Hide Completed ({completedCount})</span>
                  <span className="sm:hidden">{completedCount}</span>
                </>
              ) : (
                <>
                  <Eye className="h-3 w-3 mr-1.5" />
                  <span className="hidden sm:inline">Show Completed ({completedCount})</span>
                  <span className="sm:hidden">{completedCount}</span>
                </>
              )}
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 px-2 sm:px-6 py-3">
        {displayedRequests.map((request) => {
          const isExpanded = expandedRequest === request.id;
          const currentStageIndex = getCurrentStageIndex(request.status);
          const progress = getStageProgress(request.status);
          const isActive = !['fulfilled', 'rejected', 'cancelled'].includes(request.status);
          const itemCount = request.supply_request_items?.length || 0;

          const staffName = request.assigned_fulfiller ? formatStaffName(request.assigned_fulfiller) : null;
          const isReadyForPickup = request.status === 'ready';

          return (
            <div
              key={request.id}
              className={`border rounded-lg transition-all touch-manipulation ${
                isReadyForPickup
                  ? 'border-warning bg-warning/10 ring-2 ring-warning/50'
                  : request.status === 'completed'
                    ? 'border-success bg-success/5'
                    : isActive 
                      ? 'border-primary/30 bg-primary/5' 
                      : 'border-border'
              }`}
            >
              {/* ACTION REQUIRED BANNER - Prominent for ready status */}
              {isReadyForPickup && (
                <div className="bg-warning text-warning-foreground p-3 rounded-t-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Bell className="h-5 w-5 animate-pulse" />
                    <span className="font-bold text-sm">ACTION REQUIRED: Ready for Pickup!</span>
                  </div>
                  <p className="text-xs opacity-90 mb-3">Your supplies are waiting at the Supply Room</p>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      confirmPickupMutation.mutate(request.id);
                    }}
                    disabled={confirmPickupMutation.isPending}
                    size="sm"
                    className="w-full bg-background text-foreground hover:bg-background/90"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Confirm I Picked This Up
                  </Button>
                </div>
              )}

              {/* Header - iPhone Optimized with larger touch targets */}
              <div
                className={`p-4 cursor-pointer active:bg-accent/70 transition-all duration-150 touch-manipulation ${isReadyForPickup ? 'rounded-t-none' : ''}`}
                onClick={() => toggleExpand(request.id)}
              >
                <div className="space-y-3">
                  {/* Title Row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base leading-tight mb-1">{request.title}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4 flex-shrink-0" />
                        <span>{formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}</span>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="flex-shrink-0 touch-manipulation h-10 w-10"
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5" />
                      ) : (
                        <ChevronDown className="h-5 w-5" />
                      )}
                    </Button>
                  </div>

                  {/* Status and Info Row */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className={`${getPriorityColor(request.priority)} text-xs px-2 py-1`}>
                      {request.priority}
                    </Badge>
                    <Badge variant="outline" className="text-xs px-2 py-1">
                      {itemCount} {itemCount === 1 ? 'item' : 'items'}
                    </Badge>
                    
                    {/* Staff handling badge - shows who is working on it */}
                    {staffName && isActive && !isReadyForPickup && request.status !== 'completed' && (
                      <Badge variant="outline" className="bg-info/10 text-info-foreground border-info/30 text-xs px-2 py-1">
                        <User className="h-3 w-3 mr-1" />
                        {staffName} handling
                      </Badge>
                    )}
                    
                    {/* Completed badge */}
                    {request.status === 'completed' && (
                      <Badge className="bg-success text-success-foreground border-success text-xs px-2 py-1">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Completed
                      </Badge>
                    )}
                    
                    {isActive && request.status !== 'completed' && !isReadyForPickup && (
                      <Badge variant="outline" className="bg-success/10 text-success-foreground border-success/30 text-xs px-2 py-1">
                        Active
                      </Badge>
                    )}
                  </div>

                  {/* Large Status Display */}
                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">
                        {SUPPLY_STAGES[currentStageIndex]?.label || 'Unknown'}
                      </span>
                      <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className={`h-2 ${getStatusColor(request.status)}`} />
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="border-t px-4 py-4 space-y-4 bg-muted/30">
                  {/* Vertical Timeline - iPhone Optimized with Staff Info */}
                  <div>
                    <h4 className="font-medium mb-4 text-sm">Request Progress</h4>
                    <div className="space-y-3">
                      {SUPPLY_STAGES.map((stage, index) => {
                        const StageIcon = stage.icon;
                        const isStageCompleted = index <= currentStageIndex;
                        const isCurrent = index === currentStageIndex;
                        
                        // Determine staff info for each stage
                        let stageStaffInfo: string | null = null;
                        if (isStageCompleted && staffName) {
                          if (stage.key === 'received') {
                            stageStaffInfo = `Assigned to ${staffName}`;
                          } else if (stage.key === 'picking') {
                            stageStaffInfo = `Being picked by ${staffName}`;
                          } else if (stage.key === 'ready') {
                            stageStaffInfo = `Prepared by ${staffName}`;
                          } else if (stage.key === 'completed' && request.completed_by) {
                            const fulfillerName = formatStaffName(request.completed_by, true);
                            const completedDate = request.fulfilled_at 
                              ? format(new Date(request.fulfilled_at), 'MMM d, yyyy')
                              : null;
                            stageStaffInfo = `Fulfilled by ${fulfillerName}${completedDate ? ` on ${completedDate}` : ''}`;
                          }
                        }

                        return (
                          <div key={stage.key} className="flex items-center gap-3">
                            {/* Icon */}
                            <div
                              className={`
                                w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all
                                ${isStageCompleted 
                                  ? 'bg-primary text-primary-foreground' 
                                  : 'bg-muted text-muted-foreground'
                                }
                                ${isCurrent ? 'ring-4 ring-primary/30 scale-110' : ''}
                              `}
                            >
                              <StageIcon className="h-5 w-5" />
                            </div>
                            
                            {/* Label and Staff Info */}
                            <div className="flex-1">
                              <div className={`text-sm ${isCurrent ? 'font-semibold' : isStageCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>
                                {stage.label}
                              </div>
                              {isCurrent && !stageStaffInfo && (
                                <div className="text-xs text-primary mt-0.5">Current Status</div>
                              )}
                              {stageStaffInfo && (
                                <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  {stageStaffInfo}
                                </div>
                              )}
                            </div>
                            
                            {/* Checkmark for completed */}
                            {isStageCompleted && !isCurrent && (
                              <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Request Items */}
                  {itemCount > 0 && (
                    <div>
                      <h4 className="font-medium mb-2 text-sm">Items Requested</h4>
                      <div className="space-y-1">
                        {request.supply_request_items?.slice(0, 5).map((item: Record<string, unknown>, idx: number) => (
                          <div key={idx} className="text-sm text-muted-foreground flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                            <span>
                              {item.inventory_items?.name || 'Item'} × {item.quantity_requested || 1}
                            </span>
                          </div>
                        ))}
                        {itemCount > 5 && (
                          <div className="text-sm text-muted-foreground italic">
                            +{itemCount - 5} more items
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {request.notes && (
                    <div>
                      <h4 className="font-medium mb-2 text-sm">Notes</h4>
                      <p className="text-sm text-muted-foreground">{request.notes}</p>
                    </div>
                  )}

                  {/* Completed Summary with Fulfiller Info */}
                  {request.status === 'completed' && (
                    <div className="bg-success/10 border border-success/30 rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2 text-success-foreground">
                          <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="font-semibold">Request Completed</div>
                            {request.completed_by && (
                              <div className="text-sm mt-1 flex items-center gap-1">
                                <User className="h-3 w-3" />
                                <span>Fulfilled by: {formatStaffName(request.completed_by, true)}</span>
                              </div>
                            )}
                            {request.fulfilled_at && (
                              <div className="text-xs text-muted-foreground mt-0.5">
                                {format(new Date(request.fulfilled_at), 'MMM d, yyyy \'at\' h:mm a')}
                              </div>
                            )}
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedReceiptRequestId(request.id);
                          }}
                          className="flex-shrink-0"
                        >
                          <Receipt className="h-4 w-4 mr-2" />
                          Receipt
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-4 border-t">
                    {/* Cancel button - only for pending/submitted/received */}
                    {['pending', 'submitted', 'received'].includes(request.status) && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="flex-1">
                            <X className="h-4 w-4 mr-2" />
                            Cancel Request
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Cancel Supply Request?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will cancel your request for "{request.title}". 
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Keep Request</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={(e) => {
                                e.stopPropagation();
                                cancelRequestMutation.mutate(request.id);
                              }}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Yes, Cancel Request
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}

                    {/* Archive button - only for completed */}
                    {request.status === 'completed' && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          archiveRequestMutation.mutate(request.id);
                        }}
                        className="flex-1"
                      >
                        <Archive className="h-4 w-4 mr-2" />
                        Archive
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>

      {/* Receipt Dialog */}
      {selectedReceiptRequestId && receipts && receipts.length > 0 && (
        <ReceiptDialog
          open={!!selectedReceiptRequestId}
          onOpenChange={(open) => !open && setSelectedReceiptRequestId(null)}
          receiptData={receipts[0].pdf_data as unknown}
        />
      )}
    </Card>
  );
}
