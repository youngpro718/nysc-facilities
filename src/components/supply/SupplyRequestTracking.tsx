// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useRolePermissions } from '@/hooks/useRolePermissions';
import { supabase } from '@/integrations/supabase/client';
import { 
  Package, 
  CheckCircle, 
  Clock, 
  XCircle, 
  AlertTriangle, 
  User,
  MapPin,
  Calendar,
  MessageSquare,
  Truck,
  ClipboardCheck,
  Eye,
  Edit,
  Send,
  Archive
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

interface SupplyRequest {
  id: string;
  title: string;
  description?: string;
  justification: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'submitted' | 'received' | 'processing' | 'ready' | 'picked_up' | 'completed' | 'cancelled';
  requested_delivery_date?: string;
  delivery_location?: string;
  pickup_location?: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
  requester_id: string;
  completed_at?: string;
  notes?: string;
  profiles: {
    first_name: string;
    last_name: string;
    email: string;
    department?: string;
  };
  supply_request_items: Array<{
    id: string;
    item_name: string;
    quantity_requested: number;
    quantity_fulfilled?: number;
    unit_cost?: number;
    notes?: string;
  }>;
  status_history: Array<{
    id: string;
    status: string;
    changed_by: string;
    changed_at: string;
    notes?: string;
    user_profile: {
      first_name: string;
      last_name: string;
    };
  }>;
}

interface SupplyRequestTrackingProps {
  userRole: 'requester' | 'supply_staff' | 'supply_manager';
}

export function SupplyRequestTracking({ userRole }: SupplyRequestTrackingProps) {
  const [requests, setRequests] = useState<SupplyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<SupplyRequest | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  const { toast } = useToast();
  const { user } = useAuth();
  const { permissions } = useRolePermissions();

  useEffect(() => {
    fetchRequests();
  }, [userRole]);

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
          supply_request_items (*),
          status_history:supply_request_status_history (
            *,
            user_profile:changed_by (
              first_name,
              last_name
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

  const updateRequestStatus = async (requestId: string, status: string, notes?: string) => {
    try {
      // Update the main request
      const { error: updateError } = await supabase
        .from('supply_requests')
        .update({ 
          status,
          updated_at: new Date().toISOString(),
          ...(status === 'completed' && { completed_at: new Date().toISOString() }),
          ...(status === 'processing' && { assigned_to: user?.id })
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      // Add to status history
      const { error: historyError } = await supabase
        .from('supply_request_status_history')
        .insert({
          request_id: requestId,
          status,
          changed_by: user?.id,
          changed_at: new Date().toISOString(),
          notes
        });

      if (historyError) throw historyError;

      toast({
        title: "Status Updated",
        description: `Request status changed to ${status}`,
      });

      // Refresh requests
      fetchRequests();
      setShowStatusDialog(false);
      setStatusNotes('');
      
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update request status",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      submitted: 'bg-blue-100 text-blue-800',
      received: 'bg-purple-100 text-purple-800',
      processing: 'bg-yellow-100 text-yellow-800',
      ready: 'bg-green-100 text-green-800',
      picked_up: 'bg-indigo-100 text-indigo-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };
    return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getAvailableStatusTransitions = (currentStatus: string) => {
    const transitions = {
      submitted: ['received', 'cancelled'],
      received: ['processing', 'cancelled'],
      processing: ['ready', 'cancelled'],
      ready: ['picked_up', 'completed'],
      picked_up: ['completed'],
      completed: [],
      cancelled: []
    };
    return transitions[currentStatus as keyof typeof transitions] || [];
  };

  const filteredRequests = requests.filter(request => {
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || request.priority === priorityFilter;
    return matchesStatus && matchesPriority;
  });

  const getRequestStats = () => {
    const stats = {
      total: requests.length,
      pending: requests.filter(r => ['submitted', 'received', 'processing'].includes(r.status)).length,
      ready: requests.filter(r => r.status === 'ready').length,
      completed: requests.filter(r => r.status === 'completed').length
    };
    return stats;
  };

  const stats = getRequestStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Clock className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading requests...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ready for Pickup</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.ready}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Archive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="received">Received</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="ready">Ready</SelectItem>
            <SelectItem value="picked_up">Picked Up</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Requests List */}
      <div className="grid gap-4">
        {filteredRequests.map((request) => (
          <Card key={request.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div>
                    <CardTitle className="text-lg">{request.title}</CardTitle>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge className={getStatusColor(request.status)}>
                        {request.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                      <Badge className={getPriorityColor(request.priority)}>
                        {request.priority.toUpperCase()}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        #{request.id.slice(-8)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedRequest(request)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                  {(userRole === 'supply_staff' || userRole === 'supply_manager') && (
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedRequest(request);
                        setShowStatusDialog(true);
                      }}
                      disabled={getAvailableStatusTransitions(request.status).length === 0}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Update Status
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Requester</div>
                  <div className="font-medium">
                    {request.profiles.first_name} {request.profiles.last_name}
                  </div>
                  <div className="text-sm text-muted-foreground">{request.profiles.department}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Items</div>
                  <div className="font-medium">{request.supply_request_items.length} items</div>
                  <div className="text-sm text-muted-foreground">
                    {request.supply_request_items.slice(0, 2).map(item => item.item_name).join(', ')}
                    {request.supply_request_items.length > 2 && '...'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Created</div>
                  <div className="font-medium">{format(new Date(request.created_at), 'MMM d, yyyy')}</div>
                  <div className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                  </div>
                </div>
              </div>
              
              {request.delivery_location && (
                <div className="mt-4 flex items-center text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 mr-1" />
                  Delivery: {request.delivery_location}
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {filteredRequests.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Requests Found</h3>
              <p className="text-muted-foreground">
                {statusFilter === 'all' && priorityFilter === 'all' 
                  ? "No supply requests to display."
                  : "No requests match the selected filters."
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Request Details Dialog */}
      {selectedRequest && (
        <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Request Details - #{selectedRequest.id.slice(-8)}</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Request Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2">Request Information</h4>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-muted-foreground">Title:</span>
                      <div className="font-medium">{selectedRequest.title}</div>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Description:</span>
                      <div>{selectedRequest.description || 'No description provided'}</div>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Justification:</span>
                      <div>{selectedRequest.justification}</div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Status & Priority</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(selectedRequest.status)}>
                        {selectedRequest.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                      <Badge className={getPriorityColor(selectedRequest.priority)}>
                        {selectedRequest.priority.toUpperCase()}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Created:</span>
                      <div>{format(new Date(selectedRequest.created_at), 'PPP p')}</div>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Last Updated:</span>
                      <div>{format(new Date(selectedRequest.updated_at), 'PPP p')}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div>
                <h4 className="font-medium mb-2">Requested Items</h4>
                <div className="border rounded-lg">
                  {selectedRequest.supply_request_items.map((item, index) => (
                    <div key={item.id} className={`p-3 ${index > 0 ? 'border-t' : ''}`}>
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">{item.item_name}</div>
                          {item.notes && (
                            <div className="text-sm text-muted-foreground">{item.notes}</div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="font-medium">Qty: {item.quantity_requested}</div>
                          {item.quantity_fulfilled !== undefined && (
                            <div className="text-sm text-muted-foreground">
                              Fulfilled: {item.quantity_fulfilled}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status History */}
              <div>
                <h4 className="font-medium mb-2">Status History</h4>
                <div className="space-y-2">
                  {selectedRequest.status_history
                    .sort((a, b) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime())
                    .map((history) => (
                    <div key={history.id} className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <Badge className={getStatusColor(history.status)}>
                            {history.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            by {history.user_profile.first_name} {history.user_profile.last_name}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {format(new Date(history.changed_at), 'PPP p')}
                        </div>
                        {history.notes && (
                          <div className="text-sm mt-1">{history.notes}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Status Update Dialog */}
      {showStatusDialog && selectedRequest && (
        <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Request Status</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label>Current Status</Label>
                <Badge className={getStatusColor(selectedRequest.status)}>
                  {selectedRequest.status.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
              
              <div>
                <Label htmlFor="new-status">New Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select new status" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableStatusTransitions(selectedRequest.status).map(status => (
                      <SelectItem key={status} value={status}>
                        {status.replace('_', ' ').toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="status-notes">Notes (Optional)</Label>
                <Textarea
                  id="status-notes"
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  placeholder="Add any notes about this status change..."
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowStatusDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => updateRequestStatus(selectedRequest.id, newStatus, statusNotes)}
                  disabled={!newStatus}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Update Status
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
