import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Check, KeyRound, Loader2, RefreshCw, X } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatDateTime } from '@/lib/dateTime';
import {
  listKeyRequestsForStaff,
  updateKeyRequestStatus,
  type StaffKeyRequest,
} from '@features/keys/services/keyRequestService';

export function KeyRequestsSection() {
  const queryClient = useQueryClient();
  const { data: requests = [], isLoading, isError, error, refetch } = useQuery<StaffKeyRequest[]>({
    queryKey: ['key-requests', 'staff'],
    queryFn: listKeyRequestsForStaff,
    retry: false,
  });

  const updateStatus = async (id: string, status: 'approved' | 'rejected' | 'ready' | 'fulfilled') => {
    try {
      await updateKeyRequestStatus(id, status);
    } catch {
      toast.error('Could not update the key request.');
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ['key-requests'] });
    toast.success(`Key request marked ${status}.`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading key requests…
      </div>
    );
  }

  if (isError) {
    const missingTable = String((error as { code?: string; message?: string })?.code || '').includes('PGRST205')
      || String((error as { message?: string })?.message || '').includes('key_requests');
    return (
      <div className="flex flex-col items-center justify-center rounded-md border border-destructive/30 bg-destructive/5 py-12 px-4 text-center">
        <AlertCircle className="mb-3 h-8 w-8 text-destructive" />
        <p className="font-medium">
          {missingTable ? 'Key requests are not enabled yet' : 'Could not load key requests'}
        </p>
        <p className="mt-1 max-w-lg text-sm text-muted-foreground">
          {missingTable
            ? 'Deploy database migration 077_restore_key_requests_and_supply_ids.sql to enable this workflow.'
            : 'Check the connection and try again.'}
        </p>
        <Button className="mt-4" variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Try again
        </Button>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-md border border-dashed py-12 text-center">
        <KeyRound className="mb-3 h-8 w-8 text-muted-foreground" />
        <p className="font-medium">No key requests</p>
        <p className="mt-1 text-sm text-muted-foreground">New user requests will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {requests.map((request) => {
        const requester = [request.profiles?.first_name, request.profiles?.last_name].filter(Boolean).join(' ')
          || request.profiles?.email
          || 'Unknown requester';
        const location = request.rooms?.room_number
          ? `Room ${request.rooms.room_number}`
          : request.room_other || 'Location not specified';
        return (
          <Card key={request.id}>
            <CardContent className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">{requester}</p>
                  <Badge variant="outline" className="capitalize">{request.request_type}</Badge>
                  <Badge variant="secondary" className="capitalize">{request.status}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {location} · {request.quantity} key{request.quantity === 1 ? '' : 's'} · {formatDateTime(request.created_at)}
                </p>
                <p className="mt-2 text-sm">{request.reason}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {request.status === 'pending' && (
                  <>
                    <Button size="sm" onClick={() => updateStatus(request.id, 'approved')}>
                      <Check className="mr-1.5 h-4 w-4" />
                      Approve
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => updateStatus(request.id, 'rejected')}>
                      <X className="mr-1.5 h-4 w-4" />
                      Reject
                    </Button>
                  </>
                )}
                {request.status === 'approved' && (
                  <Button size="sm" onClick={() => updateStatus(request.id, 'ready')}>Mark ready</Button>
                )}
                {request.status === 'ready' && (
                  <Button size="sm" onClick={() => updateStatus(request.id, 'fulfilled')}>Mark issued</Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
