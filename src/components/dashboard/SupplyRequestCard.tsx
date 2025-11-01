import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useSupplyRequests } from '@/hooks/useSupplyRequests';
import { useAuth } from '@/hooks/useAuth';
import { SupplyRequestForm } from '@/components/supply-requests/SupplyRequestForm';
import { Package, Plus, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { NavLink } from 'react-router-dom';


export function SupplyRequestCard() {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const { data: requests = [], isLoading } = useSupplyRequests(user?.id);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
      case 'under_review':
        return <Clock className="h-4 w-4" />;
      case 'approved':
      case 'fulfilled':
        return <CheckCircle className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'under_review':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'fulfilled':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusDescription = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Awaiting review by admin';
      case 'under_review':
        return 'Being reviewed by supply team';
      case 'approved':
        return 'Approved - preparing for fulfillment';
      case 'fulfilled':
        return 'Request completed successfully';
      case 'rejected':
        return 'Request was rejected';
      case 'cancelled':
        return 'Request was cancelled';
      default:
        return 'Status unknown';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const recentRequests = requests.slice(0, 3);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Supply Requests
          </div>
          <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                New Request
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Submit Supply Request</DialogTitle>
              </DialogHeader>
              <SupplyRequestForm onSuccess={() => setShowForm(false)} />
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">Loading requests...</div>
        ) : requests.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No supply requests yet</p>
            <p className="text-sm">Click "New Request" to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recentRequests.map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {getStatusIcon(request.status)}
                    <h4 className="font-medium">{request.title}</h4>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <span>{new Date(request.created_at).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>{request.supply_request_items?.length || 0} items</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {getStatusDescription(request.status)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="outline" 
                    className={getPriorityColor(request.priority)}
                  >
                    {request.priority}
                  </Badge>
                  <Badge 
                    variant="outline" 
                    className={getStatusColor(request.status)}
                  >
                    {request.status.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
            ))}
            
            {requests.length > 3 && (
              <div className="text-center pt-2">
                <Button variant="outline" size="sm" asChild>
                  <NavLink to="/my-requests">View All Requests</NavLink>
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}