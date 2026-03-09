import { useState, useMemo } from 'react';
import { logger } from '@/lib/logger';
import { getErrorMessage } from '@/lib/errorUtils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  RefreshCcw, 
  Package, 
  Inbox, 
  Clock,
  CheckCircle,
  AlertCircle,
  Search,
  Boxes,
  Truck,
  Flame,
  Timer
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { SimpleOrderCard } from './SimpleOrderCard';
import { OrderTableView } from './OrderTableView';
import { SupplyViewToggle, SupplyViewMode } from './SupplyViewToggle';
import { PartialFulfillmentDialog } from './PartialFulfillmentDialog';
import { LiveIndicator } from '@/components/common/LiveIndicator';
import { InventoryManagementTab } from './InventoryManagementTab';
import { LowStockPanel } from '@/components/inventory/LowStockPanel';
import { staffCompletePickup } from '@/services/supplyOrdersService';
import { toast } from 'sonner';
import { formatDistanceToNowStrict } from 'date-fns';

// Helper to get minutes since a date
const minutesSince = (dateStr: string) => (Date.now() - new Date(dateStr).getTime()) / 60000;

// Urgency level based on wait time
const getUrgencyLevel = (order: Record<string, unknown>): 'critical' | 'warning' | 'normal' => {
  const mins = minutesSince(order.created_at as string);
  if (mins > 60) return 'critical';   // >1 hour
  if (mins > 30) return 'warning';    // >30 minutes
  return 'normal';
};

const urgencyStyles = {
  critical: 'ring-2 ring-destructive/50 border-destructive/40 shadow-[0_0_12px_-3px_hsl(var(--destructive)/0.4)]',
  warning: 'ring-1 ring-amber-400/50 border-amber-400/40',
  normal: '',
};

