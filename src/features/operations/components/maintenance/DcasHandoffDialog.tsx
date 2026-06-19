/**
 * DCAS handoff coordination dialog.
 *
 * Opens from any scheduled maintenance item. The user gets a copyable summary
 * to paste into Archibus / email to DCAS, plus a small form to log what they
 * filed (ticket #, status). The app never talks to DCAS directly — this just
 * records that the human-side coordination happened.
 */

import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Copy, ExternalLink, CheckCircle2, AlertTriangle } from 'lucide-react';
import { ModalFrame } from '@shared/components/common/common/ModalFrame';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@shared/hooks/use-toast';
import {
  buildHandoffSummary,
  updateMaintenanceHandoff,
  type HandoffStatus,
  type MaintenanceWithHandoff,
} from '@features/operations/services/maintenanceHandoff';

interface DcasHandoffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: MaintenanceWithHandoff | null;
}

const STATUS_OPTIONS: { value: HandoffStatus; label: string; help: string }[] = [
  {
    value: 'not_notified',
    label: 'Not yet notified',
    help: "DCAS hasn't been told about this work yet.",
  },
  {
    value: 'notified',
    label: 'Notified (no ticket yet)',
    help: 'Verbally or by email — formal ticket still to come.',
  },
  {
    value: 'filed',
    label: 'Ticket filed',
    help: 'An Archibus / work-order number exists.',
  },
  {
    value: 'confirmed',
    label: 'Vendor confirmed',
    help: 'DCAS has acknowledged and committed to the schedule.',
  },
  {
    value: 'not_required',
    label: 'No external coordination needed',
    help: 'This entry is internal-only — no DCAS handoff required.',
  },
];

export function DcasHandoffDialog({ open, onOpenChange, item }: DcasHandoffDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<HandoffStatus>('not_notified');
  const [system, setSystem] = useState('DCAS / Archibus');
  const [ticketNumber, setTicketNumber] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (item) {
      setStatus(item.external_ticket_status);
      setSystem(item.external_system || 'DCAS / Archibus');
      setTicketNumber(item.external_ticket_number || '');
      setCopied(false);
    }
  }, [item, open]);

  const save = useMutation({
    mutationFn: async () => {
      if (!item) throw new Error('No item');
      await updateMaintenanceHandoff(item.id, {
        status,
        external_system: system.trim() || null,
        external_ticket_number: ticketNumber.trim() || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-schedules'] });
      queryClient.invalidateQueries({ queryKey: ['pending-dcas-handoffs'] });
      queryClient.invalidateQueries({ queryKey: ['maintenance-calendar'] });
      queryClient.invalidateQueries({ queryKey: ['maintenance-stats'] });
      toast({
        title: 'Handoff updated',
        description: 'DCAS coordination status saved.',
      });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Could not save',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  if (!item) return null;

  const summary = buildHandoffSummary(item);

  const copySummary = async () => {
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select + execCommand is unreliable; just toast.
      toast({
        title: 'Could not copy',
        description: 'Select the text manually and copy.',
        variant: 'destructive',
      });
    }
  };

  const selectedOption = STATUS_OPTIONS.find(o => o.value === status);

  return (
    <ModalFrame
      open={open}
      onOpenChange={onOpenChange}
      size="lg"
      title="Notify DCAS"
      description="Copy the summary and file the ticket with DCAS, then log it here so the team can see it's handed off."
    >
      <div className="space-y-5">
        {/* 1. Copyable summary block */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Summary to paste into Archibus or email</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={copySummary}
              className="h-8"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1.5 text-emerald-500" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 mr-1.5" />
                  Copy summary
                </>
              )}
            </Button>
          </div>
          <Textarea
            readOnly
            value={summary}
            className="font-mono text-xs leading-relaxed min-h-[140px] tabular"
            onClick={(e) => (e.target as HTMLTextAreaElement).select()}
          />
        </div>

        {/* 2. Log what was filed */}
        <div className="rounded-md border border-border bg-muted/20 p-4 space-y-4">
          <div className="flex items-start gap-2">
            <ExternalLink className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium">Log the external handoff</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Update once DCAS has been told. This becomes the team's paper trail.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="handoff-status">Status</Label>
            <Select value={status} onValueChange={(v: HandoffStatus) => setStatus(v)}>
              <SelectTrigger id="handoff-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedOption && (
              <p className="text-xs text-muted-foreground">{selectedOption.help}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="handoff-system">External system</Label>
              <Input
                id="handoff-system"
                value={system}
                onChange={(e) => setSystem(e.target.value)}
                placeholder="DCAS / Archibus"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="handoff-ticket">Ticket / reference #</Label>
              <Input
                id="handoff-ticket"
                value={ticketNumber}
                onChange={(e) => setTicketNumber(e.target.value)}
                placeholder="e.g. A4127"
              />
            </div>
          </div>

          {status === 'filed' && !ticketNumber.trim() && (
            <div className="flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/[0.08] text-amber-700 dark:text-amber-300 px-3 py-2 text-xs">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              Add a ticket number so the team can look it up later.
            </div>
          )}
        </div>

        {/* 3. Footer */}
        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={save.isPending}
          >
            Cancel
          </Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending ? 'Saving…' : 'Save handoff'}
          </Button>
        </div>
      </div>
    </ModalFrame>
  );
}
