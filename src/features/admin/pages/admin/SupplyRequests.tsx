// Admin Supply Requests — audit view of all supply requests
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Package, Clock, CheckCircle, XCircle, AlertTriangle, ChevronDown, ChevronUp, ShoppingCart, Search, Mail } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { useToast } from "@shared/hooks/use-toast";
import { getSupplyRequests } from '@features/supply/services/unifiedSupplyService';
import { SupplyRequestActions } from "@features/supply/components/supply/SupplyRequestActions";
import { SupplyEmailSettingsCard } from "@features/admin/components/admin/SupplyEmailSettingsCard";
import { supabase } from "@/lib/supabase";
import { logger } from "@/lib/logger";

interface SupplyEmailDelivery {
  id: string;
  request_id: string | null;
  email_type: string;
  recipient: string;
  sender: string;
  subject: string;
  provider_email_id: string | null;
  provider_message_id: string | null;
  status: string;
  error_detail: string | null;
  created_at: string;
  sent_at: string | null;
  delivered_at: string | null;
}

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
  email_deliveries?: SupplyEmailDelivery[];
}

const statusConfig: Record<string, { icon: typeof Clock; label: string; border: string }> = {
  submitted: { icon: Clock, label: "Submitted", border: "border-l-blue-500" },
  pending_approval: { icon: AlertTriangle, label: "Pending Approval", border: "border-l-amber-500" },
  approved: { icon: CheckCircle, label: "Approved", border: "border-l-green-500" },
  rejected: { icon: XCircle, label: "Rejected", border: "border-l-destructive" },
  received: { icon: Package, label: "Received", border: "border-l-blue-500" },
  processing: { icon: Clock, label: "Processing", border: "border-l-amber-500" },
  picking: { icon: Package, label: "Picking", border: "border-l-slate-500" },
  ready: { icon: CheckCircle, label: "Ready for Pickup", border: "border-l-green-500" },
  delivered: { icon: CheckCircle, label: "Delivered", border: "border-l-green-500" },
  completed: { icon: CheckCircle, label: "Completed", border: "border-l-muted-foreground" },
  cancelled: { icon: XCircle, label: "Cancelled", border: "border-l-muted-foreground" },
};

const priorityDot: Record<string, string> = {
  urgent: "bg-destructive",
  high: "bg-destructive",
  medium: "bg-amber-500",
  low: "bg-muted-foreground/50",
};

const emailStatusVariant = (status?: string): "default" | "secondary" | "destructive" | "outline" => {
  if (status === "delivered") return "default";
  if (status === "failed" || status === "bounced") return "destructive";
  if (status === "sent" || status === "delivery_delayed") return "secondary";
  return "outline";
};

const getLatestTeamDelivery = (request: SupplyRequestWithUser) => {
  return (request.email_deliveries || [])
    .filter((delivery) => delivery.email_type === 'new_request_team')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
};

