import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Package, Clock, CheckCircle, XCircle, User, Calendar, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { FulfillmentWorkflow } from "@/components/supply/FulfillmentWorkflow";
import { useToast } from "@/hooks/use-toast";
import { getSupplyRequests, updateSupplyRequestStatus, updateSupplyRequestItems } from "@/services/supabase/supplyRequestService";

interface SupplyRequestWithUser {
  id: string;
  title: string;
  description?: string;
  justification: string;
  priority: string;
  status: string;
  requested_delivery_date?: string;
  delivery_location?: string;
  approved_by?: string;
  fulfilled_by?: string;
  approval_notes?: string;
  fulfillment_notes?: string;
  created_at: string;
  updated_at: string;
  approved_at?: string;
  fulfilled_at?: string;
  requester_id: string;
  profiles: {
    first_name: string;
    last_name: string;
    email: string;
    department?: string;
  };
  supply_request_items: Array<{
    id: string;
    item_id: string;
    quantity_requested: number;
    quantity_approved?: number;
    quantity_fulfilled?: number;
    notes?: string;
    inventory_items: {
      name: string;
      unit?: string;
      quantity: number;
      inventory_categories?: {
        name: string;
        color: string;
      };
    };
  }>;
}

const statusConfig = {
  pending: { icon: Clock, color: "text-yellow-600 bg-yellow-50", label: "Pending" },
  under_review: { icon: AlertTriangle, color: "text-blue-600 bg-blue-50", label: "Under Review" },
  approved: { icon: CheckCircle, color: "text-green-600 bg-green-50", label: "Approved" },
  rejected: { icon: XCircle, color: "text-red-600 bg-red-50", label: "Rejected" },
  fulfilled: { icon: CheckCircle, color: "text-purple-600 bg-purple-50", label: "Fulfilled" },
  cancelled: { icon: XCircle, color: "text-gray-600 bg-gray-50", label: "Cancelled" },
};

const priorityConfig = {
  low: { color: "text-green-600 bg-green-50", label: "Low" },
  medium: { color: "text-yellow-600 bg-yellow-50", label: "Medium" },
  high: { color: "text-orange-600 bg-orange-50", label: "High" },
  urgent: { color: "text-red-600 bg-red-50", label: "Urgent" },
};

