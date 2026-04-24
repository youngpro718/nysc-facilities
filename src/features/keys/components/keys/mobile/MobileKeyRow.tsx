import { Key, ChevronRight, Archive, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LockboxSlot, getRoomLinkStatus } from "../types/LockboxTypes";

export interface MobileSlotRowData extends LockboxSlot {
  lockbox_name?: string;
  checked_out_to?: string | null;
  checked_out_at?: string | null;
}

interface MobileKeyRowProps {
  slot: MobileSlotRowData;
  onOpen: (slot: MobileSlotRowData) => void;
  onPrimaryAction: (slot: MobileSlotRowData) => void;
}

type Tone = "available" | "checked_out" | "missing" | "unlinked" | "neutral";

function getTone(slot: MobileSlotRowData): Tone {
  if (slot.status === "missing") return "missing";
  if (slot.status === "checked_out") return "checked_out";
  if (slot.status === "in_box") {
    if (getRoomLinkStatus(slot) === "no_room") return "unlinked";
    return "available";
  }
  return "neutral";
}

const TONE_STYLES: Record<
  Tone,
  {
    iconWrap: string;
    icon: string;
    pillBg: string;
    pillText: string;
    pillDot: string;
    actionBorder: string;
    actionText: string;
    label: string;
    actionLabel: string;
  }
> = {
  available: {
    iconWrap: "bg-green-500/10",
    icon: "text-green-500",
    pillBg: "bg-green-500/15",
    pillText: "text-green-600 dark:text-green-400",
    pillDot: "bg-green-500",
    actionBorder: "border-green-500/40 hover:bg-green-500/10",
    actionText: "text-green-600 dark:text-green-400",
    label: "Available",
    actionLabel: "Take Key",
  },
  checked_out: {
    iconWrap: "bg-orange-500/10",
    icon: "text-orange-500",
    pillBg: "bg-orange-500/15",
    pillText: "text-orange-600 dark:text-orange-400",
    pillDot: "bg-orange-500",
    actionBorder: "border-orange-500/40 hover:bg-orange-500/10",
    actionText: "text-orange-600 dark:text-orange-400",
    label: "Checked Out",
    actionLabel: "Return Key",
  },
  missing: {
    iconWrap: "bg-destructive/10",
    icon: "text-destructive",
    pillBg: "bg-destructive/15",
    pillText: "text-destructive",
    pillDot: "bg-destructive",
    actionBorder: "border-destructive/40 hover:bg-destructive/10",
    actionText: "text-destructive",
    label: "Missing",
    actionLabel: "Report Missing",
  },
  unlinked: {
    iconWrap: "bg-muted",
    icon: "text-muted-foreground",
    pillBg: "bg-muted",
    pillText: "text-muted-foreground",
    pillDot: "bg-muted-foreground",
    actionBorder: "border-border hover:bg-muted",
    actionText: "text-foreground",
    label: "Unlinked",
    actionLabel: "Assign Room",
  },
  neutral: {
    iconWrap: "bg-muted",
    icon: "text-muted-foreground",
    pillBg: "bg-muted",
    pillText: "text-muted-foreground",
    pillDot: "bg-muted-foreground",
    actionBorder: "border-border hover:bg-muted",
    actionText: "text-foreground",
    label: "Retired",
    actionLabel: "View",
  },
};

function formatCheckedOutAt(iso?: string | null): string | null {
  if (!iso) return null;
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return null;
  }
}

export function MobileKeyRow({ slot, onOpen, onPrimaryAction }: MobileKeyRowProps) {
  const tone = getTone(slot);
  const styles = TONE_STYLES[tone];
  const checkedAt = formatCheckedOutAt(slot.checked_out_at);
  const showSecondary =
    tone === "checked_out" && (slot.checked_out_to || checkedAt);

  return (
    <div
      className={cn(
        "rounded-2xl border bg-card overflow-hidden",
        "active:scale-[0.995] transition-transform touch-manipulation",
      )}
    >
      <button
        type="button"
        className="w-full flex items-stretch gap-3 p-3 text-left"
        onClick={() => onOpen(slot)}
      >
        {/* Key icon */}
        <div
          className={cn(
            "shrink-0 h-12 w-12 rounded-full flex items-center justify-center",
            styles.iconWrap,
          )}
        >
          <Key className={cn("h-6 w-6", styles.icon)} />
        </div>

        {/* Title + room */}
        <div className="flex-1 min-w-0 self-center">
          <div className="font-semibold text-sm leading-tight truncate">
            {slot.label}
          </div>
          {slot.room_number ? (
            <div className="text-xs text-muted-foreground truncate">
              Room {slot.room_number}
            </div>
          ) : (
            <div className="text-xs text-muted-foreground italic">No room</div>
          )}
        </div>

        {/* Box / Slot column */}
        <div className="shrink-0 self-center pl-2 pr-1 border-l border-border">
          <div className={cn("flex items-center gap-1 text-xs font-medium", styles.pillText)}>
            <Archive className="h-3.5 w-3.5" />
            <span>{slot.lockbox_name || "Box"}</span>
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            Slot {String(slot.slot_number).padStart(2, "0")}
          </div>
        </div>

        {/* Status pill + action */}
        <div className="shrink-0 flex flex-col items-end justify-center gap-1.5 self-center">
          <span
            className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium",
              styles.pillBg,
              styles.pillText,
            )}
          >
            <span className={cn("h-1.5 w-1.5 rounded-full", styles.pillDot)} />
            {styles.label}
          </span>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-7 px-2.5 text-xs font-medium rounded-md",
              styles.actionBorder,
              styles.actionText,
            )}
            onClick={(e) => {
              e.stopPropagation();
              onPrimaryAction(slot);
            }}
          >
            {styles.actionLabel}
          </Button>
        </div>

        <ChevronRight className="h-4 w-4 text-muted-foreground self-center shrink-0" />
      </button>

      {showSecondary && (
        <div className="px-4 py-2 border-t border-border/60 bg-muted/30 flex items-center gap-2 text-xs text-muted-foreground">
          {slot.checked_out_to && (
            <span className="truncate">
              Checked out to{" "}
              <span className="text-foreground font-medium">
                {slot.checked_out_to}
              </span>
            </span>
          )}
          {checkedAt && (
            <span className="flex items-center gap-1 ml-auto shrink-0">
              <Clock className="h-3 w-3" />
              {checkedAt}
            </span>
          )}
        </div>
      )}

      {tone === "missing" && !showSecondary && (
        <div className="px-4 py-2 border-t border-border/60 bg-destructive/5 flex items-center gap-2 text-xs text-destructive">
          <AlertCircle className="h-3 w-3" />
          Reported missing — needs attention
        </div>
      )}
    </div>
  );
}