export function ImprovedSupplyStaffDashboard() {
  const queryClient = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState<Record<string, unknown> | null>(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('new');
  const [completedLastUpdated, setCompletedLastUpdated] = useState(new Date());
  const [viewMode, setViewMode] = useState<SupplyViewMode>('cards');

  const confirmPickupMutation = useMutation({
    mutationFn: staffCompletePickup,
    onSuccess: () => {
      toast.success('Order marked as picked up');
      queryClient.invalidateQueries({ queryKey: ['supply-staff-orders'] });
      queryClient.invalidateQueries({ queryKey: ['supply-orders'] });
      queryClient.invalidateQueries({ queryKey: ['completed-orders'] });
    },
    onError: (error: unknown) => {
      toast.error('Failed to confirm pickup', { description: getErrorMessage(error) });
    },
  });

  const { data: allOrders, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['supply-staff-orders'],
    queryFn: async () => {
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
        .in('status', ['submitted', 'approved', 'received', 'picking', 'ready'])
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching orders:', error);
        throw error;
      }

      setLastUpdated(new Date());
      return data || [];
    },
  });

  const { data: completedOrders } = useQuery({
    queryKey: ['supply-staff-completed'],
    queryFn: async () => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

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
        .eq('status', 'completed')
        .gte('updated_at', sevenDaysAgo.toISOString())
        .order('updated_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setCompletedLastUpdated(new Date());
      return data || [];
    },
    enabled: activeTab === 'completed',
  });

  // Subscribe to real-time updates
  useState(() => {
    const channel = supabase
      .channel('supply-staff-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'supply_requests',
        },
        () => refetch()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  });

  // Filter orders by status and search
  const ordersToFilter = activeTab === 'completed' ? (completedOrders || []) : (allOrders || []);
  
  const filteredOrders = ordersToFilter.filter((order: Record<string, unknown>) => {
    if (activeTab !== 'completed') {
      if (activeTab === 'new' && !['submitted', 'approved', 'received', 'picking'].includes(order.status as string)) return false;
      if (activeTab === 'ready' && order.status !== 'ready') return false;
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const profiles = order.profiles as Record<string, unknown> | null;
      const requesterName = `${profiles?.first_name} ${profiles?.last_name}`.toLowerCase();
      const department = (profiles?.department as string)?.toLowerCase() || '';
      const room = (order.delivery_location as string)?.toLowerCase() || '';
      
      return requesterName.includes(query) || department.includes(query) || room.includes(query);
    }

    return true;
  });

  // Sort new orders by urgency (oldest first)
  const sortedOrders = useMemo(() => {
    if (activeTab === 'new') {
      return [...filteredOrders].sort((a: Record<string, unknown>, b: Record<string, unknown>) => 
        new Date(a.created_at as string).getTime() - new Date(b.created_at as string).getTime()
      );
    }
    return filteredOrders;
  }, [filteredOrders, activeTab]);

  // Calculate counts
  const newCount = (allOrders || []).filter((o: Record<string, unknown>) => ['submitted', 'approved', 'received', 'picking'].includes(o.status as string)).length;
  const readyCount = (allOrders || []).filter((o: Record<string, unknown>) => o.status === 'ready').length;
  const urgentCount = (allOrders || []).filter((o: Record<string, unknown>) => 
    ['submitted', 'approved', 'received', 'picking'].includes(o.status as string) && getUrgencyLevel(o) === 'critical'
  ).length;
  const pickingCount = (allOrders || []).filter((o: Record<string, unknown>) => o.status === 'picking').length;

  const handleRefresh = () => {
    refetch();
  };

  // Find oldest waiting order
  const oldestWaiting = useMemo(() => {
    const waiting = (allOrders || []).filter((o: Record<string, unknown>) => 
      ['submitted', 'approved', 'received'].includes(o.status as string)
    );
    if (waiting.length === 0) return null;
    return waiting.reduce((oldest: Record<string, unknown>, o: Record<string, unknown>) => 
      new Date(o.created_at as string) < new Date(oldest.created_at as string) ? o : oldest
    );
  }, [allOrders]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Package className="h-8 w-8" />
              Supply Room
            </h1>
            <div className="flex items-center gap-4">
              <p className="text-muted-foreground">
                Fulfill supply requests and manage inventory
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

        {/* Stats Cards with urgency indicators */}
        <div className="grid gap-4 md:grid-cols-4">
          {/* Urgent indicator */}
          <Card className={urgentCount > 0 ? 'border-destructive/40 bg-destructive/5' : ''}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Urgent</CardTitle>
              <Flame className={`h-4 w-4 ${urgentCount > 0 ? 'text-destructive animate-pulse' : 'text-muted-foreground'}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${urgentCount > 0 ? 'text-destructive' : ''}`}>{urgentCount}</div>
              <p className="text-xs text-muted-foreground">
                Waiting &gt;1 hour
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Queue</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{newCount}</div>
              <p className="text-xs text-muted-foreground">
                {oldestWaiting 
                  ? `Oldest: ${formatDistanceToNowStrict(new Date(oldestWaiting.created_at as string))}`
                  : 'All clear'
                }
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Being Picked</CardTitle>
              <Timer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pickingCount}</div>
              <p className="text-xs text-muted-foreground">
                Currently fulfilling
              </p>
            </CardContent>
          </Card>

          <Card className={readyCount > 0 ? 'border-green-500/40 bg-green-500/5' : ''}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ready</CardTitle>
              <Package className={`h-4 w-4 ${readyCount > 0 ? 'text-green-600' : 'text-muted-foreground'}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${readyCount > 0 ? 'text-green-600' : ''}`}>{readyCount}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting pickup
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Search and View Toggle */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by requester, department, or room..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <SupplyViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
      </div>

      {/* Tabbed Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} data-tour="supply-orders">
        <TabsList className="grid w-full grid-cols-4" data-tour="supply-status">
          <TabsTrigger value="new" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">New Orders</span>
            <span className="sm:hidden">New</span>
            {newCount > 0 && (
              <Badge variant={urgentCount > 0 ? 'destructive' : 'secondary'} className="ml-1">
                {newCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="ready" className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            <span className="hidden sm:inline">Ready/Deliver</span>
            <span className="sm:hidden">Ready</span>
            {readyCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {readyCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Completed</span>
            <span className="sm:hidden">Done</span>
          </TabsTrigger>
          <TabsTrigger value="inventory" className="flex items-center gap-2">
            <Boxes className="h-4 w-4" />
            <span className="hidden sm:inline">Inventory</span>
            <span className="sm:hidden">Stock</span>
          </TabsTrigger>
        </TabsList>

        {/* New Orders Tab */}
        <TabsContent value="new" className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-2">
                <RefreshCcw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Loading orders...</p>
              </div>
            </div>
          ) : sortedOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Inbox className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No New Orders</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                {searchQuery ? 'No orders match your search.' : 'All caught up! No pending orders at the moment.'}
              </p>
            </div>
          ) : viewMode === 'list' ? (
            <OrderTableView
              orders={sortedOrders}
              onFulfill={(order: Record<string, unknown>) => setSelectedOrder(order)}
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {sortedOrders.map((order: Record<string, unknown>) => (
                <SimpleOrderCard
                  key={order.id as string}
                  order={order}
                  onFulfill={() => setSelectedOrder(order)}
                  urgencyClass={urgencyStyles[getUrgencyLevel(order)]}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Ready for Pickup Tab */}
        <TabsContent value="ready" className="space-y-4">
          {filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Package className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Orders Ready</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                No orders are currently ready for pickup.
              </p>
            </div>
          ) : viewMode === 'list' ? (
            <OrderTableView
              orders={filteredOrders}
              onFulfill={(order: Record<string, unknown>) => setSelectedOrder(order)}
              onConfirmPickup={(orderId: string) => confirmPickupMutation.mutate(orderId)}
              isConfirmingPickup={confirmPickupMutation.isPending}
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredOrders.map((order: Record<string, unknown>) => (
                <SimpleOrderCard
                  key={order.id as string}
                  order={order}
                  onFulfill={() => setSelectedOrder(order)}
                  onConfirmPickup={() => confirmPickupMutation.mutate(order.id as string)}
                  isConfirmingPickup={confirmPickupMutation.isPending}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Completed Tab */}
        <TabsContent value="completed" className="space-y-4">
          {filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CheckCircle className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Completed Orders</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                No orders have been completed yet.
              </p>
            </div>
          ) : viewMode === 'list' ? (
            <OrderTableView
              orders={filteredOrders}
              onFulfill={(order: Record<string, unknown>) => setSelectedOrder(order)}
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredOrders.map((order: Record<string, unknown>) => (
                <SimpleOrderCard
                  key={order.id as string}
                  order={order}
                  onFulfill={() => setSelectedOrder(order)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Inventory Tab */}
        <TabsContent value="inventory" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                  Low Stock Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <LowStockPanel />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Boxes className="h-5 w-5" />
                  Quick Stock Check
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  For full inventory management, go to the Inventory Dashboard.
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => window.location.href = '/inventory'}
                >
                  Open Inventory Dashboard
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Fulfillment Dialog */}
      {selectedOrder && (
        <PartialFulfillmentDialog
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  );
}
