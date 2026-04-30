/**
 * StatusLegendPopover — small info popover that explains what each status
 * pill color/label means. Driven by `statusLabels.ts` so legends never drift
 * from the actual labels rendered on the cards.
 *
 * Usage:
 *   <StatusLegendPopover kind="supply" />
 *   <StatusLegendPopover kind="issue" />
 *   <StatusLegendPopover kind="key" />
 */

import { Info } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  getFriendlySupplyStatus,
  getFriendlyIssueStatus,
  getFriendlyKeyStatus,
  toneClasses,
  type FriendlyStatus,
} from '@/lib/statusLabels';
import { cn } from '@/lib/utils';

const SUPPLY_KEYS = ['submitted', 'approved', 'picking', 'ready', 'fulfilled', 'rejected', 'cancelled'];
const ISSUE_KEYS = ['open', 'in_progress', 'on_hold', 'resolved', 'closed'];
const KEY_KEYS = ['pending', 'approved', 'ready', 'fulfilled', 'rejected', 'cancelled'];

interface Props {
  kind: 'supply' | 'issue' | 'key';
  className?: string;
  triggerLabel?: string;
}

export function StatusLegendPopover({ kind, className, triggerLabel }: Props) {
  const { keys, getter, title } = (() => {
    switch (kind) {
      case 'issue':
        return { keys: ISSUE_KEYS, getter: getFriendlyIssueStatus, title: 'Issue statuses' };
      case 'key':
        return { keys: KEY_KEYS, getter: getFriendlyKeyStatus, title: 'Key request statuses' };
      default:
        return { keys: SUPPLY_KEYS, getter: getFriendlySupplyStatus, title: 'Supply order statuses' };
    }
  })();

  const items: Array<{ key: string; meta: FriendlyStatus }> = keys.map((k) => ({
    key: k,
    meta: getter(k),
  }));

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Show what each status means"
          className={cn(
            'inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors',
            className,
          )}
        >
          <Info className="h-3.5 w-3.5" />
          {triggerLabel && <span>{triggerLabel}</span>}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-3">
        <p className="text-sm font-semibold text-foreground mb-2">{title}</p>
        <ul className="space-y-1.5">
          {items.map(({ key, meta }) => (
            <li key={key} className="flex items-start gap-2">
              <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full border text-[11px] font-medium shrink-0', toneClasses(meta.tone))}>
                {meta.label}
              </span>
              <span className="text-xs text-muted-foreground leading-snug">{meta.description}</span>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
