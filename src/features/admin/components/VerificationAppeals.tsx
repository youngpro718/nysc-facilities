import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CheckCircle2, XCircle, Clock, FileText, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface Appeal {
  id: string;
  user_id: string;
  appeal_reason: string;
  additional_info: string | null;
  submitted_at: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_at: string | null;
  reviewed_by: string | null;
  admin_notes: string | null;
  profiles: {
    id?: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  };
}

export function VerificationAppeals() {
  const queryClient = useQueryClient();
  const [selectedAppeal, setSelectedAppeal] = useState<Appeal | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | null>(null);
  const [adminNotes, setAdminNotes] = useState('');

  // Fetch pending appeals
  const { data: appeals, isLoading } = useQuery({
    queryKey: ['verification-appeals'],
    retry: false,
    enabled: false, // table not yet provisioned
    queryFn: async () => {
      const { data: appealsData, error: appealsError } = await supabase
        .from('verification_appeals')
        .select('*')
        .order('submitted_at', { ascending: false });

      // Table may not exist — treat as empty
      if (appealsError) return [] as Appeal[];

      const rows = appealsData ?? [];
      if (rows.length === 0) return [] as Appeal[];

      const userIds = [...new Set(rows.map((appeal) => appeal.user_id))];
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      const profileMap = new Map(
        (profilesData ?? []).map((profile) => [profile.id, profile])
      );

      return rows.map((appeal) => ({
        ...appeal,
        profiles: profileMap.get(appeal.user_id) ?? {
          id: appeal.user_id,
          first_name: null,
          last_name: null,
          email: null,
        },
      })) as Appeal[];
    },
  });

  // Approve appeal mutation
  const approveMutation = useMutation({
    mutationFn: async ({ appealId, notes }: { appealId: string; notes: string }) => {
      const { error } = await supabase.rpc('approve_verification_appeal', {
        p_appeal_id: appealId,
        p_admin_notes: notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['verification-appeals'] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Appeal approved - user reset to pending status');
      handleCloseDialog();
    },
    onError: (error) => {
      logger.error('[VerificationAppeals] Failed to approve appeal:', error);
      toast.error('Failed to approve appeal');
    },
  });

  // Reject appeal mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ appealId, notes }: { appealId: string; notes: string }) => {
      const { error } = await supabase.rpc('reject_verification_appeal', {
        p_appeal_id: appealId,
        p_admin_notes: notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['verification-appeals'] });
      toast.success('Appeal rejected');
      handleCloseDialog();
    },
    onError: (error) => {
      logger.error('[VerificationAppeals] Failed to reject appeal:', error);
      toast.error('Failed to reject appeal');
    },
  });

  const handleOpenReviewDialog = (appeal: Appeal, action: 'approve' | 'reject') => {
    setSelectedAppeal(appeal);
    setReviewAction(action);
    setAdminNotes('');
    setReviewDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setReviewDialogOpen(false);
    setSelectedAppeal(null);
    setReviewAction(null);
    setAdminNotes('');
  };

  const handleSubmitReview = () => {
    if (!selectedAppeal || !reviewAction) return;

    if (reviewAction === 'approve') {
      approveMutation.mutate({ appealId: selectedAppeal.id, notes: adminNotes });
    } else {
      rejectMutation.mutate({ appealId: selectedAppeal.id, notes: adminNotes });
    }
  };

  const pendingAppeals = appeals?.filter((a) => a.status === 'pending') || [];
  const reviewedAppeals = appeals?.filter((a) => a.status !== 'pending') || [];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Verification Appeals</CardTitle>
          <CardDescription>Review user appeals for account access</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Verification Appeals</CardTitle>
          <CardDescription>
            Review appeals from rejected users requesting account re-evaluation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Pending Appeals */}
          <div>
            <h3 className="text-sm font-medium mb-3">
              Pending Appeals ({pendingAppeals.length})
            </h3>
            {pendingAppeals.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">No pending appeals</p>
            ) : (
              <div className="space-y-3">
                {pendingAppeals.map((appeal) => (
                  <div
                    key={appeal.id}
                    className="border rounded-lg p-4 space-y-3 hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-sm">
                            {appeal.profiles.first_name} {appeal.profiles.last_name}
                          </p>
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                            <Clock className="h-3 w-3 mr-1" />
                            Pending
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{appeal.profiles.email}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Submitted {formatDistanceToNow(new Date(appeal.submitted_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Reason:</p>
                        <p className="text-sm">{appeal.appeal_reason}</p>
                      </div>
                      {appeal.additional_info && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">
                            Additional Info:
                          </p>
                          <p className="text-sm text-muted-foreground">{appeal.additional_info}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        onClick={() => handleOpenReviewDialog(appeal, 'approve')}
                        className="flex-1"
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenReviewDialog(appeal, 'reject')}
                        className="flex-1"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Reviewed Appeals */}
          {reviewedAppeals.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-3">
                Recently Reviewed ({reviewedAppeals.length})
              </h3>
              <div className="space-y-2">
                {reviewedAppeals.slice(0, 5).map((appeal) => (
                  <div
                    key={appeal.id}
                    className="border rounded-lg p-3 text-sm bg-muted/30"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">
                          {appeal.profiles.first_name} {appeal.profiles.last_name}
                        </p>
                        <Badge
                          variant={appeal.status === 'approved' ? 'default' : 'secondary'}
                          className={
                            appeal.status === 'approved'
                              ? 'bg-green-50 text-green-700 border-green-200'
                              : 'bg-red-50 text-red-700 border-red-200'
                          }
                        >
                          {appeal.status === 'approved' ? 'Approved' : 'Rejected'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {appeal.reviewed_at &&
                          formatDistanceToNow(new Date(appeal.reviewed_at), { addSuffix: true })}
                      </p>
                    </div>
                    {appeal.admin_notes && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Note: {appeal.admin_notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewAction === 'approve' ? 'Approve Appeal' : 'Reject Appeal'}
            </DialogTitle>
            <DialogDescription>
              {reviewAction === 'approve'
                ? 'This will reset the user to pending status for re-review.'
                : 'This will keep the user in rejected status.'}
            </DialogDescription>
          </DialogHeader>

          {selectedAppeal && (
            <div className="space-y-4 py-4">
              <div className="rounded-lg bg-muted p-3 space-y-2">
                <p className="text-sm font-medium">
                  {selectedAppeal.profiles.first_name} {selectedAppeal.profiles.last_name}
                </p>
                <p className="text-xs text-muted-foreground">{selectedAppeal.profiles.email}</p>
                <div className="pt-2 border-t">
                  <p className="text-xs font-medium mb-1">Appeal Reason:</p>
                  <p className="text-sm">{selectedAppeal.appeal_reason}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-notes">Admin Notes (Optional)</Label>
                <Textarea
                  id="admin-notes"
                  placeholder="Add notes explaining your decision..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitReview}
              disabled={approveMutation.isPending || rejectMutation.isPending}
              variant={reviewAction === 'approve' ? 'default' : 'destructive'}
            >
              {(approveMutation.isPending || rejectMutation.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {reviewAction === 'approve' ? 'Approve Appeal' : 'Reject Appeal'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
