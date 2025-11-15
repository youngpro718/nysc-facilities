import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, formatDistanceToNow } from 'date-fns';
import {
  Package,
  Clock,
  CheckCircle,
  XCircle,
  User,
  Calendar,
  AlertTriangle,
  Filter,
  Search,
  MoreHorizontal,
  TrendingDown,
  TrendingUp,
  Eye,
  Edit,
  Trash2,
  Download,
  Plus,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Boxes,
  Activity,
  Archive,
  MapPin
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

// Temporary forced minimum threshold for low stock across the app (testing only)
// TODO: Gate behind an env/feature flag and revert to DB-driven minimums when ready
const FORCED_MINIMUM = 3;

interface SupplyRequestWithDetails {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  // Standardized status model
  status: 'submitted' | 'received' | 'processing' | 'ready' | 'picked_up' | 'completed' | 'cancelled';
  fulfillment_stage: string;
  requested_delivery_date?: string;
  delivery_location?: string;
  created_at: string;
  updated_at: string;
  requester: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  items: Array<{
    id: string;
    name: string;
    quantity_requested: number;
    quantity_approved?: number;
    quantity_fulfilled?: number;
    current_stock: number;
    minimum_quantity: number;
    category: string;
    unit?: string;
    notes?: string;
  }>;
  totalItems: number;
  estimatedCost?: number;
}

const priorityColors = {
  low: 'bg-secondary text-secondary-foreground',
  medium: 'bg-secondary text-secondary-foreground',
  high: 'bg-destructive/10 text-destructive',
  urgent: 'bg-destructive text-destructive-foreground'
};

const statusColors: Record<SupplyRequestWithDetails['status'], string> = {
  submitted: 'bg-secondary text-secondary-foreground',
  received: 'bg-secondary text-secondary-foreground',
  processing: 'bg-secondary text-secondary-foreground',
  ready: 'bg-secondary text-secondary-foreground',
  picked_up: 'bg-secondary text-secondary-foreground',
  completed: 'bg-secondary text-secondary-foreground',
  cancelled: 'bg-destructive text-destructive-foreground',
};

const statusIcons: Record<SupplyRequestWithDetails['status'], any> = {
  submitted: Clock,
  received: CheckCircle,
  processing: Activity,
  ready: CheckCircle,
  picked_up: Package,
  completed: Archive,
  cancelled: XCircle,
};

export function EnhancedSupplyManagement() {
  const { isAdmin, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State management
  const [activeTab, setActiveTab] = useState('requests');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [expandedRequests, setExpandedRequests] = useState<Set<string>>(new Set());
  

  // Fetch supply requests with full details
  const { data: requests = [], isLoading, refetch } = useQuery({
    queryKey: ['enhanced-supply-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('supply_requests')
        .select(`
          *,
          profiles!requester_id (
            id,
            first_name,
            last_name,
            email
          ),
          supply_request_items!request_id (
            id,
            quantity_requested,
            quantity_approved,
            quantity_fulfilled,
            notes,
            inventory_items!item_id (
              id,
              name,
              quantity,
              minimum_quantity,
              unit,
              inventory_categories (
                name
              )
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Map legacy statuses (pending/approved/rejected/fulfilled) to unified lifecycle
      const normalizeStatus = (s: string): SupplyRequestWithDetails['status'] => {
        switch (s) {
          case 'pending':
            return 'submitted';
          case 'approved':
            return 'received';
          case 'rejected':
            return 'cancelled';
          case 'fulfilled':
            return 'completed';
          default:
            return (s as any) as SupplyRequestWithDetails['status'];
        }
      };

      return data.map((request: any): SupplyRequestWithDetails => ({
        id: request.id,
        title: request.title,
        description: request.description,
        priority: request.priority,
        status: normalizeStatus(request.status),
        fulfillment_stage: request.fulfillment_stage,
        requested_delivery_date: request.requested_delivery_date,
        delivery_location: request.delivery_location,
        created_at: request.created_at,
        updated_at: request.updated_at,
        requester: {
          id: request.profiles?.id || '',
          name: `${request.profiles?.first_name || 'Unknown'} ${request.profiles?.last_name || ''}`.trim(),
          email: request.profiles?.email || '',
        },
        items: request.supply_request_items.map((item: any) => ({
          id: item.id,
          name: item.inventory_items.name,
          quantity_requested: item.quantity_requested,
          quantity_approved: item.quantity_approved,
          quantity_fulfilled: item.quantity_fulfilled,
          current_stock: item.inventory_items.quantity,
          minimum_quantity: item.inventory_items.minimum_quantity,
          category: item.inventory_items.inventory_categories?.name || '',
          unit: item.inventory_items.unit,
          notes: item.notes,
        })),
        totalItems: request.supply_request_items.length,
      }));
    },
  });

  // Fetch inventory summary
  const { data: inventorySummary } = useQuery({
    queryKey: ['inventory-summary'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory_items')
        .select(`
          id,
          name,
          quantity,
          inventory_categories (name)
        `);

      if (error) throw error;

      // Use forced minimum for consistency across the app
      const lowStock = data.filter(
        (item: any) =>
          typeof item.quantity === 'number' &&
          item.quantity <= FORCED_MINIMUM
      );
      const totalItems = data.length;
      const totalValue = data.reduce((sum, item) => sum + item.quantity, 0);

      return {
        totalItems,
        totalValue,
        lowStockCount: lowStock.length,
        categories: [...new Set(data.map(item => (item.inventory_categories as any)?.name).filter(Boolean))].length
      };
    },
  });

  // Analytics and staff performance removed from Supplies UI

  // Fetch low stock and stock-out items
  const { data: stockAlerts } = useQuery({
    queryKey: ['stock-alerts'],
    queryFn: async () => {
      const { data } = await supabase
        .from('inventory_items')
        .select(`
          id,
          name,
          quantity,
          unit,
          inventory_categories(name)
        `)
      // Apply forced minimum client-side for consistency
      return (data || []).filter((item: any) => item.quantity <= FORCED_MINIMUM);
    },
    enabled: isAdmin
  });

  // Filter requests
  const filteredRequests = useMemo(() => {
    return requests.filter(request => {
      const matchesSearch = searchTerm === '' || 
        request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.requester.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.items.some(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || request.priority === priorityFilter;
      
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [requests, searchTerm, statusFilter, priorityFilter]);

  // Statistics
  const stats = useMemo(() => {
    const submitted = requests.filter(r => r.status === 'submitted').length;
    const received = requests.filter(r => r.status === 'received').length;
    const processing = requests.filter(r => r.status === 'processing').length;
    const ready = requests.filter(r => r.status === 'ready').length;
    const completed = requests.filter(r => r.status === 'completed').length;
    const urgent = requests.filter(r => r.priority === 'urgent').length;
    return { submitted, received, processing, ready, completed, urgent };
  }, [requests]);

  // Toggle request expansion
  const toggleExpanded = (requestId: string) => {
    const newExpanded = new Set(expandedRequests);
    if (newExpanded.has(requestId)) {
      newExpanded.delete(requestId);
    } else {
      newExpanded.add(requestId);
    }
    setExpandedRequests(newExpanded);
  };

  // Update request status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ requestId, status, notes }: { requestId: string; status: SupplyRequestWithDetails['status']; notes?: string }) => {
      const { error } = await supabase
        .from('supply_requests')
        .update({ 
          status, 
          updated_at: new Date().toISOString(),
          ...(status === 'received' && { approved_at: new Date().toISOString(), approved_by: user?.id }),
          ...(status === 'completed' && { fulfilled_at: new Date().toISOString(), fulfilled_by: user?.id }),
          ...(notes && { approval_notes: notes })
        })
        .eq('id', requestId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enhanced-supply-requests'] });
      toast({ title: 'Request updated successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error updating request', description: error.message, variant: 'destructive' });
    },
  });

  const RequestCard = ({ request }: { request: SupplyRequestWithDetails }) => {
    const isExpanded = expandedRequests.has(request.id);
    const StatusIcon = statusIcons[request.status] ?? Package;
    const hasStockIssues = request.items.some(item => item.current_stock < item.quantity_requested);

    return (
      <Card className="mb-4 transition-all duration-200 hover:shadow-md">
        <Collapsible open={isExpanded} onOpenChange={() => toggleExpanded(request.id)}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  <div className="flex items-center gap-2">
                    <StatusIcon className="h-4 w-4" />
                    <CardTitle className="text-base">{request.title}</CardTitle>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge className={priorityColors[request.priority]}>
                    {request.priority}
                  </Badge>
                  <Badge className={statusColors[request.status] ?? 'bg-secondary text-secondary-foreground'}>
                    {request.status}
                  </Badge>
                  {hasStockIssues && (
                    <Badge variant="destructive">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Stock Issue
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm text-muted-foreground mt-2">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        {request.requester.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <span>{request.requester.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Package className="h-3 w-3" />
                    <span>{request.totalItems} items</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}</span>
                  </div>
                </div>
                
                {isAdmin && request.status === 'submitted' && (
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-green-600 hover:text-green-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateStatusMutation.mutate({ requestId: request.id, status: 'received' });
                      }}
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-red-600 hover:text-red-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateStatusMutation.mutate({ requestId: request.id, status: 'cancelled' });
                      }}
                    >
                      <XCircle className="h-3 w-3 mr-1" />
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <CardContent className="pt-0">
              <Separator className="mb-4" />
              
              {/* Request Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <h4 className="font-medium text-sm text-foreground mb-1">Delivery Location</h4>
                  <p className="text-sm text-muted-foreground">{request.delivery_location || 'Not specified'}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-foreground mb-1">Requested Date</h4>
                  <p className="text-sm text-muted-foreground">
                    {request.requested_delivery_date 
                      ? format(new Date(request.requested_delivery_date), 'MMM dd, yyyy')
                      : 'ASAP'
                    }
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-foreground mb-1">Fulfillment Stage</h4>
                  <p className="text-sm capitalize text-muted-foreground">{request.fulfillment_stage}</p>
                </div>
              </div>

              {/* Items List */}
              <div>
                <h4 className="font-medium text-sm text-foreground mb-2">Requested Items</h4>
                <div className="space-y-2">
                  {request.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-card border border-border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{item.name}</span>
                          {item.category && (
                            <Badge variant="outline" className="text-xs">{item.category}</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span>Requested: {item.quantity_requested} {item.unit || 'units'}</span>
                          <span>In Stock: {item.current_stock}</span>
                          {item.current_stock < item.quantity_requested && (
                            <span className="text-destructive flex items-center gap-1">
                              <TrendingDown className="h-3 w-3" />
                              Insufficient Stock
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        {item.quantity_approved && (
                          <div className="text-sm text-green-600">
                            Approved: {item.quantity_approved}
                          </div>
                        )}
                        {item.quantity_fulfilled && (
                          <div className="text-sm text-blue-600">
                            Fulfilled: {item.quantity_fulfilled}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {request.description && (
                <div className="mt-4">
                  <h4 className="font-medium text-sm text-gray-700 mb-1">Description</h4>
                  <p className="text-sm text-gray-600">{request.description}</p>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Submitted</p>
                <p className="text-2xl font-bold text-blue-600">{stats.submitted}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Received</p>
                <p className="text-2xl font-bold text-purple-600">{stats.received}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-800">{stats.completed}</p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Urgent</p>
                <p className="text-2xl font-bold text-red-600">{stats.urgent}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex gap-2 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search requests, items, or requesters..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="fulfilled">Fulfilled</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
              {isAdmin && (
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  New Request
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Admin Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="requests" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Requests
          </TabsTrigger>
          <TabsTrigger value="stock" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Stock Alerts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">
              Supply Requests ({filteredRequests.length})
            </h3>
            <div className="text-sm text-gray-600">
              {filteredRequests.length !== requests.length && `Filtered from ${requests.length} total`}
            </div>
          </div>
        
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredRequests.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No requests found</h3>
              <p className="text-gray-600">
                {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
                  ? 'Try adjusting your filters or search terms.'
                  : 'No supply requests have been created yet.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div>
            {filteredRequests.map((request) => (
              <RequestCard key={request.id} request={request} />
            ))}
          </div>
        )}
        </TabsContent>

        {/* Analytics tab removed */}

        {/* Staff Performance tab removed */}

        <TabsContent value="stock" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Stock Alerts & Inventory Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stockAlerts && stockAlerts.length > 0 ? (
                <div className="space-y-3">
                  {stockAlerts.map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{item.name}</h4>
                        {item.inventory_categories?.name && (
                          <p className="text-sm text-gray-600">
                            {item.inventory_categories.name}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          {item.quantity === 0 ? (
                            <Badge variant="destructive">Out of Stock</Badge>
                          ) : (
                            <Badge variant="secondary">Low Stock</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {item.quantity} {item.unit} (Min: {FORCED_MINIMUM})
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">All Stock Levels Good</h3>
                  <p className="text-gray-600">No items are currently low on stock or out of stock.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
