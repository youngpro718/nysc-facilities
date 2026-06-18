/**
 * LockboxSlotCard — quiet row layout for the lockbox table.
 *
 * Design philosophy: routine keys use a quiet graphite tag. A slim status
 * rail and warmer exception tags make scanning fast without flooding the
 * page with green. The "Available" state (90%+ of slots) has no rail, no
 * tinted background, no colored slot circle — just a slate dot + outlined
 * "Available" tag. Color is reserved for genuine operational exceptions:
 *   - Checked out → amber rail + amber dot/tag
 *   - Missing    → red rail + red dot/tag
 *   - Retired    → quiet greyscale
 */

import { Package, Link2Off } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LockboxSlot,
  getRoomLinkStatus,
  getSlotDisplayTitle,
  getKeyRoleLabel,
} from "../types/LockboxTypes";

interface LockboxSlotCardProps {
  slot: LockboxSlot;
  onClick: (slot: LockboxSlot) => void;
  lockboxName?: string;
  lockboxLocation?: string;
}

interface StatusConfig {
  rail: string;
  dotClass: string;
  label: string;
  tagClass: string;
  action: string;
}

function getStatusConfig(status: string): StatusConfig {
  switch (status) {
    case 'in_box':
      return {
        rail: '', // no rail for routine state — the "quiet" treatment
        // Dot stays green — the one bit of genuine operational signal in the
        // routine row. Tag itself remains muted/outlined to avoid flooding.
        dotClass: 'bg-emerald-500',
        label: 'Available',
        tagClass: 'border-border text-muted-foreground bg-transparent',
        action: 'Open',
      };
    case 'checked_out':
      return {
        rail: 'border-l-2 border-l-amber-500',
        dotClass: 'bg-amber-500',
        label: 'Checked out',
        tagClass:
          'border-amber-500/40 text-amber-700 dark:text-amber-300 bg-amber-500/[0.08]',
        action: 'Check in',
      };
    case 'missing':
      return {
        rail: 'border-l-2 border-l-red-500',
        dotClass: 'bg-red-500',
        label: 'Missing',
        tagClass:
          'border-red-500/40 text-red-700 dark:text-red-300 bg-red-500/[0.08]',
        action: 'Review',
      };
    case 'retired':
      return {
        rail: '',
        dotClass: 'bg-muted-foreground/40',
        label: 'Retired',
        tagClass: 'border-border text-muted-foreground bg-transparent',
        action: 'View',
      };
    default:
      return {
        rail: '',
        dotClass: 'bg-muted-foreground/40',
        label: status,
        tagClass: 'border-border text-muted-foreground bg-transparent',
        action: 'View',
      };
  }
}

// Build the second-line detail string: role · linked / unlinked status.
function buildSubtitle(slot: LockboxSlot): string {
  const parts: string[] = [];
  const role = getKeyRoleLabel(slot.key_role, slot.sub_room_label);
  if (role) parts.push(role);
  const linkStatus = getRoomLinkStatus(slot);
  if (linkStatus === 'linked') parts.push('linked');
  else if (linkStatus === 'unlinked') parts.push('unlinked');
  return parts.join(' · ');
}

export function LockboxSlotCard({ slot, onClick, lockboxName }: LockboxSlotCardProps) {
  const status = getStatusConfig(slot.status);
  const linkStatus = getRoomLinkStatus(slot);
  const subtitle = buildSubtitle(slot);
  const paddedSlot = String(slot.slot_number).padStart(3, '0');

  // Holder/location column content: depends on operational state. For now
  // we surface what we have — lockbox + slot position for routine state,
  // the unlinked indicator for unlinked rooms, etc.
  const holderLine = lockboxName || 'Lockbox';
  const positionLine = `Position ${paddedSlot}`;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onClick(slot)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(slot);
        }
      }}
      className={cn(
        // Fixed-width status and action columns so the column-header row above
        // aligns 1:1 with these data cells. Without fixed widths, the auto
        // sizing causes header text to drift over the data.
        'group grid grid-cols-[3rem_minmax(0,1.6fr)_minmax(0,1fr)_7rem_5rem] items-center gap-3 sm:gap-4',
        'border-b border-border last:border-b-0',
        'px-3 sm:px-4 py-3',
        'hover:bg-accent/40 transition-colors cursor-pointer touch-manipulation',
        'focus:outline-none focus-visible:bg-accent/50',
        status.rail,
      )}
    >
      {/* Slot number — quiet mono column, zero-padded */}
      <div className="font-mono text-xs text-muted-foreground tabular shrink-0">
        {paddedSlot}
      </div>

      {/* Key + subtitle */}
      <div className="min-w-0">
        <div className="font-medium text-sm truncate text-foreground">
          {getSlotDisplayTitle(slot)}
        </div>
        {subtitle && (
          <div className="text-xs text-muted-foreground truncate mt-0.5">
            {subtitle}
          </div>
        )}
      </div>

      {/* Location / holder column — hidden on small screens */}
      <div className="hidden sm:block min-w-0 text-xs text-muted-foreground">
        <div className="truncate">{holderLine}</div>
        <div className="truncate mt-0.5">{positionLine}</div>
      </div>

      {/* Status tag — squared, outlined, with a small dot */}
      <div className="shrink-0">
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 text-[11px] font-medium',
            status.tagClass,
          )}
        >
          <span
            aria-hidden="true"
            className={cn('h-1.5 w-1.5 rounded-full', status.dotClass)}
          />
          {status.label}
          {linkStatus === 'unlinked' && (
            <Link2Off className="h-3 w-3 ml-1 text-amber-500" />
          )}
        </span>
      </div>

      {/* Action — quiet outlined button */}
      <div className="shrink-0">
        <Button
          variant="outline"
          size="sm"
          className="h-7 px-3 text-xs"
          onClick={(e) => {
            e.stopPropagation();
            onClick(slot);
          }}
        >
          {status.action}
        </Button>
      </div>
    </div>
  );
}
