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
  Users,
  Activity,
  BarChart3,
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
import { supabase } from '@/integrations/supabase/client';

interface SupplyRequestWithDetails {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'approved' | 'rejected' | 'fulfilled';
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
  low: 'bg-blue-100 text-blue-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800'
};

const statusColors = {
  pending: 'bg-gray-100 text-gray-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  fulfilled: 'bg-blue-100 text-blue-800'
};

const statusIcons = {
  pending: Clock,
  approved: CheckCircle,
  rejected: XCircle,
  fulfilled: Package
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
  const [dateRange, setDateRange] = useState('30'); // days

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

      return data.map((request: any): SupplyRequestWithDetails => ({
        id: request.id,
        title: request.title,
        description: request.description,
        priority: request.priority,
        status: request.status,
        fulfillment_stage: request.fulfillment_stage,
        requested_delivery_date: request.requested_delivery_date,
        delivery_location: request.delivery_location,
        created_at: request.created_at,
        updated_at: request.updated_at,
        requester: {
          id: request.profiles.id,
          name: `${request.profiles.first_name} ${request.profiles.last_name}`,
          email: request.profiles.email,
        },
        items: request.supply_request_items.map((item: any) => ({
          id: item.id,
          name: item.inventory_items.name,
          quantity_requested: item.quantity_requested,
          quantity_approved: item.quantity_approved,
          quantity_fulfilled: item.quantity_fulfilled,
          current_stock: item.inventory_items.quantity,
          minimum_quantity: item.inventory_items.minimum_quantity,
          category: item.inventory_items.inventory_categories?.name || 'Uncategorized',
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
          minimum_quantity,
          inventory_categories (name)
        `);

      if (error) throw error;

      const lowStock = data.filter(item => item.quantity <= item.minimum_quantity);
      const totalItems = data.length;
      const totalValue = data.reduce((sum, item) => sum + item.quantity, 0);

      return {
        totalItems,
        totalValue,
        lowStockCount: lowStock.length,
        categories: [...new Set(data.map(item => item.inventory_categories?.name).filter(Boolean))].length
      };
    },
  });

  // Fetch analytics data for admin dashboard
  const { data: analyticsData } = useQuery({
    queryKey: ['supply-analytics', dateRange],
    queryFn: async () => {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(dateRange));
      
      // Departmental usage trends
      const { data: departmentUsage } = await supabase
        .from('supply_requests')
        .select(`
          delivery_location,
          status,
          created_at,
          supply_request_items!request_id(
            quantity_requested,
            quantity_fulfilled
          )
        `)
        .gte('created_at', daysAgo.toISOString());

      // Fulfillment speed tracking
      const { data: fulfillmentSpeed } = await supabase
        .from('supply_requests')
        .select(`
          created_at,
          approved_at,
          fulfilled_at,
          work_started_at,
          work_completed_at,
          work_duration_minutes,
          fulfillment_stage
        `)
        .not('fulfilled_at', 'is', null)
        .gte('created_at', daysAgo.toISOString());

      // Staff fulfillment tracking
      const { data: staffPerformance } = await supabase
        .from('supply_requests')
        .select(`
          fulfilled_by,
          assigned_fulfiller_id,
          work_duration_minutes,
          fulfillment_cost,
          created_at,
          fulfilled_at,
          profiles!fulfilled_by(
            first_name,
            last_name
          ),
          assigned_profiles:profiles!assigned_fulfiller_id(
            first_name,
            last_name
          )
        `)
        .not('fulfilled_by', 'is', null)
        .gte('created_at', daysAgo.toISOString());

      return {
        departmentUsage: departmentUsage || [],
        fulfillmentSpeed: fulfillmentSpeed || [],
        staffPerformance: staffPerformance || []
      };
    },
    enabled: isAdmin
  });

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
          minimum_quantity,
          unit,
          inventory_categories(name)
        `)
        .or('quantity.lte.minimum_quantity,quantity.eq.0');
      
      return data || [];
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
    const pending = requests.filter(r => r.status === 'pending').length;
    const approved = requests.filter(r => r.status === 'approved').length;
    const fulfilled = requests.filter(r => r.status === 'fulfilled').length;
    const urgent = requests.filter(r => r.priority === 'urgent').length;
    
    return { pending, approved, fulfilled, urgent };
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
    mutationFn: async ({ requestId, status, notes }: { requestId: string; status: string; notes?: string }) => {
      const { error } = await supabase
        .from('supply_requests')
        .update({ 
          status, 
          updated_at: new Date().toISOString(),
          ...(status === 'approved' && { approved_at: new Date().toISOString(), approved_by: user?.id }),
          ...(status === 'fulfilled' && { fulfilled_at: new Date().toISOString(), fulfilled_by: user?.id }),
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
    const StatusIcon = statusIcons[request.status];
    const hasStockIssues = request.items.some(item => item.current_stock < item.quantity_requested);

    return (
      <Card className="mb-4 transition-all duration-200 hover:shadow-md">
        <Collapsible open={isExpanded} onOpenChange={() => toggleExpanded(request.id)}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-gray-50/50 transition-colors">
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
                  <Badge className={statusColors[request.status]}>
                    {request.status}
                  </Badge>
                  {hasStockIssues && (
                    <Badge variant="outline" className="text-orange-600 border-orange-200">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Stock Issue
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm text-gray-600 mt-2">
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
                
                {isAdmin && request.status === 'pending' && (
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-green-600 hover:text-green-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateStatusMutation.mutate({ requestId: request.id, status: 'approved' });
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
                        updateStatusMutation.mutate({ requestId: request.id, status: 'rejected' });
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
                  <h4 className="font-medium text-sm text-gray-700 mb-1">Delivery Location</h4>
                  <p className="text-sm">{request.delivery_location || 'Not specified'}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-1">Requested Date</h4>
                  <p className="text-sm">
                    {request.requested_delivery_date 
                      ? format(new Date(request.requested_delivery_date), 'MMM dd, yyyy')
                      : 'ASAP'
                    }
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-1">Fulfillment Stage</h4>
                  <p className="text-sm capitalize">{request.fulfillment_stage}</p>
                </div>
              </div>

              {/* Items List */}
              <div>
                <h4 className="font-medium text-sm text-gray-700 mb-2">Requested Items</h4>
                <div className="space-y-2">
                  {request.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{item.name}</span>
                          <Badge variant="outline" className="text-xs">{item.category}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                          <span>Requested: {item.quantity_requested} {item.unit || 'units'}</span>
                          <span>In Stock: {item.current_stock}</span>
                          {item.current_stock < item.quantity_requested && (
                            <span className="text-orange-600 flex items-center gap-1">
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
                <p className="text-sm text-gray-600">Pending Requests</p>
                <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Fulfilled</p>
                <p className="text-2xl font-bold text-blue-600">{stats.fulfilled}</p>
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="requests" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Requests
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="fulfillment" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Staff Performance
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

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Department Usage Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Usage by Department/Office
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analyticsData?.departmentUsage ? (
                  <div className="space-y-3">
                    {Object.entries(
                      analyticsData.departmentUsage.reduce((acc: any, req: any) => {
                        const dept = req.delivery_location || 'Unknown';
                        const items = req.supply_request_items?.length || 0;
                        acc[dept] = (acc[dept] || 0) + items;
                        return acc;
                      }, {})
                    ).map(([dept, count]) => (
                      <div key={dept} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{dept}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${Math.min((count as number) * 10, 100)}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-600">{count as number}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No usage data available</p>
                )}
              </CardContent>
            </Card>

            {/* Fulfillment Speed Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Fulfillment Speed
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analyticsData?.fulfillmentSpeed ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">
                          {Math.round(
                            analyticsData.fulfillmentSpeed.reduce((acc: number, req: any) => 
                              acc + (req.work_duration_minutes || 0), 0
                            ) / analyticsData.fulfillmentSpeed.length || 0
                          )}
                        </p>
                        <p className="text-sm text-gray-600">Avg Minutes</p>
                      </div>
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <p className="text-2xl font-bold text-blue-600">
                          {analyticsData.fulfillmentSpeed.length}
                        </p>
                        <p className="text-sm text-gray-600">Completed</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No fulfillment data available</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="fulfillment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Staff Performance Tracking
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analyticsData?.staffPerformance ? (
                <div className="space-y-4">
                  {Object.entries(
                    analyticsData.staffPerformance.reduce((acc: any, req: any) => {
                      const staff = req.profiles ? 
                        `${req.profiles.first_name} ${req.profiles.last_name}` : 
                        req.assigned_profiles ? 
                        `${req.assigned_profiles.first_name} ${req.assigned_profiles.last_name}` : 
                        'Unknown Staff';
                      
                      if (!acc[staff]) {
                        acc[staff] = { count: 0, totalTime: 0, totalCost: 0 };
                      }
                      acc[staff].count += 1;
                      acc[staff].totalTime += req.work_duration_minutes || 0;
                      acc[staff].totalCost += req.fulfillment_cost || 0;
                      return acc;
                    }, {})
                  ).map(([staff, metrics]: [string, any]) => (
                    <div key={staff} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{staff}</h4>
                        <Badge variant="outline">{metrics.count} requests</Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Avg Time</p>
                          <p className="font-medium">{Math.round(metrics.totalTime / metrics.count || 0)} min</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Total Cost</p>
                          <p className="font-medium">${metrics.totalCost.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Efficiency</p>
                          <p className="font-medium text-green-600">Good</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No staff performance data available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

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
                        <p className="text-sm text-gray-600">
                          {item.inventory_categories?.name || 'Uncategorized'}
                        </p>
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
                          {item.quantity} {item.unit} (Min: {item.minimum_quantity})
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
