import { Key, Archive, AlertCircle } from "lucide-react";
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
    iconWrap: "bg-green-500/15",
    icon: "text-green-500",
    pillBg: "bg-green-500/15",
    pillText: "text-green-500",
    pillDot: "bg-green-500",
    actionBorder: "border-green-500/50 hover:bg-green-500/10",
    actionText: "text-green-500",
    label: "Available",
    actionLabel: "Take Key",
  },
  checked_out: {
    iconWrap: "bg-orange-500/15",
    icon: "text-orange-500",
    pillBg: "bg-orange-500/15",
    pillText: "text-orange-500",
    pillDot: "bg-orange-500",
    actionBorder: "border-orange-500/50 hover:bg-orange-500/10",
    actionText: "text-orange-500",
    label: "Checked Out",
    actionLabel: "Return Key",
  },
  missing: {
    iconWrap: "bg-destructive/15",
    icon: "text-destructive",
    pillBg: "bg-destructive/15",
    pillText: "text-destructive",
    pillDot: "bg-destructive",
    actionBorder: "border-destructive/50 hover:bg-destructive/10",
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
    <div className="rounded-2xl border bg-card overflow-hidden">
      <button
        type="button"
        className="w-full grid grid-cols-[48px_1fr_auto_auto] items-center gap-3 p-3 text-left"
        onClick={() => onOpen(slot)}
      >
        {/* Col 1 — Key icon */}
        <div
          className={cn(
            "h-12 w-12 rounded-full flex items-center justify-center",
            styles.iconWrap,
          )}
        >
          <Key className={cn("h-5 w-5", styles.icon)} />
        </div>

        {/* Col 2 — Title + room */}
        <div className="min-w-0">
          <div className="font-semibold text-sm leading-snug truncate text-foreground">
            {slot.label}
          </div>
          <div className="text-xs text-muted-foreground truncate mt-0.5">
            {slot.room_number ? `Room ${slot.room_number}` : "—"}
          </div>
        </div>

        {/* Col 3 — Box / Slot (always neutral) */}
        <div className="pl-3 pr-1 border-l border-border/60 min-w-[80px]">
          <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
            <Archive className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="truncate">{slot.lockbox_name || "Box"}</span>
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            Slot {String(slot.slot_number).padStart(2, "0")}
          </div>
        </div>

        {/* Col 4 — Status pill + action button (equal width, right-aligned) */}
        <div className="flex flex-col items-stretch gap-1.5 w-[104px]">
          <span
            className={cn(
              "inline-flex items-center justify-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-medium",
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
              "h-8 w-full px-2 text-xs font-medium rounded-md bg-transparent",
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
      </button>

      {showSecondary && (
        <div className="px-4 py-2 border-t border-border/60 bg-muted/20 text-xs text-muted-foreground truncate">
          {slot.checked_out_to && (
            <>
              Checked out to{" "}
              <span className="text-foreground font-medium">
                {slot.checked_out_to}
              </span>
            </>
          )}
          {slot.checked_out_to && checkedAt && (
            <span className="mx-1.5">·</span>
          )}
          {checkedAt && <span>{checkedAt}</span>}
        </div>
      )}

      {tone === "missing" && !showSecondary && (
        <div className="px-4 py-2 border-t border-border/60 bg-destructive/5 flex items-center gap-2 text-xs text-destructive">
          <AlertCircle className="h-3 w-3 shrink-0" />
          Reported missing — needs attention
        </div>
      )}
    </div>
  );
}