export default function AdminSupplyRequests() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<SupplyRequestWithUser[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const [searchParams] = useSearchParams();
  const highlightedId = searchParams.get('id');
  const { toast } = useToast();

  useEffect(() => {
    fetchRequests();
  }, []);

  // Auto-expand highlighted request
  useEffect(() => {
    if (highlightedId) {
      setExpandedIds(prev => new Set(prev).add(highlightedId));
    }
  }, [highlightedId]);

  const fetchRequests = async () => {
    try {
      const data = await getSupplyRequests();
      const baseRequests = (data || []) as SupplyRequestWithUser[];
      const requestIds = baseRequests.map((request) => request.id);
      let deliveriesByRequest = new Map<string, SupplyEmailDelivery[]>();

      if (requestIds.length > 0) {
        const { data: deliveries, error: deliveriesError } = await (supabase as any)
          .from('supply_email_deliveries')
          .select('id, request_id, email_type, recipient, sender, subject, provider_email_id, provider_message_id, status, error_detail, created_at, sent_at, delivered_at')
          .in('request_id', requestIds)
          .order('created_at', { ascending: false });

        if (deliveriesError) {
          logger.error('Failed to fetch supply email deliveries', deliveriesError);
        } else {
          deliveriesByRequest = (deliveries || []).reduce((map: Map<string, SupplyEmailDelivery[]>, delivery: SupplyEmailDelivery) => {
            if (!delivery.request_id) return map;
            const current = map.get(delivery.request_id) || [];
            current.push(delivery);
            map.set(delivery.request_id, current);
            return map;
          }, new Map<string, SupplyEmailDelivery[]>());
        }
      }

      setRequests(baseRequests.map((request) => ({
        ...request,
        email_deliveries: deliveriesByRequest.get(request.id) || [],
      })));
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

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
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
      <PageHeader
        title="Supply Requests"
        description="View and manage all supply requests"
      >
        <Button
          variant="outline"
          onClick={() => navigate('/admin/printers')}
          className="touch-target min-h-[44px] mr-2"
        >
          <Package className="h-4 w-4 mr-2" />
          Printers & Toners
        </Button>
        <Button
          onClick={() => navigate('/request/supplies')}
          className="touch-target min-h-[44px] transition-transform"
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          Order Supplies
        </Button>
      </PageHeader>
      <div className="mb-4">
        <SupplyEmailSettingsCard onTestSent={fetchRequests} />
      </div>

      {/* Pending approval banner */}

      {(() => {
        const pendingCount = requests.filter(r => r.status === 'pending_approval').length;
        if (pendingCount === 0 || filterStatus === 'pending_approval') return null;
        return (
          <div className="mb-4 flex items-center justify-between gap-3 rounded-md border border-amber-500/40 bg-amber-50 dark:bg-amber-950/30 px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-foreground">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <span>
                <strong>{pendingCount}</strong> supply request{pendingCount !== 1 ? 's are' : ' is'} waiting for approval.
              </span>
            </div>
            <Button size="sm" variant="outline" onClick={() => setFilterStatus('pending_approval')}>
              Review
            </Button>
          </div>
        );
      })()}

      {/* Filters */}

      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, item, or requester..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[calc(50%-0.25rem)] sm:w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="pending_approval">Pending Approval</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="received">Received</SelectItem>
            <SelectItem value="picking">Picking</SelectItem>
            <SelectItem value="ready">Ready</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="w-[calc(50%-0.25rem)] sm:w-36">
            <SelectValue placeholder="Priority" />
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

      {/* Results count */}
      {!isLoading && (
        <p className="text-xs text-muted-foreground mb-3">
          {filteredRequests.length} request{filteredRequests.length !== 1 ? 's' : ''}
        </p>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Loading requests...</div>
        </div>
      ) : filteredRequests.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center text-center py-12 px-4">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No supply requests</h3>
            <p className="text-sm text-muted-foreground mb-6">
              {searchQuery || filterStatus !== "all" || filterPriority !== "all"
                ? "No requests match your current filters."
                : "No supply requests have been submitted yet."}
            </p>
            <Button onClick={() => navigate('/request/supplies')}>
              <ShoppingCart className="h-4 w-4 mr-2" />
              Order Supplies
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredRequests.map((request) => {
            const config = statusConfig[request.status] || statusConfig.submitted;
            const StatusIcon = config.icon;
            const isExpanded = expandedIds.has(request.id);
            const isHighlighted = request.id === highlightedId;
            const itemCount = request.supply_request_items?.length || 0;
            const dotColor = priorityDot[request.priority] || priorityDot.low;
            const latestTeamDelivery = getLatestTeamDelivery(request);

            return (
              <Card
                key={request.id}
                className={`border-l-2 ${config.border} transition-all ${
                  isHighlighted ? 'ring-2 ring-primary' : ''
                }`}
              >
                {/* Compact Summary Row */}
                <div
                  className="flex items-center gap-3 p-3 cursor-pointer hover:bg-accent/50 transition-colors active:bg-accent/70 touch-manipulation"
                  onClick={() => toggleExpand(request.id)}
                >
                  <StatusIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">{request.title}</span>
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dotColor}`} />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      <span>{request.profiles?.first_name} {request.profiles?.last_name}</span>
                      <span>·</span>
                      <span>{itemCount} item{itemCount !== 1 ? 's' : ''}</span>
                      <span>·</span>
                      <span>{formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}</span>
                    </div>
                  </div>

                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 flex-shrink-0">
                    {config.label}
                  </Badge>
                  {latestTeamDelivery && (
                    <Badge variant={emailStatusVariant(latestTeamDelivery.status)} className="hidden sm:inline-flex text-[10px] px-1.5 py-0.5 flex-shrink-0">
                      <Mail className="h-3 w-3 mr-1" />
                      {latestTeamDelivery.status}
                    </Badge>
                  )}

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <SupplyRequestActions
                      requestId={request.id}
                      requestTitle={request.title}
                      onDeleted={fetchRequests}
                    />
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
                    {request.description && (
                      <div>
                        <p className="font-medium text-xs text-muted-foreground mb-1">Description</p>
                        <p className="text-sm">{request.description}</p>
                      </div>
                    )}

                    {request.justification && (
                      <div>
                        <p className="font-medium text-xs text-muted-foreground mb-1">Justification</p>
                        <p className="text-sm">{request.justification}</p>
                      </div>
                    )}

                    <div>
                      <p className="font-medium text-xs text-muted-foreground mb-2">Items</p>
                      <div className="space-y-1.5">
                        {(request.supply_request_items || []).map((item) => (
                          <div key={item.id} className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded">
                            <div className="flex items-center gap-2">
                              <span>{item.inventory_items.name}</span>
                              {item.inventory_items.inventory_categories && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] px-1"
                                  style={{
                                    color: item.inventory_items.inventory_categories.color,
                                    borderColor: item.inventory_items.inventory_categories.color + '40'
                                  }}
                                >
                                  {item.inventory_items.inventory_categories.name}
                                </Badge>
                              )}
                            </div>
                            <span className="text-muted-foreground text-xs">
                              ×{item.quantity_requested}
                              {item.quantity_approved != null && (
                                <span className="text-green-600 dark:text-green-400 ml-1">✓{item.quantity_approved}</span>
                              )}
                              {item.quantity_fulfilled != null && (
                                <span className="text-blue-600 dark:text-blue-400 ml-1">⬇{item.quantity_fulfilled}</span>
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Contact</p>
                        <p>{request.profiles?.email || '—'}</p>
                      </div>
                      {request.profiles?.department && (
                        <div>
                          <p className="text-xs text-muted-foreground">Department</p>
                          <p>{request.profiles.department}</p>
                        </div>
                      )}
                      {request.requested_delivery_date && (
                        <div>
                          <p className="text-xs text-muted-foreground">Delivery Date</p>
                          <p>{format(new Date(request.requested_delivery_date), "MMM d, yyyy")}</p>
                        </div>
                      )}
                      {request.delivery_location && (
                        <div>
                          <p className="text-xs text-muted-foreground">Location</p>
                          <p>{request.delivery_location}</p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <p className="font-medium text-xs text-muted-foreground">Email delivery</p>
                      {request.email_deliveries && request.email_deliveries.length > 0 ? (
                        <div className="space-y-2">
                          {request.email_deliveries.map((delivery) => (
                            <div key={delivery.id} className="rounded-md border bg-background/60 p-3 text-sm">
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge variant={emailStatusVariant(delivery.status)} className="capitalize">
                                  {delivery.status.replace(/_/g, ' ')}
                                </Badge>
                                <span className="font-medium">
                                  {delivery.email_type === 'new_request_team' ? 'Supply team alert' : delivery.email_type.replace(/_/g, ' ')}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(delivery.created_at), "MMM d, h:mm a")}
                                </span>
                              </div>
                              <div className="mt-2 grid grid-cols-1 gap-1 text-xs text-muted-foreground sm:grid-cols-2">
                                <p><span className="text-foreground">To:</span> {delivery.recipient}</p>
                                <p><span className="text-foreground">From:</span> {delivery.sender}</p>
                                {delivery.provider_email_id && (
                                  <p className="break-all"><span className="text-foreground">Resend ID:</span> {delivery.provider_email_id}</p>
                                )}
                                {delivery.provider_message_id && (
                                  <p className="break-all"><span className="text-foreground">Message ID:</span> {delivery.provider_message_id}</p>
                                )}
                                {delivery.error_detail && (
                                  <p className="break-words text-destructive sm:col-span-2">{delivery.error_detail}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">No delivery record yet for this request.</p>
                      )}
                    </div>

                    {(request.approval_notes || request.fulfillment_notes) && (
                      <div className="space-y-2">
                        {request.approval_notes && (
                          <div className="text-sm bg-green-50 dark:bg-green-950/30 text-green-900 dark:text-green-100 p-2 rounded">
                            <span className="font-medium text-xs">Approval: </span>{request.approval_notes}
                          </div>
                        )}
                        {request.fulfillment_notes && (
                          <div className="text-sm bg-blue-50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-100 p-2 rounded">
                            <span className="font-medium text-xs">Fulfillment notes: </span>{request.fulfillment_notes}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="text-xs text-muted-foreground pt-2 border-t space-y-0.5">
                      <p>Submitted {format(new Date(request.created_at), "MMM d, yyyy 'at' h:mm a")}</p>
                      {request.approved_at && (
                        <p>Approved {format(new Date(request.approved_at), "MMM d, yyyy 'at' h:mm a")}</p>
                      )}
                      {request.fulfilled_at && (
                        <p>Fulfilled {format(new Date(request.fulfilled_at), "MMM d, yyyy 'at' h:mm a")}</p>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
}
