import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Package, CheckCircle2, XCircle, AlertCircle, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ReceiveCompleteDialog } from './ReceiveCompleteDialog';
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
          supply_request_items (
            *,
            inventory_items (
              name,
              unit
            )
          )
        `)
        .order('created_at', { ascending: false });

      // Filter based on user role
      if (userRole === 'requester') {
        query = query.eq('requester_id', user?.id);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      
      setRequests(data || []);
      
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast({
        title: "Error",
        description: "Failed to load supply requests",
        variant: "destructive",
      });
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

  const pendingRequests = requests.filter((r: any) => r.status === 'pending') || [];
  const completedRequests = requests.filter((r: any) => r.status === 'completed') || [];

  const handleReceive = (request: any) => {
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

  return (
    <>
      <div className="space-y-6">
        {/* Pending Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Pending Orders
              {pendingRequests.length > 0 && (
                <Badge variant="secondary">{pendingRequests.length}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingRequests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p>No pending orders</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingRequests.map((request: any) => (
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
                        </div>
                        
                        <div className="text-sm text-muted-foreground">
                          <span className="font-medium">
                            {request.profiles?.first_name} {request.profiles?.last_name}
                          </span>
                          {request.profiles?.department && ` - ${request.profiles.department}`}
                        </div>

                        <div className="text-sm">
                          <span className="font-medium">Items:</span>
                          <ul className="mt-1 ml-4 list-disc">
                            {request.supply_request_items?.slice(0, 3).map((item: any, idx: number) => (
                              <li key={idx}>
                                {item.inventory_items?.name}: {item.quantity_requested} {item.inventory_items?.unit}
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

                      {isSupplyStaff && (
                        <Button onClick={() => handleReceive(request)}>
                          Receive & Complete
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

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
      />
    </>
  );
}