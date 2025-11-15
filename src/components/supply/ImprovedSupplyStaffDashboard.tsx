import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  RefreshCcw, 
  Package, 
  Inbox, 
  Clock,
  CheckCircle,
  AlertCircle,
  Search,
  Filter
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { SimpleOrderCard } from './SimpleOrderCard';
import { SimpleFulfillmentDialog } from './SimpleFulfillmentDialog';
import { LiveIndicator } from '@/components/common/LiveIndicator';
import { InventoryManagementTab } from './InventoryManagementTab';

export function ImprovedSupplyStaffDashboard() {
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('new');
  const [completedLastUpdated, setCompletedLastUpdated] = useState(new Date());

  // Fetch all orders
  const { data: allOrders, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['supply-staff-orders'],
    queryFn: async () => {
      console.log('Fetching supply orders for staff...');
      
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
        // FIXED: Don't include 'completed' - those are done!
        .in('status', ['pending', 'approved', 'ready'])
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

  // Fetch completed orders separately (last 7 days only)
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
    enabled: activeTab === 'completed', // Only fetch when viewing completed tab
    // refetchInterval disabled
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

  // Filter orders by status and search
  const ordersToFilter = activeTab === 'completed' ? (completedOrders || []) : (allOrders || []);
  
  const filteredOrders = ordersToFilter.filter(order => {
    // Filter by tab (completed tab uses separate query, so skip this filter)
    if (activeTab !== 'completed') {
      if (activeTab === 'new' && !['pending', 'approved'].includes(order.status)) return false;
      if (activeTab === 'ready' && order.status !== 'ready') return false;
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const requesterName = `${order.profiles?.first_name} ${order.profiles?.last_name}`.toLowerCase();
      const department = order.profiles?.department?.toLowerCase() || '';
      const room = order.delivery_location?.toLowerCase() || '';
      
      return requesterName.includes(query) || department.includes(query) || room.includes(query);
    }

    return true;
  });

  // Calculate counts
  const newCount = (allOrders || []).filter(o => ['pending', 'approved'].includes(o.status)).length;
  const readyCount = (allOrders || []).filter(o => o.status === 'ready').length;
  const completedTodayCount = (allOrders || []).filter(o => {
    if (o.status !== 'completed') return false;
    const today = new Date().toDateString();
    const completedDate = new Date(o.fulfilled_at || o.updated_at).toDateString();
    return today === completedDate;
  }).length;

  const handleRefresh = () => {
    refetch();
  };

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Package className="h-8 w-8" />
              Supply Room Staff
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

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                New Orders
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{newCount}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting fulfillment
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Ready for Pickup
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{readyCount}</div>
              <p className="text-xs text-muted-foreground">
                Waiting for collection
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Completed Today
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedTodayCount}</div>
              <p className="text-xs text-muted-foreground">
                Orders fulfilled
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Search and Filter */}
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
      </div>

      {/* Tabbed Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="new" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">New Orders</span>
            <span className="sm:hidden">New</span>
            {newCount > 0 && (
              <Badge variant="destructive" className="ml-1">
                {newCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="ready" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">Ready</span>
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
          ) : filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Inbox className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No New Orders</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                {searchQuery ? 'No orders match your search.' : 'All caught up! No pending orders at the moment.'}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredOrders.map((order) => (
                <SimpleOrderCard
                  key={order.id}
                  order={order}
                  onFulfill={() => setSelectedOrder(order)}
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
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredOrders.map((order) => (
                <SimpleOrderCard
                  key={order.id}
                  order={order}
                  onFulfill={() => setSelectedOrder(order)}
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
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredOrders.map((order) => (
                <SimpleOrderCard
                  key={order.id}
                  order={order}
                  onFulfill={() => setSelectedOrder(order)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

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
