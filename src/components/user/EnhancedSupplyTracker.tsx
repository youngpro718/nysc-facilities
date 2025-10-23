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
  Receipt
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { QuickOrderGrid } from '@/components/supply/QuickOrderGrid';
import { ReceiptDialog } from '@/components/supply/ReceiptDialog';
import { useSupplyReceipts } from '@/hooks/useSupplyReceipts';
import { createReceiptData } from '@/lib/receiptUtils';

interface SupplyRequest {
  id: string;
  title: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  supply_request_items?: any[];
  notes?: string;
}

interface EnhancedSupplyTrackerProps {
  requests: SupplyRequest[];
  featured?: boolean;
}

const SUPPLY_STAGES = [
  { key: 'pending', label: 'Submitted', icon: ClipboardCheck, color: 'text-yellow-600' },
  { key: 'under_review', label: 'Review', icon: Clock, color: 'text-blue-600' },
  { key: 'approved', label: 'Approved', icon: CheckCircle, color: 'text-green-600' },
  { key: 'picking', label: 'Picking', icon: Box, color: 'text-purple-600' },
  { key: 'packing', label: 'Packing', icon: Package, color: 'text-indigo-600' },
  { key: 'ready', label: 'Ready', icon: CheckCircle, color: 'text-green-600' },
  { key: 'fulfilled', label: 'Delivered', icon: Truck, color: 'text-emerald-600' },
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
  const [expandedRequest, setExpandedRequest] = useState<string | null>(
    requests.length > 0 ? requests[0].id : null
  );
  const [showNewRequestForm, setShowNewRequestForm] = useState(false);
  const [selectedReceiptRequestId, setSelectedReceiptRequestId] = useState<string | null>(null);
  const { data: receipts } = useSupplyReceipts(selectedReceiptRequestId || undefined);

  const activeRequests = requests.filter(r => 
    !['fulfilled', 'rejected', 'cancelled'].includes(r.status)
  );

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
              <DialogTrigger asChild>
                <Button size="sm">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Quick Order
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Quick Order Supplies</DialogTitle>
                </DialogHeader>
                <QuickOrderGrid />
              </DialogContent>
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
          <Dialog open={showNewRequestForm} onOpenChange={setShowNewRequestForm}>
            <DialogTrigger asChild>
              <Button 
                size="sm" 
                className="flex-shrink-0 touch-manipulation min-h-[44px] active:scale-95 transition-transform"
              >
                <ShoppingCart className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Quick Order</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Quick Order Supplies</DialogTitle>
              </DialogHeader>
              <QuickOrderGrid />
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 px-2 sm:px-6 py-3">
        {requests.map((request) => {
          const isExpanded = expandedRequest === request.id;
          const currentStageIndex = getCurrentStageIndex(request.status);
          const progress = getStageProgress(request.status);
          const isActive = !['fulfilled', 'rejected', 'cancelled'].includes(request.status);
          const itemCount = request.supply_request_items?.length || 0;

          return (
            <div
              key={request.id}
              className={`border rounded-lg transition-all touch-manipulation ${
                isActive ? 'border-primary/30 bg-primary/5' : 'border-border'
              }`}
            >
              {/* Header - iPhone Optimized with larger touch targets */}
              <div
                className="p-4 cursor-pointer active:bg-accent/70 transition-all duration-150 touch-manipulation"
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
                    {isActive && (
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
                  {/* Vertical Timeline - iPhone Optimized */}
                  <div>
                    <h4 className="font-medium mb-4 text-sm">Request Progress</h4>
                    <div className="space-y-3">
                      {SUPPLY_STAGES.map((stage, index) => {
                        const StageIcon = stage.icon;
                        const isCompleted = index <= currentStageIndex;
                        const isCurrent = index === currentStageIndex;

                        return (
                          <div key={stage.key} className="flex items-center gap-3">
                            {/* Icon */}
                            <div
                              className={`
                                w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all
                                ${isCompleted 
                                  ? 'bg-primary text-primary-foreground' 
                                  : 'bg-muted text-muted-foreground'
                                }
                                ${isCurrent ? 'ring-4 ring-primary/30 scale-110' : ''}
                              `}
                            >
                              <StageIcon className="h-5 w-5" />
                            </div>
                            
                            {/* Label */}
                            <div className="flex-1">
                              <div className={`text-sm ${isCurrent ? 'font-semibold' : 'text-muted-foreground'}`}>
                                {stage.label}
                              </div>
                              {isCurrent && (
                                <div className="text-xs text-primary mt-0.5">Current Status</div>
                              )}
                            </div>
                            
                            {/* Checkmark for completed */}
                            {isCompleted && !isCurrent && (
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
                        {request.supply_request_items?.slice(0, 5).map((item: any, idx: number) => (
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

                  {/* Status Message */}
                  {isActive && request.status === 'ready' && (
                    <div className="bg-success/10 border border-success/30 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-success-foreground">
                        <CheckCircle className="h-5 w-5" />
                        <div>
                          <div className="font-semibold">Ready for Pickup!</div>
                          <div className="text-sm">
                            Your supplies are ready. Please visit the supply room to collect them.
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {request.status === 'fulfilled' && (
                    <div className="bg-success/10 border border-success/30 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-success-foreground">
                          <CheckCircle className="h-5 w-5" />
                          <div className="font-semibold">Request Completed</div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedReceiptRequestId(request.id)}
                        >
                          <Receipt className="h-4 w-4 mr-2" />
                          View Receipt
                        </Button>
                      </div>
                    </div>
                  )}
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
          receiptData={receipts[0].pdf_data as any}
        />
      )}
    </Card>
  );
}
