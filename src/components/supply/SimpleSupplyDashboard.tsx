import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { RefreshCcw, Package, Inbox } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { SimpleOrderCard } from './SimpleOrderCard';
import { SimpleFulfillmentDialog } from './SimpleFulfillmentDialog';
import { LiveIndicator } from '@/components/common/LiveIndicator';

export function SimpleSupplyDashboard() {
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Fetch all pending/approved orders
  const { data: orders, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['supply-orders'],
    queryFn: async () => {
      console.log('Fetching supply orders...');
      
      const { data, error } = await supabase
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
              id,
              name,
              quantity,
              unit,
              sku
            )
          )
        `)
        .in('status', ['pending', 'approved'])
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching orders:', error);
        throw error;
      }

      console.log('Fetched orders:', data?.length || 0);
      setLastUpdated(new Date());
      return data || [];
    },
    // refetchInterval disabled
  });

  // Subscribe to real-time updates
  useState(() => {
    const channel = supabase
      .channel('supply-requests-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'supply_requests',
        },
        () => {
          console.log('Supply request changed, refetching...');
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  });

  const handleRefresh = () => {
    refetch();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Package className="h-8 w-8" />
            Supply Room - Incoming Orders
          </h1>
          <div className="flex items-center gap-4">
            <p className="text-muted-foreground">
              View and fulfill supply requests
            </p>
            <LiveIndicator
              lastUpdated={lastUpdated}
              onRefresh={handleRefresh}
              isRefreshing={isFetching}
              autoRefreshInterval={30}
              showRefreshButton={false}
            />
          </div>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={handleRefresh}
          disabled={isFetching}
        >
          <RefreshCcw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Orders Count */}
      {!isLoading && (
        <div className="bg-muted/50 rounded-lg p-4">
          <p className="text-sm font-medium">
            {orders?.length || 0} order{orders?.length !== 1 ? 's' : ''} awaiting fulfillment
          </p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-2">
            <RefreshCcw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading orders...</p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && orders?.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Inbox className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Orders to Fulfill</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            All caught up! There are no pending orders at the moment.
          </p>
        </div>
      )}

      {/* Orders Grid */}
      {!isLoading && orders && orders.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {orders.map((order) => (
            <SimpleOrderCard
              key={order.id}
              order={order}
              onFulfill={() => setSelectedOrder(order)}
            />
          ))}
        </div>
      )}

      {/* Fulfillment Dialog */}
      {selectedOrder && (
        <SimpleFulfillmentDialog
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  );
}
