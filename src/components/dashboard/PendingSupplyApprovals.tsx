import { useState } from "react";
import { logger } from '@/lib/logger';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle, XCircle, Package, User } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { updateSupplyRequestStatus, updateSupplyRequestItems } from "@/lib/supabase";

interface PendingRequest {
  id: string;
  title: string;
  justification: string;
  priority: string;
  status: string;
  created_at: string;
  requester_id: string;
  profiles: {
    first_name: string;
    last_name: string;
  } | null;
  supply_request_items: Array<{
    id: string;
    item_id: string;
    quantity_requested: number;
    inventory_items: {
      name: string;
    } | null;
  }>;
}

export function PendingSupplyApprovals() {
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<PendingRequest | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [notes, setNotes] = useState("");

  const { data: pendingRequests = [], isLoading } = useQuery({
    queryKey: ['pending-supply-approvals'],
    queryFn: async () => {
      // Fetch requests that need approval
      const { data, error } = await supabase
        .from('supply_requests')
        .select(`
          id,
          title,
          justification,
          priority,
          status,
          created_at,
          requester_id,
          profiles:requester_id (first_name, last_name),
          supply_request_items (
            id,
            item_id,
            quantity_requested,
            inventory_items (name)
          )
        `)
        .or('status.eq.pending_approval,and(justification.ilike.%[APPROVAL REQUIRED]%,status.not.in.(approved,rejected,completed,cancelled))')
        .order('created_at', { ascending: false });

      if (error) throw error;
      // Normalize Supabase's array-based profile join to a single object
      return (data || []).map(r => ({
        ...r,
        profiles: Array.isArray(r.profiles) ? r.profiles[0] || null : r.profiles,
        supply_request_items: (r.supply_request_items || []).map((item: Record<string, unknown>) => ({
          ...item,
          inventory_items: Array.isArray(item.inventory_items) ? item.inventory_items[0] || null : item.inventory_items,
        })),
      })) as PendingRequest[];
    },
    staleTime: 30 * 1000, // 30 seconds
  });

  const handleAction = async () => {
    if (!selectedRequest || !actionType) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Authentication required');

      const newStatus = actionType === 'approve' ? 'approved' : 'rejected';
      const statusUpdates: Record<string, unknown> = {};

      if (actionType === 'approve') {
        statusUpdates.approved_by = user.id;
        statusUpdates.approved_at = new Date().toISOString();
        statusUpdates.approval_notes = notes.trim() || null;
        statusUpdates.rejection_reason = null;

        // Auto-approve all quantities
        const itemUpdates = selectedRequest.supply_request_items.map(item => ({
          id: item.id,
          quantity_approved: item.quantity_requested,
          notes: null,
        }));
        if (itemUpdates.length > 0) {
          await updateSupplyRequestItems(selectedRequest.id, itemUpdates);
        }
      } else {
        statusUpdates.rejection_reason = notes.trim();
        statusUpdates.approval_notes = null;
        statusUpdates.approved_by = null;
        statusUpdates.approved_at = null;
      }

      await updateSupplyRequestStatus(selectedRequest.id, newStatus, statusUpdates);

      toast.success(`Request ${newStatus} successfully`);
      queryClient.invalidateQueries({ queryKey: ['pending-supply-approvals'] });
      queryClient.invalidateQueries({ queryKey: ['supply-pending-counts'] });
      
      setSelectedRequest(null);
      setActionType(null);
      setNotes("");
    } catch (error) {
      logger.error('Failed to update request:', error);
      toast.error('Failed to update request');
    }
  };

  // Don't render if no pending approvals
  if (isLoading || pendingRequests.length === 0) {
    return null;
  }

  return (
    <>
      <Card className="border-orange-500/50 bg-orange-500/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
            <AlertTriangle className="h-5 w-5" />
            Pending Approvals ({pendingRequests.length})
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Restricted items require your approval before fulfillment can begin.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {pendingRequests.slice(0, 5).map((request) => (
            <div 
              key={request.id} 
              className="flex items-center justify-between p-3 bg-background border rounded-lg"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium truncate">{request.title}</p>
                  <Badge variant="outline" className="text-xs shrink-0">
                    {request.priority}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {request.profiles?.first_name} {request.profiles?.last_name} 
                  <span className="mx-1">•</span>
                  <Package className="h-3 w-3" />
                  {request.supply_request_items?.length || 0} items
                </p>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                  {request.justification?.replace('[APPROVAL REQUIRED] ', '')}
                </p>
              </div>
              <div className="flex gap-2 ml-3 shrink-0">
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => {
                    setSelectedRequest(request);
                    setActionType('approve');
                  }}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    setSelectedRequest(request);
                    setActionType('reject');
                  }}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Reject
                </Button>
              </div>
            </div>
          ))}
          {pendingRequests.length > 5 && (
            <p className="text-sm text-muted-foreground text-center pt-2">
              +{pendingRequests.length - 5} more pending approvals
            </p>
          )}
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <Dialog open={!!selectedRequest && !!actionType} onOpenChange={() => {
        setSelectedRequest(null);
        setActionType(null);
        setNotes("");
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' ? 'Approve Request' : 'Reject Request'}
            </DialogTitle>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-4">
              <div>
                <p className="font-medium">{selectedRequest.title}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedRequest.profiles?.first_name} {selectedRequest.profiles?.last_name}
                </p>
              </div>

              <div className="border rounded-lg p-3 bg-muted/50">
                <p className="text-sm font-medium mb-2">Items Requested:</p>
                <ul className="text-sm space-y-1">
                  {selectedRequest.supply_request_items.map(item => (
                    <li key={item.id} className="flex justify-between">
                      <span>{item.inventory_items?.name || 'Unknown Item'}</span>
                      <span className="text-muted-foreground">×{item.quantity_requested}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <Label htmlFor="notes">
                  {actionType === 'approve' ? 'Approval Notes (optional)' : 'Rejection Reason'}
                </Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={actionType === 'reject' ? 'Please provide a reason...' : 'Add any notes...'}
                  className="mt-1"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setSelectedRequest(null);
              setActionType(null);
              setNotes("");
            }}>
              Cancel
            </Button>
            <Button 
              variant={actionType === 'reject' ? 'destructive' : 'default'}
              onClick={handleAction}
              disabled={actionType === 'reject' && !notes.trim()}
            >
              {actionType === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
