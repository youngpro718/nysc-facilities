import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Search, Filter, Bell, Users, Clock, CheckCircle, XCircle } from "lucide-react";
import { AdminKeyRequestCard } from "./AdminKeyRequestCard";
import { useKeyRequests } from "@/hooks/useKeyRequests";
import { useUpdateKeyRequestStatus } from "@/hooks/useKeyRequestWorkflow";
import { useAdminNotifications } from "@/hooks/useAdminNotifications";
import { toast } from "sonner";

export function AdminKeyRequestsSection() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const { data: allRequests, isLoading } = useKeyRequests();
  const { data: notifications } = useAdminNotifications();
  const updateStatus = useUpdateKeyRequestStatus();

  // Filter requests
  const filteredRequests = (allRequests || []).filter(request => {
    const matchesSearch = !searchQuery || 
      request.reason?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.room_other?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Get stats
  const stats = {
    total: (allRequests || []).length,
    pending: (allRequests || []).filter(r => r.status === 'pending').length,
    underReview: (allRequests || []).filter(r => r.status === 'under_review').length,
    approved: (allRequests || []).filter(r => r.status === 'approved').length,
    rejected: (allRequests || []).filter(r => r.status === 'rejected').length,
  };

  const unreadNotifications = (notifications || []).filter(n => 
    n.notification_type === 'new_key_request' && 
    !(n.read_by || []).includes('current-user') // TODO: Replace with actual user ID
  ).length;

  const handleApprove = (requestId: string) => {
    setSelectedRequest(requestId);
    setActionType('approve');
  };

  const handleReject = (requestId: string) => {
    setSelectedRequest(requestId);
    setActionType('reject');
  };

  const handleConfirmAction = async () => {
    if (!selectedRequest || !actionType) return;

    try {
      await updateStatus.mutateAsync({
        requestId: selectedRequest,
        status: actionType === 'approve' ? 'approved' : 'rejected',
        rejectionReason: actionType === 'reject' ? rejectionReason : undefined,
      });

      toast.success(
        actionType === 'approve' 
          ? 'Request approved successfully' 
          : 'Request rejected successfully'
      );
      
      setSelectedRequest(null);
      setActionType(null);
      setRejectionReason("");
    } catch (error) {
      toast.error('Failed to update request status');
    }
  };

  const handleViewWorkflow = (requestId: string) => {
    // TODO: Open workflow dialog
    console.log('View workflow for request:', requestId);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-muted rounded w-1/3"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
              <div className="h-4 bg-muted rounded w-1/4"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Requests</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold">{stats.pending}</p>
              {unreadNotifications > 0 && (
                <Badge variant="destructive" className="text-xs">
                  <Bell className="h-3 w-3 mr-1" />
                  {unreadNotifications} new
                </Badge>
              )}
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Filter className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Under Review</p>
              <p className="text-2xl font-bold">{stats.underReview}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Approved</p>
              <p className="text-2xl font-bold">{stats.approved}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Rejected</p>
              <p className="text-2xl font-bold">{stats.rejected}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by reason or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="under_review">Under Review</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="fulfilled">Fulfilled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Request Cards */}
      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No key requests found matching your criteria.</p>
          </Card>
        ) : (
          filteredRequests.map((request) => (
            <AdminKeyRequestCard
              key={request.id}
              request={request}
              onApprove={handleApprove}
              onReject={handleReject}
              onViewWorkflow={handleViewWorkflow}
            />
          ))
        )}
      </div>

      {/* Action Dialog */}
      <Dialog 
        open={!!selectedRequest && !!actionType} 
        onOpenChange={() => {
          setSelectedRequest(null);
          setActionType(null);
          setRejectionReason("");
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' ? 'Approve Request' : 'Reject Request'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p>
              Are you sure you want to {actionType} this key request?
            </p>
            
            {actionType === 'reject' && (
              <div>
                <label className="text-sm font-medium">Rejection Reason</label>
                <Textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Please provide a reason for rejection..."
                  className="mt-1"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setSelectedRequest(null);
                setActionType(null);
                setRejectionReason("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmAction}
              disabled={actionType === 'reject' && !rejectionReason.trim()}
              className={actionType === 'approve' ? 'bg-green-600 hover:bg-green-700' : ''}
            >
              {actionType === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}