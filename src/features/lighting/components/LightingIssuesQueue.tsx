import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Check, Lightbulb, Loader2, RefreshCw, X } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ModalFrame } from '@shared/components/common/common/ModalFrame';
import { formatDateTime } from '@/lib/dateTime';
import {
  listLightingIssuesForStaff,
  updateLightingIssueStatus,
  type StaffLightingIssue,
} from '@features/lighting/services/lightingIssueService';

const STATUS_BADGE: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  open: { label: 'Open', variant: 'destructive' },
  in_progress: { label: 'In progress', variant: 'default' },
  resolved: { label: 'Resolved', variant: 'secondary' },
};

const PRIORITY_BADGE: Record<string, { label: string; className: string }> = {
  high: { label: 'High', className: 'border-red-500/40 bg-red-500/10 text-red-300' },
  medium: { label: 'Medium', className: 'border-amber-500/40 bg-amber-500/10 text-amber-300' },
  low: { label: 'Low', className: 'border-muted-foreground/30 bg-muted/40 text-muted-foreground' },
};

export function LightingIssuesQueue() {
  const queryClient = useQueryClient();
  const [resolveTarget, setResolveTarget] = useState<StaffLightingIssue | null>(null);
  const [resolveNotes, setResolveNotes] = useState('');
  const [resolving, setResolving] = useState(false);

  const { data: issues = [], isLoading, isError, refetch } = useQuery<StaffLightingIssue[]>({
    queryKey: ['lighting-issues', 'staff'],
    queryFn: listLightingIssuesForStaff,
    retry: false,
  });

  const openCount = issues.filter((i) => i.status !== 'resolved').length;

  const change = async (id: string, status: 'in_progress' | 'resolved', options?: { resolutionNotes?: string }) => {
    try {
      await updateLightingIssueStatus(id, status, options);
    } catch (e) {
      toast.error(`Could not update the issue: ${(e as Error)?.message || 'unknown error'}`);
      return false;
    }
    await queryClient.invalidateQueries({ queryKey: ['lighting-issues'] });
    await queryClient.invalidateQueries({ queryKey: ['lighting-issues-open-count'] });
    toast.success(status === 'resolved' ? 'Issue resolved.' : 'Marked in progress.');
    return true;
  };

  const handleResolveSubmit = async () => {
    if (!resolveTarget) return;
    setResolving(true);
    const ok = await change(resolveTarget.id, 'resolved', {
      resolutionNotes: resolveNotes.trim() || undefined,
    });
    setResolving(false);
    if (ok) {
      setResolveTarget(null);
      setResolveNotes('');
    }
  };

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-amber-400" />
            Reported issues
            {openCount > 0 && <Badge variant="destructive">{openCount} open</Badge>}
          </h4>
          <Button variant="ghost" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : isError ? (
          <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm">
            <AlertCircle className="h-4 w-4 text-destructive" />
            Could not load lighting issues. Try refresh.
          </div>
        ) : issues.length === 0 ? (
          <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
            No lighting issues reported.
          </div>
        ) : (
          <div className="space-y-2">
            {issues.map((issue) => {
              const reporter = [issue.reporter?.first_name, issue.reporter?.last_name].filter(Boolean).join(' ')
                || issue.reporter?.email
                || 'Unknown';
              const location = issue.room?.room_number
                ? `Room ${issue.room.room_number}${issue.room.name ? ` — ${issue.room.name}` : ''}`
                : issue.location_description || 'Location not specified';
              const status = STATUS_BADGE[issue.status] || { label: issue.status, variant: 'outline' as const };
              const priority = PRIORITY_BADGE[issue.priority];
              return (
                <div key={issue.id} className="rounded-md border p-3 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-sm">{location}</span>
                    <Badge variant={status.variant}>{status.label}</Badge>
                    {priority && (
                      <span className={`rounded-md border px-1.5 py-0.5 text-[10px] uppercase tracking-wide ${priority.className}`}>
                        {priority.label}
                      </span>
                    )}
                    <Badge variant="outline" className="capitalize">{issue.issue_type.replace('_', ' ')}</Badge>
                  </div>
                  <p className="text-sm">{issue.description}</p>
                  <p className="text-xs text-muted-foreground">
                    Reported by {reporter} · {formatDateTime(issue.reported_at)}
                  </p>
                  {issue.resolution_notes && (
                    <p className="rounded-md border border-green-500/20 bg-green-500/5 p-2 text-xs text-green-200">
                      <span className="font-medium">Resolved: </span>{issue.resolution_notes}
                    </p>
                  )}
                  {issue.status !== 'resolved' && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {issue.status === 'open' && (
                        <Button size="sm" variant="outline" onClick={() => change(issue.id, 'in_progress')}>
                          Mark in progress
                        </Button>
                      )}
                      <Button size="sm" onClick={() => { setResolveTarget(issue); setResolveNotes(''); }}>
                        <Check className="mr-1.5 h-4 w-4" />
                        Resolve
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <ModalFrame
          open={!!resolveTarget}
          onOpenChange={(next) => {
            if (!next) { setResolveTarget(null); setResolveNotes(''); }
          }}
          title="Resolve lighting issue"
          description="Add a short note about what was done. The reporter will see this on their copy."
          size="sm"
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="lighting-resolve-notes">Resolution notes <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Textarea
                id="lighting-resolve-notes"
                value={resolveNotes}
                onChange={(e) => setResolveNotes(e.target.value)}
                placeholder="e.g. Replaced bulb in fixture B."
                rows={4}
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2 border-t pt-4">
              <Button type="button" variant="ghost" onClick={() => { setResolveTarget(null); setResolveNotes(''); }} disabled={resolving}>
                Cancel
              </Button>
              <Button type="button" onClick={handleResolveSubmit} disabled={resolving}>
                {resolving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                Mark resolved
              </Button>
            </div>
          </div>
        </ModalFrame>
      </CardContent>
    </Card>
  );
}
