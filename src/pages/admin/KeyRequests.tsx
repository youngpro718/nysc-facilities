import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Clock, CheckCircle, XCircle, Key, User, Calendar, Phone } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { useToast } from "@/hooks/use-toast";

interface KeyRequestWithUser {
  id: string;
  reason: string;
  status: string;
  created_at: string;
  updated_at: string;
  request_type: string;
  room_id: string | null;
  room_other: string | null;
  quantity: number;
  emergency_contact: string | null;
  admin_notes: string | null;
  email_notifications_enabled: boolean;
  user_id: string;
  profiles: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
  };
  rooms?: {
    name: string;
    room_number: string;
  };
}

const statusConfig = {
  pending: { icon: Clock, color: "text-yellow-600 bg-yellow-50", label: "Pending" },
  approved: { icon: CheckCircle, color: "text-green-600 bg-green-50", label: "Approved" },
  rejected: { icon: XCircle, color: "text-red-600 bg-red-50", label: "Rejected" },
  fulfilled: { icon: CheckCircle, color: "text-blue-600 bg-blue-50", label: "Fulfilled" },
};

export default function AdminKeyRequests() {
  const [requests, setRequests] = useState<KeyRequestWithUser[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<KeyRequestWithUser | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchParams] = useSearchParams();
  const highlightedId = searchParams.get('id');
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('key_requests')
        .select(`
          *,
          profiles!key_requests_user_id_fkey (
            first_name,
            last_name,
            email,
            phone
          ),
          rooms (
            name,
            room_number
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch key requests",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async () => {
    if (!selectedRequest || !actionType) return;

    try {
      const updates: any = {
        status: actionType === 'approve' ? 'approved' : 'rejected',
        admin_notes: adminNotes.trim() || null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('key_requests')
        .update(updates)
        .eq('id', selectedRequest.id);

      if (error) throw error;

      // Always create user notification and send email if opted in
      try {
        await supabase.functions.invoke('send-key-request-notification', {
          body: {
            to: selectedRequest.profiles.email,
            request: {
              ...selectedRequest,
              profiles: {
                ...selectedRequest.profiles,
                user_id: selectedRequest.user_id // Ensure user_id is accessible
              }
            },
            status: updates.status,
            admin_notes: adminNotes,
          }
        });
      } catch (notificationError) {
        console.error('Failed to send notification:', notificationError);
        // Don't block the main operation if notification fails
      }

      toast({
        title: "Success",
        description: `Request ${actionType === 'approve' ? 'approved' : 'rejected'} successfully`,
      });

      // Refresh requests
      fetchRequests();
      setSelectedRequest(null);
      setActionType(null);
      setAdminNotes("");

    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${actionType} request`,
        variant: "destructive",
      });
    }
  };

  const filteredRequests = requests.filter(request => 
    filterStatus === "all" || request.status === filterStatus
  );

  const getRequestTypeLabel = (type: string) => {
    switch (type) {
      case 'spare': return 'Spare Key';
      case 'replacement': return 'Replacement Key';
      case 'new': return 'New Access';
      default: return type;
    }
  };

  return (
    <PageContainer>
      <PageHeader 
        title="Key Requests Management" 
        description="Review and manage key access requests"
      >
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Requests</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="fulfilled">Fulfilled</SelectItem>
          </SelectContent>
        </Select>
      </PageHeader>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Loading requests...</div>
        </div>
      ) : filteredRequests.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Key className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No key requests</h3>
            <p className="text-muted-foreground">
              {filterStatus === "all" 
                ? "No key requests have been submitted yet." 
                : `No ${filterStatus} requests found.`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((request) => {
            const StatusIcon = statusConfig[request.status as keyof typeof statusConfig]?.icon || Clock;
            const statusStyle = statusConfig[request.status as keyof typeof statusConfig]?.color || "text-gray-600 bg-gray-50";
            const isHighlighted = request.id === highlightedId;

            return (
              <Card 
                key={request.id} 
                className={`transition-all ${isHighlighted ? 'ring-2 ring-primary border-primary' : ''}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-full ${statusStyle}`}>
                        <StatusIcon className="h-4 w-4" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {getRequestTypeLabel(request.request_type)}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Requested by {request.profiles.first_name} {request.profiles.last_name}
                        </p>
                      </div>
                    </div>
                    <Badge variant={statusConfig[request.status as keyof typeof statusConfig] ? "secondary" : "outline"}>
                      {statusConfig[request.status as keyof typeof statusConfig]?.label || request.status}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="font-medium text-sm text-muted-foreground mb-1">Reason</p>
                      <p className="text-sm">{request.reason}</p>
                    </div>
                    
                    <div>
                      <p className="font-medium text-sm text-muted-foreground mb-1">Room</p>
                      <p className="text-sm">
                        {request.rooms 
                          ? `${request.rooms.room_number} - ${request.rooms.name}`
                          : request.room_other || "Not specified"
                        }
                      </p>
                    </div>

                    <div>
                      <p className="font-medium text-sm text-muted-foreground mb-1">Quantity</p>
                      <p className="text-sm">{request.quantity} key(s)</p>
                    </div>

                    <div>
                      <p className="font-medium text-sm text-muted-foreground mb-1">Contact</p>
                      <p className="text-sm">{request.profiles.email}</p>
                      {request.emergency_contact && (
                        <p className="text-xs text-muted-foreground">{request.emergency_contact}</p>
                      )}
                    </div>
                  </div>

                  {request.admin_notes && (
                    <div>
                      <p className="font-medium text-sm text-muted-foreground mb-1">Admin Notes</p>
                      <p className="text-sm bg-muted p-2 rounded">{request.admin_notes}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="text-sm text-muted-foreground">
                      <p>Submitted: {format(new Date(request.created_at), "MMM d, yyyy 'at' h:mm a")}</p>
                      {request.updated_at !== request.created_at && (
                        <p>Updated: {format(new Date(request.updated_at), "MMM d, yyyy 'at' h:mm a")}</p>
                      )}
                    </div>

                    {request.status === 'pending' && (
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedRequest(request);
                            setActionType('reject');
                          }}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedRequest(request);
                            setActionType('approve');
                          }}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Action Dialog */}
      <Dialog open={!!selectedRequest && !!actionType} onOpenChange={() => {
        setSelectedRequest(null);
        setActionType(null);
        setAdminNotes("");
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' ? 'Approve' : 'Reject'} Key Request
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p>
              Are you sure you want to {actionType} this {selectedRequest?.request_type} key request 
              from {selectedRequest?.profiles.first_name} {selectedRequest?.profiles.last_name}?
            </p>
            
            <div>
              <Label htmlFor="notes">
                {actionType === 'reject' ? 'Rejection Reason (Required)' : 'Notes (Optional)'}
              </Label>
              <Textarea
                id="notes"
                placeholder={
                  actionType === 'reject' 
                    ? "Please provide a reason for rejection..."
                    : "Add any additional notes..."
                }
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                required={actionType === 'reject'}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setSelectedRequest(null);
              setActionType(null);
              setAdminNotes("");
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleAction}
              variant={actionType === 'reject' ? 'destructive' : 'default'}
              disabled={actionType === 'reject' && !adminNotes.trim()}
            >
              {actionType === 'approve' ? 'Approve' : 'Reject'} Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}