export default function AdminSupplyRequests() {
  const [requests, setRequests] = useState<SupplyRequestWithUser[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<SupplyRequestWithUser | null>(null);
  const [actionType, setActionType] = useState<'review' | 'approve' | 'reject' | null>(null);
  const [fulfillmentWorkflowOpen, setFulfillmentWorkflowOpen] = useState(false);
  const [fulfillmentRequest, setFulfillmentRequest] = useState<SupplyRequestWithUser | null>(null);
  const [notes, setNotes] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [itemQuantities, setItemQuantities] = useState<Record<string, { approved?: number; fulfilled?: number }>>({});
  
  const [searchParams] = useSearchParams();
  const highlightedId = searchParams.get('id');
  const { toast } = useToast();

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const data = await getSupplyRequests();
      setRequests(data as any);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch supply requests",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedRequest || !actionType) return;

    try {
      let newStatus = selectedRequest.status;
      
      switch (actionType) {
        case 'review':
          newStatus = 'under_review';
          break;
        case 'approve':
          newStatus = 'approved';
          break;
        case 'reject':
          newStatus = 'rejected';
          break;
      }

      await updateSupplyRequestStatus(selectedRequest.id, newStatus, notes);

      // If approving, update item quantities
      if (actionType === 'approve' && Object.keys(itemQuantities).length > 0) {
        const itemUpdates = selectedRequest.supply_request_items.map(item => ({
          item_id: item.item_id,
          quantity_approved: itemQuantities[item.id]?.approved ?? item.quantity_requested,
          notes: item.notes,
        }));

        await updateSupplyRequestItems(selectedRequest.id, itemUpdates);
      }

      toast({
        title: "Success",
        description: `Request ${newStatus.replace('_', ' ')} successfully`,
      });

      fetchRequests();
      setSelectedRequest(null);
      setActionType(null);
      setNotes("");
      setItemQuantities({});

    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to update request status`,
        variant: "destructive",
      });
    }
  };

  const filteredRequests = requests.filter(request => {
    const matchesStatus = filterStatus === "all" || request.status === filterStatus;
    const matchesPriority = filterPriority === "all" || request.priority === filterPriority;
    const matchesSearch = searchQuery === "" || 
      request.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.profiles.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.profiles.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.profiles.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.supply_request_items.some(item => 
        item.inventory_items.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    
    return matchesStatus && matchesPriority && matchesSearch;
  });

  const getAvailableActions = (status: string, request: any) => {
    switch (status) {
      case 'pending':
        return ['review', 'approve', 'reject'];
      case 'under_review':
        return ['approve', 'reject'];
      case 'approved':
        if (request?.work_started_at && !request?.work_completed_at) {
          return ['complete']; // Work in progress
        } else if (!request?.work_started_at) {
          return ['start']; // Ready to start
        }
        return []; // Already completed
      default:
        return [];
    }
  };

  const openActionDialog = (request: SupplyRequestWithUser, action: string) => {
    if (action === 'start' || action === 'complete') {
      setFulfillmentRequest(request);
      setFulfillmentWorkflowOpen(true);
      return;
    }

    setSelectedRequest(request);
    setActionType(action as 'review' | 'approve' | 'reject');
    
    // Initialize item quantities for approval
    if (action === 'approve') {
      const quantities: Record<string, { approved?: number; fulfilled?: number }> = {};
      request.supply_request_items.forEach(item => {
        quantities[item.id] = {
          approved: item.quantity_requested,
        };
      });
      setItemQuantities(quantities);
    }
  };

  const handleFulfillmentSuccess = () => {
    fetchRequests();
    setFulfillmentWorkflowOpen(false);
    setFulfillmentRequest(null);
  };

  return (
    <PageContainer>
      <PageHeader 
        title="Supply Requests Management" 
        description="Review and manage supply requests from staff members"
      >
        <div className="flex gap-2">
          <Input
            placeholder="Search requests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64"
          />
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="under_review">Under Review</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="fulfilled">Fulfilled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </PageHeader>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Loading requests...</div>
        </div>
      ) : filteredRequests.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No supply requests</h3>
            <p className="text-muted-foreground">
              {searchQuery || filterStatus !== "all" || filterPriority !== "all"
                ? "No requests match your current filters." 
                : "No supply requests have been submitted yet."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((request) => {
            const StatusIcon = statusConfig[request.status as keyof typeof statusConfig]?.icon || Clock;
            const statusStyle = statusConfig[request.status as keyof typeof statusConfig]?.color || "text-gray-600 bg-gray-50";
            const priorityStyle = priorityConfig[request.priority as keyof typeof priorityConfig]?.color || "text-gray-600 bg-gray-50";
            const isHighlighted = request.id === highlightedId;
            const availableActions = getAvailableActions(request.status, request);

            return (
              <Card 
                key={request.id} 
                className={`transition-all ${isHighlighted ? 'ring-2 ring-primary border-primary' : ''}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-full ${statusStyle}`}>
                        <StatusIcon className="h-4 w-4" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{request.title}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Requested by {request.profiles.first_name} {request.profiles.last_name}
                          {request.profiles.department && ` (${request.profiles.department})`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={priorityStyle}>
                        {priorityConfig[request.priority as keyof typeof priorityConfig]?.label || request.priority}
                      </Badge>
                      <Badge variant="secondary">
                        {statusConfig[request.status as keyof typeof statusConfig]?.label || request.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {request.description && (
                    <div>
                      <p className="font-medium text-sm text-muted-foreground mb-1">Description</p>
                      <p className="text-sm">{request.description}</p>
                    </div>
                  )}

                  <div>
                    <p className="font-medium text-sm text-muted-foreground mb-1">Justification</p>
                    <p className="text-sm">{request.justification}</p>
                  </div>

                  <div>
                    <p className="font-medium text-sm text-muted-foreground mb-2">Requested Items</p>
                    <div className="space-y-2">
                      {request.supply_request_items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-2 bg-muted rounded">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{item.inventory_items.name}</span>
                            {item.inventory_items.inventory_categories && (
                              <Badge 
                                variant="outline" 
                                className="text-xs"
                                style={{ 
                                  color: item.inventory_items.inventory_categories.color,
                                  borderColor: item.inventory_items.inventory_categories.color + '40'
                                }}
                              >
                                {item.inventory_items.inventory_categories.name}
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Requested: {item.quantity_requested} {item.inventory_items.unit || 'units'}
                            {item.quantity_approved && (
                              <span className="ml-2 text-green-600">
                                | Approved: {item.quantity_approved}
                              </span>
                            )}
                            {item.quantity_fulfilled && (
                              <span className="ml-2 text-blue-600">
                                | Fulfilled: {item.quantity_fulfilled}
                              </span>
                            )}
                            <span className="ml-2 text-gray-500">
                              (Available: {item.inventory_items.quantity})
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="font-medium text-sm text-muted-foreground mb-1">Contact</p>
                      <p className="text-sm">{request.profiles.email}</p>
                    </div>
                    
                    {request.requested_delivery_date && (
                      <div>
                        <p className="font-medium text-sm text-muted-foreground mb-1">Delivery Date</p>
                        <p className="text-sm">{format(new Date(request.requested_delivery_date), "MMM d, yyyy")}</p>
                      </div>
                    )}

                    {request.delivery_location && (
                      <div>
                        <p className="font-medium text-sm text-muted-foreground mb-1">Delivery Location</p>
                        <p className="text-sm">{request.delivery_location}</p>
                      </div>
                    )}
                  </div>

                  {(request.approval_notes || request.fulfillment_notes) && (
                    <div className="space-y-2">
                      {request.approval_notes && (
                        <div>
                          <p className="font-medium text-sm text-muted-foreground mb-1">Approval Notes</p>
                          <p className="text-sm bg-green-50 p-2 rounded">{request.approval_notes}</p>
                        </div>
                      )}
                      {request.fulfillment_notes && (
                        <div>
                          <p className="font-medium text-sm text-muted-foreground mb-1">Fulfillment Notes</p>
                          <p className="text-sm bg-blue-50 p-2 rounded">{request.fulfillment_notes}</p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>Submitted: {format(new Date(request.created_at), "MMM d, yyyy 'at' h:mm a")}</p>
                      {request.approved_at && (
                        <p>Approved: {format(new Date(request.approved_at), "MMM d, yyyy 'at' h:mm a")}</p>
                      )}
                      {request.fulfilled_at && (
                        <p>Fulfilled: {format(new Date(request.fulfilled_at), "MMM d, yyyy 'at' h:mm a")}</p>
                      )}
                    </div>

                    {availableActions.length > 0 && (
                      <div className="flex space-x-2">
                        {availableActions.map((action) => (
                          <Button
                            key={action}
                            size="sm"
                            variant={action === 'reject' ? 'destructive' : action === 'review' ? 'outline' : 'default'}
                            onClick={() => openActionDialog(request, action)}
                          >
                            {action === 'review' && <AlertTriangle className="h-4 w-4 mr-1" />}
                            {action === 'approve' && <CheckCircle className="h-4 w-4 mr-1" />}
                            {action === 'reject' && <XCircle className="h-4 w-4 mr-1" />}
                            {action === 'fulfill' && <Package className="h-4 w-4 mr-1" />}
                            {action.charAt(0).toUpperCase() + action.slice(1)}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Action Dialog */}
      <Dialog open={!!selectedRequest && !!actionType} onOpenChange={() => {
        setSelectedRequest(null);
        setActionType(null);
        setNotes("");
        setItemQuantities({});
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {actionType && actionType.charAt(0).toUpperCase() + actionType.slice(1)} Supply Request
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p>
              Are you sure you want to {actionType} this supply request from{' '}
              {selectedRequest?.profiles.first_name} {selectedRequest?.profiles.last_name}?
            </p>

            {/* Item quantities for approve actions */}
            {actionType === 'approve' && selectedRequest && (
              <div>
                <Label className="text-base font-medium">
                  Approve Quantities
                </Label>
                <div className="space-y-3 mt-2">
                  {selectedRequest.supply_request_items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <p className="font-medium">{item.inventory_items.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Requested: {item.quantity_requested} {item.inventory_items.unit || 'units'}
                          <span className="ml-2">| Available: {item.inventory_items.quantity}</span>
                        </p>
                      </div>
                      <div className="w-24">
                        <Input
                          type="number"
                          min="0"
                          max={Math.min(item.quantity_requested, item.inventory_items.quantity)}
                          value={itemQuantities[item.id]?.approved || item.quantity_requested}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 0;
                            setItemQuantities(prev => ({
                              ...prev,
                              [item.id]: {
                                ...prev[item.id],
                                approved: value
                              }
                            }));
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div>
              <Label htmlFor="notes">
                {actionType === 'reject' ? 'Rejection Reason (Required)' : 'Notes (Optional)'}
              </Label>
              <Textarea
                id="notes"
                placeholder={
                  actionType === 'reject' 
                    ? "Please provide a reason for rejection..."
                    : "Add any additional notes..."
                }
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                required={actionType === 'reject'}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setSelectedRequest(null);
              setActionType(null);
              setNotes("");
              setItemQuantities({});
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleStatusUpdate}
              variant={actionType === 'reject' ? 'destructive' : 'default'}
              disabled={actionType === 'reject' && !notes.trim()}
            >
              {actionType && actionType.charAt(0).toUpperCase() + actionType.slice(1)} Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fulfillment Workflow Dialog */}
      <FulfillmentWorkflow
        request={fulfillmentRequest}
        isOpen={fulfillmentWorkflowOpen}
        onClose={() => {
          setFulfillmentWorkflowOpen(false);
          setFulfillmentRequest(null);
        }}
        onSuccess={handleFulfillmentSuccess}
      />
    </PageContainer>
  );
}