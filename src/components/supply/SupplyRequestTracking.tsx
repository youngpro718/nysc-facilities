import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Package, CheckCircle2, XCircle, AlertCircle, Clock, Inbox, User, Gift, UserCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ReceiveCompleteDialog } from './ReceiveCompleteDialog';
import { PickingInterface } from './PickingInterface';
import { InventoryPreviewCard } from './InventoryPreviewCard';
import { SupplyRequestActions } from './SupplyRequestActions';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface SupplyRequestTrackingProps {
  userRole: 'requester' | 'supply_staff' | 'supply_manager';
}

export function SupplyRequestTracking({ userRole }: SupplyRequestTrackingProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pickingDialogOpen, setPickingDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'new' | 'active' | 'ready'>('new');

  useEffect(() => {
    fetchRequests();
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('supply-requests-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'supply_requests'
        },
        () => {
          fetchRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userRole, user]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      
      if (!user?.id) {
        console.warn('No user ID available for fetching supply requests');
        setRequests([]);
        setLoading(false);
        return;
      }

      console.log('Fetching supply requests for:', { userId: user.id, userRole });
      
      let query = supabase
        .from('supply_requests')
        .select(`
          *,
          profiles:requester_id (
            first_name,
            last_name,
            email,
            department
          ),
          fulfiller:assigned_fulfiller_id (
            first_name,
            last_name
          ),
          supply_request_items (
            *,
            inventory_items (
              name,
              sku,
              unit
            )
          )
        `)
        .order('created_at', { ascending: false });

      // Filter based on user role
      if (userRole === 'requester') {
        query = query.eq('requester_id', user.id);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('Supabase error fetching requests:', error);
        throw error;
      }
      
      console.log('Fetched supply requests:', { count: data?.length, data });
      setRequests(data || []);
      
    } catch (error: any) {
      console.error('Error fetching requests:', error);
      toast({
        title: "Error Loading Requests",
        description: error?.message || "Failed to load supply requests. Please try again.",
        variant: "destructive",
      });
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'awaiting_approval':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-blue-600" />;
    }
  };

  const getStatusColor = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'rejected':
        return 'destructive';
      case 'awaiting_approval':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getPriorityColor = (priority: string): "default" | "secondary" | "destructive" => {
    switch (priority) {
      case 'urgent':
        return 'destructive';
      case 'high':
        return 'secondary';
      default:
        return 'default';
    }
  };

  // Filter requests by status
  const newOrders = requests.filter((r: any) => r.status === 'submitted') || [];
  const activeOrders = requests.filter((r: any) => ['received', 'picking'].includes(r.status)) || [];
  const readyOrders = requests.filter((r: any) => r.status === 'ready') || [];
  const completedRequests = requests.filter((r: any) => r.status === 'completed') || [];

  const handleAcceptOrder = async (request: any) => {
    try {
      const { error } = await supabase
        .from('supply_requests')
        .update({
          status: 'received',
          assigned_fulfiller_id: user?.id,
          work_started_at: new Date().toISOString(),
        })
        .eq('id', request.id);

      if (error) throw error;

      toast({
        title: 'Order Accepted',
        description: 'Order assigned to you. Start picking when ready.',
      });
      fetchRequests();
      setActiveTab('active');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to accept order',
        variant: 'destructive',
      });
    }
  };

  const handleStartPicking = (request: any) => {
    setSelectedRequest(request);
    setPickingDialogOpen(true);
  };

  const handleCompleteOrder = (request: any) => {
    setSelectedRequest(request);
    setDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading requests...</span>
      </div>
    );
  }

  const isSupplyStaff = userRole === 'supply_staff' || userRole === 'supply_manager';

  // Calculate picking progress
  const getPickingProgress = (request: any) => {
    const items = request.supply_request_items || [];
    const fulfilled = items.filter((i: any) => i.quantity_fulfilled > 0).length;
    return { fulfilled, total: items.length };
  };

  const renderOrderCard = (request: any, showActions: boolean = true) => {
    const progress = getPickingProgress(request);
    const fulfillerName = request.fulfiller
      ? `${request.fulfiller.first_name} ${request.fulfiller.last_name}`
      : null;

    return (
      <div
        key={request.id}
        className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold">{request.title}</h3>
              <Badge variant={getPriorityColor(request.priority)}>
                {request.priority}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {request.status}
              </Badge>
              {/* Admin delete action */}
              <SupplyRequestActions 
                requestId={request.id}
                requestTitle={request.title}
                onDeleted={fetchRequests}
              />
            </div>
            
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">
                {request.profiles?.first_name} {request.profiles?.last_name}
              </span>
              {request.profiles?.department && ` - ${request.profiles.department}`}
            </div>

            {/* Fulfiller info - NEW */}
            {fulfillerName && (
              <div className="flex items-center gap-2 text-sm">
                <UserCheck className="h-4 w-4 text-primary" />
                <span className="font-medium text-primary">Assigned to: {fulfillerName}</span>
              </div>
            )}

            {/* Progress indicator for picking - NEW */}
            {['received', 'picking'].includes(request.status) && (
              <div className="flex items-center gap-2 text-sm">
                <Package className="h-4 w-4 text-blue-500" />
                <span>Progress: {progress.fulfilled}/{progress.total} items picked</span>
              </div>
            )}

            {/* Started time - NEW */}
            {request.work_started_at && (
              <div className="text-xs text-muted-foreground">
                Started {formatDistanceToNow(new Date(request.work_started_at), { addSuffix: true })}
              </div>
            )}

            <div className="text-sm">
              <span className="font-medium">Items:</span>
              <ul className="mt-1 ml-4 space-y-1">
                {request.supply_request_items?.slice(0, 3).map((item: any, idx: number) => (
                  <li key={idx} className="flex items-center gap-2">
                    {item.inventory_items?.sku && (
                      <Badge variant="outline" className="font-mono text-xs">
                        {item.inventory_items.sku}
                      </Badge>
                    )}
                    <span>
                      {item.inventory_items?.name}: {item.quantity_requested} {item.inventory_items?.unit || 'units'}
                    </span>
                    {item.quantity_fulfilled > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        ✓ {item.quantity_fulfilled} picked
                      </Badge>
                    )}
                  </li>
                ))}
                {(request.supply_request_items?.length || 0) > 3 && (
                  <li className="text-muted-foreground">
                    +{request.supply_request_items.length - 3} more items
                  </li>
                )}
              </ul>
            </div>

            <div className="text-sm text-muted-foreground">
              Submitted {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
            </div>
          </div>

          {isSupplyStaff && showActions && (
            <div className="flex flex-col gap-2">
              {request.status === 'submitted' && (
                <Button 
                  onClick={() => handleAcceptOrder(request)}
                  size="lg"
                  className="min-h-12 min-w-32"
                >
                  Accept Order
                </Button>
              )}
              {request.status === 'received' && (
                <Button 
                  onClick={() => handleStartPicking(request)}
                  size="lg"
                  className="min-h-12 min-w-32"
                >
                  Start Picking
                </Button>
              )}
              {request.status === 'picking' && (
                <Button 
                  onClick={() => handleStartPicking(request)}
                  size="lg"
                  variant="outline"
                  className="min-h-12 min-w-32"
                >
                  Continue Picking
                </Button>
              )}
              {request.status === 'ready' && (
                <Button 
                  onClick={() => handleCompleteOrder(request)}
                  size="lg"
                  className="min-h-12 min-w-36"
                >
                  Complete Order
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="space-y-6">
        {isSupplyStaff ? (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="new" className="relative">
                <Inbox className="h-4 w-4 mr-2" />
                New Orders
                {newOrders.length > 0 && (
                  <Badge variant="destructive" className="ml-2 h-5 min-w-5 px-1">
                    {newOrders.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="active" className="relative">
                <User className="h-4 w-4 mr-2" />
                My Orders
                {activeOrders.length > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 min-w-5 px-1">
                    {activeOrders.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="ready">
                <Gift className="h-4 w-4 mr-2" />
                Ready
                {readyOrders.length > 0 && (
                  <Badge variant="default" className="ml-2 h-5 min-w-5 px-1">
                    {readyOrders.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="new" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>New Orders</CardTitle>
                </CardHeader>
                <CardContent>
                  {newOrders.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Inbox className="h-12 w-12 mx-auto mb-3 opacity-20" />
                      <p>No new orders</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {newOrders.map((request: any) => renderOrderCard(request))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="active" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>My Active Orders</CardTitle>
                </CardHeader>
                <CardContent>
                  {activeOrders.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <User className="h-12 w-12 mx-auto mb-3 opacity-20" />
                      <p>No active orders</p>
                      <p className="text-sm mt-1">Accept orders from the "New Orders" tab</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {activeOrders.map((request: any) => renderOrderCard(request))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ready" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Ready for Pickup</CardTitle>
                </CardHeader>
                <CardContent>
                  {readyOrders.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Gift className="h-12 w-12 mx-auto mb-3 opacity-20" />
                      <p>No orders ready for pickup</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {readyOrders.map((request: any) => renderOrderCard(request))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                My Supply Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              {requests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p>No supply requests</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {requests.map((request: any) => renderOrderCard(request, false))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Completed Orders (Collapsible) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Completed Orders
              {completedRequests.length > 0 && (
                <Badge variant="outline">{completedRequests.length}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {completedRequests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p>No completed orders yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {completedRequests.slice(0, 5).map((request: any) => (
                  <div
                    key={request.id}
                    className="border rounded-lg p-3 bg-accent/20"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{request.title}</span>
                          <Badge variant="outline" className="text-xs">
                            {request.supply_request_items?.length} items
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {request.profiles?.first_name} {request.profiles?.last_name}
                          {request.completed_at && (
                            <span className="ml-2">
                              • Completed {formatDistanceToNow(new Date(request.completed_at), { addSuffix: true })}
                            </span>
                          )}
                        </div>
                      </div>
                      <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                    </div>
                    {request.fulfillment_notes && (
                      <p className="text-xs text-muted-foreground mt-2 italic">
                        Note: {request.fulfillment_notes}
                      </p>
                    )}
                  </div>
                ))}
                {completedRequests.length > 5 && (
                  <p className="text-sm text-muted-foreground text-center pt-2">
                    +{completedRequests.length - 5} more completed orders
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ReceiveCompleteDialog
        request={selectedRequest}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        userId={user?.id || ''}
      />

      <Dialog open={pickingDialogOpen} onOpenChange={setPickingDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Pick Items</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <PickingInterface
              request={selectedRequest}
              onComplete={() => {
                setPickingDialogOpen(false);
                fetchRequests();
                setActiveTab('ready');
              }}
              onCancel={() => setPickingDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}