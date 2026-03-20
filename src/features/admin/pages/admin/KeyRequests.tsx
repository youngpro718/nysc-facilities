import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Clock, CheckCircle, XCircle, Key, User, Calendar, Phone } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@features/auth/hooks/useAuth";
import { logger } from "@/lib/logger";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { useToast } from "@shared/hooks/use-toast";
import { Breadcrumb } from "@/components/layout/Breadcrumb";

interface KeyRequestWithUser {
  id: string;
  key_id: string | null;
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
  pending: { icon: Clock, color: "text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/30", label: "Pending" },
  approved: { icon: CheckCircle, color: "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30", label: "Approved" },
  rejected: { icon: XCircle, color: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30", label: "Rejected" },
  fulfilled: { icon: CheckCircle, color: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30", label: "Fulfilled" },
};

export default function AdminKeyRequests() {
  const [requests, setRequests] = useState<KeyRequestWithUser[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<KeyRequestWithUser | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'fulfill' | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [selectedKeyId, setSelectedKeyId] = useState<string>("");
  const [availableKeys, setAvailableKeys] = useState<Array<{ id: string; name: string; type: string; available_quantity: number }>>([]);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [searchParams] = useSearchParams();
  const highlightedId = searchParams.get('id');
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchRequests();
    fetchAvailableKeys();
  }, []);

  useEffect(() => {
    if (actionType === 'fulfill') {
      setSelectedKeyId(selectedRequest?.key_id || availableKeys[0]?.id || '');
    }
  }, [actionType, selectedRequest, availableKeys]);

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('key_requests')
        .select(`
          *,
          profiles:user_id (
            first_name,
            last_name,
            email,
            phone
          ),
          rooms:room_id (
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

  const fetchAvailableKeys = async () => {
    try {
      const { data, error } = await supabase
        .from('keys')
        .select('id, name, type, available_quantity')
        .order('name', { ascending: true });

      if (error) throw error;
      setAvailableKeys((data || []).filter((key) => (key.available_quantity ?? 0) > 0));
    } catch (error) {
      logger.warn('Failed to fetch key inventory for fulfillment selector:', error);
      setAvailableKeys([]);
    }
  };

  const handleAction = async () => {
    if (!selectedRequest || !actionType || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const now = new Date().toISOString();
      const updates: Record<string, unknown> = {
        status: actionType === 'approve' ? 'approved' : actionType === 'reject' ? 'rejected' : 'fulfilled',
        admin_notes: adminNotes.trim() || null,
        last_status_change: now,
        updated_at: now,
      };

      if (actionType === 'approve') {
        updates.approved_at = now;
        updates.approved_by = user?.id || null;
      }

      if (actionType === 'reject') {
        updates.rejected_at = now;
        updates.rejected_by = user?.id || null;
        updates.rejection_reason = adminNotes.trim() || null;
      }

      if (actionType === 'fulfill') {
        updates.fulfillment_notes = adminNotes.trim() || null;
      }

      const { error } = await supabase
        .from('key_requests')
        .update(updates)
        .eq('id', selectedRequest.id);

      if (error) throw error;

      if (actionType === 'fulfill' && selectedKeyId) {
        const { error: assignmentError } = await supabase
          .from('key_assignments')
          .insert({
            key_id: selectedKeyId,
            occupant_id: selectedRequest.user_id,
            assigned_at: now,
            is_spare: false,
            spare_key_reason: null,
          });

        if (assignmentError) {
          await supabase
            .from('key_requests')
            .update({
              status: selectedRequest.status,
              admin_notes: selectedRequest.admin_notes,
              updated_at: now,
            })
            .eq('id', selectedRequest.id);

          throw assignmentError;
        }
      }

      try {
        await supabase.from('admin_actions_log').insert({
          performed_by: user?.id,
          action_type: `key_request_${actionType}`,
          target_id: selectedRequest.id,
          target_type: 'key_request',
          details: {
            request_type: selectedRequest.request_type,
            user_id: selectedRequest.user_id,
            room: selectedRequest.rooms?.room_number ?? selectedRequest.room_other,
            key_id: selectedKeyId || selectedRequest.key_id || null,
            notes: adminNotes.trim() || null,
          },
        });
      } catch (auditError) {
        logger.error('Failed to write admin action audit log:', auditError);
      }

      const roomInfo = selectedRequest.rooms 
        ? `${selectedRequest.rooms.room_number} - ${selectedRequest.rooms.name}`
        : selectedRequest.room_other || 'unspecified room';
      const selectedKey = availableKeys.find((key) => key.id === selectedKeyId);
      const selectedKeyLabel = selectedKey ? `${selectedKey.name} (${selectedKey.type})` : null;
      const notificationType = actionType === 'approve'
        ? 'key_request_approved'
        : actionType === 'reject'
          ? 'key_request_denied'
          : 'key_request_fulfilled';
      const notificationTitle = actionType === 'approve'
        ? 'Key Request Approved'
        : actionType === 'reject'
          ? 'Key Request Denied'
          : 'Key Request Fulfilled';
      const notificationMessage = actionType === 'approve'
        ? `Your ${selectedRequest.request_type} key request for ${roomInfo} has been approved. The key ordering process will begin shortly.`
        : actionType === 'reject'
          ? `Your ${selectedRequest.request_type} key request for ${roomInfo} has been denied. ${adminNotes ? `Reason: ${adminNotes}` : ''}`
          : `Your ${selectedRequest.request_type} key request for ${roomInfo} has been fulfilled.${selectedKeyLabel ? ` Key issued: ${selectedKeyLabel}.` : ''}`;

      try {
        logger.debug('Starting notification process for user:', selectedRequest.user_id);
        logger.debug('Request data:', selectedRequest);
        
        const functionResponse = await supabase.functions.invoke('send-key-request-notification', {
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
            key_label: selectedKeyLabel,
          }
        });
        
        logger.debug('Function response:', functionResponse);
        
        if (functionResponse.error) {
          logger.error('Edge function error:', functionResponse.error);
          throw new Error('Edge function failed');
        }
        
        logger.debug('Notification sent successfully via edge function');
      } catch (notificationError) {
        logger.error('Edge function failed, creating notification directly:', notificationError);
        
        // Fallback: Create notification directly in database
        try {
          const { error: directNotificationError } = await supabase
            .from('user_notifications')
            .insert({
              user_id: selectedRequest.user_id,
              type: notificationType,
              title: notificationTitle,
              message: notificationMessage,
              urgency: updates.status === 'approved' ? 'medium' : 'high',
              action_url: '/my-requests',
              metadata: {
                request_id: selectedRequest.id,
                request_type: selectedRequest.request_type,
                room_info: selectedRequest.rooms 
                  ? `${selectedRequest.rooms.room_number} - ${selectedRequest.rooms.name}`
                  : selectedRequest.room_other || 'unspecified room',
                admin_notes: adminNotes,
                key_label: availableKeys.find((key) => key.id === selectedKeyId)?.name || null,
              },
              related_id: selectedRequest.id
            });

          if (directNotificationError) {
            logger.error('Failed to create direct notification:', directNotificationError);
          } else {
            logger.debug('Direct notification created successfully');
          }
        } catch (directError) {
          logger.error('Direct notification creation also failed:', directError);
        }
      }

      toast({
        title: "Success",
        description: `Request ${actionType === 'approve' ? 'approved' : actionType === 'reject' ? 'rejected' : 'fulfilled'} successfully`,
      });

      // Refresh requests
      fetchRequests();
      setSelectedRequest(null);
      setActionType(null);
      setAdminNotes("");
      setSelectedKeyId("");

    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${actionType} request`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
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
      <Breadcrumb />
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
                          Requested by {(request.profiles?.first_name || 'Unknown')} {(request.profiles?.last_name || '')}
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
                      <p className="text-sm">{request.profiles?.email || '—'}</p>
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

                    {request.status === 'approved' && (
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedRequest(request);
                            setActionType('fulfill');
                            setSelectedKeyId(request.key_id || availableKeys[0]?.id || '');
                          }}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Mark Fulfilled
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
              {actionType === 'approve' ? 'Approve' : actionType === 'reject' ? 'Reject' : 'Fulfill'} Key Request
            </DialogTitle>
            <DialogDescription>
              {actionType === 'fulfill'
                ? 'Confirm this key has been physically issued and optionally link the key record.'
                : 'Confirm your action and optionally provide notes for the requester.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <p>
              {actionType === 'fulfill'
                ? `Confirm this ${selectedRequest?.request_type} key request has been physically issued to ${(selectedRequest?.profiles?.first_name || 'Unknown')} ${(selectedRequest?.profiles?.last_name || '')}?`
                : `Are you sure you want to ${actionType} this ${selectedRequest?.request_type} key request from ${(selectedRequest?.profiles?.first_name || 'Unknown')} ${(selectedRequest?.profiles?.last_name || '')}?`}
            </p>

            {actionType === 'fulfill' && (
              <div>
                <Label htmlFor="key-select">
                  Link key inventory item (optional)
                </Label>
                <Select value={selectedKeyId} onValueChange={setSelectedKeyId}>
                  <SelectTrigger id="key-select">
                    <SelectValue placeholder="Select a key to assign" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No key assignment</SelectItem>
                    {availableKeys.map((key) => (
                      <SelectItem key={key.id} value={key.id}>
                        {key.name} — {key.type} ({key.available_quantity} available)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div>
              <Label htmlFor="notes">
                {actionType === 'reject' ? 'Rejection Reason (Required)' : 'Notes (Optional)'}
              </Label>
              <Textarea
                id="notes"
                placeholder={
                  actionType === 'reject' 
                    ? "Please provide a reason for rejection..."
                    : actionType === 'fulfill'
                      ? "Add any fulfillment notes..."
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
              setSelectedKeyId("");
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleAction}
              variant={actionType === 'reject' ? 'destructive' : 'default'}
              disabled={isSubmitting || (actionType === 'reject' && !adminNotes.trim())}
            >
              {isSubmitting
                ? 'Saving...'
                : actionType === 'approve'
                  ? 'Approve'
                  : actionType === 'reject'
                    ? 'Reject'
                    : 'Mark Fulfilled'} Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}