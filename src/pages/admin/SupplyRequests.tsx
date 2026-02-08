import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Package, Clock, CheckCircle, XCircle, User, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { useToast } from "@/hooks/use-toast";
import { getSupplyRequests } from "@/lib/supabase";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { SupplyRequestActions } from "@/components/supply/SupplyRequestActions";
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
  submitted: { icon: Clock, color: "text-blue-600 bg-blue-50", label: "Submitted" },
  pending_approval: { icon: AlertTriangle, color: "text-orange-600 bg-orange-50", label: "Pending Approval" },
  approved: { icon: CheckCircle, color: "text-green-600 bg-green-50", label: "Approved" },
  rejected: { icon: XCircle, color: "text-red-600 bg-red-50", label: "Rejected" },
  received: { icon: Package, color: "text-blue-600 bg-blue-50", label: "Received" },
  processing: { icon: Clock, color: "text-yellow-600 bg-yellow-50", label: "Processing" },
  ready: { icon: CheckCircle, color: "text-green-600 bg-green-50", label: "Ready for Pickup" },
  delivered: { icon: CheckCircle, color: "text-purple-600 bg-purple-50", label: "Delivered" },
  completed: { icon: CheckCircle, color: "text-gray-600 bg-gray-50", label: "Completed" },
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
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchParams] = useSearchParams();
  const highlightedId = searchParams.get('id');
  const { toast } = useToast();

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const data = await getSupplyRequests();
      setRequests(data as unknown);
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

  const filteredRequests = requests.filter(request => {
    const matchesStatus = filterStatus === "all" || request.status === filterStatus;
    const matchesPriority = filterPriority === "all" || request.priority === filterPriority;
    const matchesSearch = searchQuery === "" || 
      request.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (request.profiles?.first_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (request.profiles?.last_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (request.profiles?.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.supply_request_items.some(item => 
        item.inventory_items.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    
    return matchesStatus && matchesPriority && matchesSearch;
  });

  return (
    <PageContainer>
      <Breadcrumb />
      <PageHeader
        title="Supply Request History" 
        description="View and audit all supply requests. Approvals are handled from the Admin Dashboard."
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
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="pending_approval">Pending Approval</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="received">Received</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="ready">Ready</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
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
                          Requested by {(request.profiles?.first_name || 'Unknown')} {(request.profiles?.last_name || '')}
                          {request.profiles?.department ? ` (${request.profiles.department})` : ''}
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
                      <SupplyRequestActions
                        requestId={request.id}
                        requestTitle={request.title}
                        onDeleted={fetchRequests}
                      />
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
                      {(request.supply_request_items || []).map((item) => (
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
                            {item.quantity_approved !== undefined && item.quantity_approved !== null && (
                              <span className="ml-2 text-green-600">
                                | Approved: {item.quantity_approved}
                              </span>
                            )}
                            {item.quantity_fulfilled !== undefined && item.quantity_fulfilled !== null && (
                              <span className="ml-2 text-blue-600">
                                | Fulfilled: {item.quantity_fulfilled}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="font-medium text-sm text-muted-foreground mb-1">Contact</p>
                      <p className="text-sm">{request.profiles?.email || '—'}</p>
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
                          <p className="text-sm bg-green-50 dark:bg-green-900/30 text-green-900 dark:text-green-100 p-2 rounded">{request.approval_notes}</p>
                        </div>
                      )}
                      {request.fulfillment_notes && (
                        <div>
                          <p className="font-medium text-sm text-muted-foreground mb-1">Fulfillment Notes</p>
                          <p className="text-sm bg-blue-50 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100 p-2 rounded">{request.fulfillment_notes}</p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="pt-3 border-t text-sm text-muted-foreground space-y-1">
                    <p>Submitted: {format(new Date(request.created_at), "MMM d, yyyy 'at' h:mm a")}</p>
                    {request.approved_at && (
                      <p>Approved: {format(new Date(request.approved_at), "MMM d, yyyy 'at' h:mm a")}</p>
                    )}
                    {request.fulfilled_at && (
                      <p>Fulfilled: {format(new Date(request.fulfilled_at), "MMM d, yyyy 'at' h:mm a")}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
}
