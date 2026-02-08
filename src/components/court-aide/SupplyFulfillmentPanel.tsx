/**
 * SupplyFulfillmentPanel Component
 * 
 * Shows supply requests that need fulfillment for Court Aides
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Package, User, Clock, CheckCircle, PackageCheck, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

interface SupplyRequest {
  id: string;
  status: string;
  created_at: string;
  priority: string;
  notes: string | null;
  requester_id: string;
  profiles: {
    first_name: string;
    last_name: string;
    department: string | null;
  } | null;
  supply_request_items: {
    quantity_requested: number;
    inventory_items: {
      name: string;
      unit: string;
    } | null;
  }[];
}

export function SupplyFulfillmentPanel() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch pending/in-progress supply requests
  const { data: requests, isLoading } = useQuery({
    queryKey: ['supply-fulfillment-queue'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('supply_requests')
        .select(`
          id,
          status,
          created_at,
          priority,
          notes,
          requester_id,
          profiles!requester_id (
            first_name,
            last_name,
            department
          ),
          supply_request_items (
            quantity_requested,
            inventory_items (
              name,
              unit
            )
          )
        `)
        .in('status', ['submitted', 'received', 'picking', 'ready'])
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      // Transform the data to match our interface (profiles comes as array from supabase)
      return (data || []).map((item) => {
        const profiles = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles;
        const supply_request_items = Array.isArray(item.supply_request_items)
          ? item.supply_request_items.map((sri) => {
              const inventory_items = Array.isArray((sri as Record<string, unknown>).inventory_items)
                ? ((sri as Record<string, unknown>).inventory_items as unknown[])[0]
                : (sri as Record<string, unknown>).inventory_items;
              return { ...sri, inventory_items } as SupplyRequest['supply_request_items'][number];
            })
          : [];
        return { ...item, profiles, supply_request_items } as SupplyRequest;
      });
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Mark request as ready for pickup
  const markReady = useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await supabase
        .from('supply_requests')
        .update({ 
          status: 'ready',
          fulfilled_by: user?.id,
          fulfilled_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Request marked as ready for pickup');
      queryClient.invalidateQueries({ queryKey: ['supply-fulfillment-queue'] });
    },
    onError: (error: Error) => {
      toast.error('Failed to update request', { description: error.message });
    },
  });

  // Start fulfillment
  const startFulfillment = useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await supabase
        .from('supply_requests')
        .update({ 
          status: 'picking',
          assigned_fulfiller_id: user?.id,
        })
        .eq('id', requestId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Started fulfilling request');
      queryClient.invalidateQueries({ queryKey: ['supply-fulfillment-queue'] });
    },
    onError: (error: Error) => {
      toast.error('Failed to update request', { description: error.message });
    },
  });

  // Group by status pipeline
  const newOrders = requests?.filter(r => ['submitted', 'received'].includes(r.status)) || [];
  const inProgress = requests?.filter(r => r.status === 'picking') || [];
  const readyForPickup = requests?.filter(r => r.status === 'ready') || [];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-blue-500 text-white';
      case 'low': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'submitted': return <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30">New Order</Badge>;
      case 'received': return <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30">Received</Badge>;
      case 'picking': return <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30">Picking</Badge>;
      case 'ready': return <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30">Ready</Badge>;
      default: return <Badge variant="outline" className="text-xs">{status}</Badge>;
    }
  };

  const renderRequest = (request: SupplyRequest) => {
    const isNew = ['submitted', 'received'].includes(request.status);
    const isPicking = request.status === 'picking';
    const isReady = request.status === 'ready';

    return (
      <div
        key={request.id}
        className={`border rounded-lg p-3 transition-colors ${
          isReady
            ? 'bg-green-500/5 border-green-500/20'
            : isPicking
            ? 'bg-blue-500/5 border-blue-500/20'
            : 'bg-card border-border hover:bg-accent/50'
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {/* Requester + Status + Priority */}
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="font-medium text-sm truncate">
                {request.profiles?.first_name} {request.profiles?.last_name}
              </span>
              {getStatusBadge(request.status)}
              <Badge className={`text-xs ${getPriorityColor(request.priority)}`}>
                {request.priority}
              </Badge>
            </div>

            {/* Items list */}
            <div className="text-sm mb-1.5">
              {request.supply_request_items.map((item, i) => (
                <div key={i} className="flex items-center gap-1.5 text-foreground">
                  <Package className="h-3 w-3 text-muted-foreground shrink-0" />
                  <span>{item.quantity_requested}x {item.inventory_items?.name || 'Unknown item'}</span>
                </div>
              ))}
            </div>

            {/* Notes */}
            {request.notes && (
              <p className="text-xs text-muted-foreground italic mb-1.5">
                "{request.notes}"
              </p>
            )}

            {/* Time */}
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {format(new Date(request.created_at), 'MMM d, h:mm a')}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-1 shrink-0">
            {isNew && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => startFulfillment.mutate(request.id)}
                disabled={startFulfillment.isPending}
              >
                {startFulfillment.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Package className="h-4 w-4 mr-1" />
                    Start
                  </>
                )}
              </Button>
            )}
            {isPicking && (
              <Button
                size="sm"
                onClick={() => markReady.mutate(request.id)}
                disabled={markReady.isPending}
              >
                {markReady.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Mark Ready
                  </>
                )}
              </Button>
            )}
            {isReady && (
              <Badge variant="outline" className="text-green-600 dark:text-green-400 border-green-500/30 whitespace-nowrap">
                Awaiting pickup
              </Badge>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Supply Orders
          </CardTitle>
          {!isLoading && requests && requests.length > 0 && (
            <div className="flex gap-1.5">
              {newOrders.length > 0 && (
                <Badge className="bg-amber-500 text-white text-xs">{newOrders.length} new</Badge>
              )}
              {inProgress.length > 0 && (
                <Badge className="bg-blue-500 text-white text-xs">{inProgress.length} picking</Badge>
              )}
              {readyForPickup.length > 0 && (
                <Badge className="bg-green-500 text-white text-xs">{readyForPickup.length} ready</Badge>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          <div className="px-4 pb-4 space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : requests?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <PackageCheck className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p className="font-medium">All caught up!</p>
                <p className="text-sm">No pending supply orders</p>
              </div>
            ) : (
              <>
                {/* New Orders */}
                {newOrders.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                      New Orders ({newOrders.length})
                    </h4>
                    <div className="space-y-2">
                      {newOrders.map(renderRequest)}
                    </div>
                  </div>
                )}

                {/* In Progress */}
                {inProgress.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Package className="h-4 w-4 text-blue-500" />
                      Being Prepared ({inProgress.length})
                    </h4>
                    <div className="space-y-2">
                      {inProgress.map(renderRequest)}
                    </div>
                  </div>
                )}

                {/* Ready for Pickup */}
                {readyForPickup.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <PackageCheck className="h-4 w-4 text-green-500" />
                      Ready for Pickup ({readyForPickup.length})
                    </h4>
                    <div className="space-y-2">
                      {readyForPickup.map(renderRequest)}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
