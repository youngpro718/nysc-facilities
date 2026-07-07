import { useMemo } from 'react';
import { Printer, AlertTriangle, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useRoomPrinters, type RoomPrinter } from '@features/supply/hooks/useRoomPrinters';

interface RoomPrinterTonersProps {
  roomId?: string | null;
  selectedToners: string[];
  onToggleToner: (code: string) => void;
  manualToner: string;
  onManualTonerChange: (value: string) => void;
}

interface TonerGroup {
  code: string;
  printers: RoomPrinter[];
  needsReview: boolean;
}

/**
 * Panel shown under the delivery-room picker on the supply order form.
 * - Loads printers assigned to the selected room via useRoomPrinters.
 * - When printers exist, groups them by toner code so the user picks a toner
 *   (checkbox) instead of typing a code.
 * - When only one toner exists it's auto-selected on mount (via parent effect).
 * - When no printers exist, shows a message + manual toner input; the parent
 *   flags the room on submit.
 */
export function RoomPrinterToners({
  roomId,
  selectedToners,
  onToggleToner,
  manualToner,
  onManualTonerChange,
}: RoomPrinterTonersProps) {
  const { data: printers = [], isLoading } = useRoomPrinters(roomId);

  const groups = useMemo<TonerGroup[]>(() => {
    const map = new Map<string, TonerGroup>();
    for (const p of printers) {
      if (!p.toner_code) continue;
      const key = p.toner_code.trim().toUpperCase();
      const existing = map.get(key);
      if (existing) {
        existing.printers.push(p);
        existing.needsReview = existing.needsReview || p.needs_review;
      } else {
        map.set(key, {
          code: p.toner_code.trim(),
          printers: [p],
          needsReview: p.needs_review,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.code.localeCompare(b.code));
  }, [printers]);

  const printersWithoutToner = printers.filter((p) => !p.toner_code);

  if (!roomId) return null;

  return (
    <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
      <div className="flex items-center gap-1.5 text-xs font-medium">
        <Printer className="h-3.5 w-3.5" />
        Printers in this room
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Checking printer assignments…
        </div>
      ) : groups.length === 0 && printersWithoutToner.length === 0 ? (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            No printers have been linked to this room. This room will be flagged for
            future printer assignment.
          </p>
          <div className="space-y-1">
            <Label htmlFor="manual-toner" className="text-[11px] font-medium">
              Enter toner code manually
            </Label>
            <Input
              id="manual-toner"
              value={manualToner}
              onChange={(e) => onManualTonerChange(e.target.value)}
              placeholder="e.g. 26A, TN650…"
              className="h-9 text-sm"
            />
          </div>
        </div>
      ) : (
        <div className="space-y-1.5">
          {groups.map((g) => {
            const active = selectedToners.includes(g.code);
            const uniqueModels = Array.from(
              new Set(g.printers.map((p) => p.printer_model).filter(Boolean)),
            );
            return (
              <label
                key={g.code}
                className={`flex items-start gap-2 p-2 rounded-md border cursor-pointer transition-colors ${
                  active
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-background hover:bg-muted/60'
                }`}
              >
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4"
                  checked={active}
                  onChange={() => onToggleToner(g.code)}
                  aria-label={`Toner ${g.code}`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{g.code}</span>
                    {g.needsReview && (
                      <Badge
                        variant="outline"
                        className="h-5 px-1.5 text-[10px] border-amber-500/40 text-amber-700 dark:text-amber-400 bg-amber-500/5"
                      >
                        <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
                        Needs review
                      </Badge>
                    )}
                  </div>
                  {uniqueModels.length > 0 && (
                    <div className="text-[11px] text-muted-foreground mt-0.5 break-words">
                      {uniqueModels.join(' · ')}
                    </div>
                  )}
                </div>
              </label>
            );
          })}
          {printersWithoutToner.length > 0 && (
            <p className="text-[11px] text-muted-foreground pt-1">
              {printersWithoutToner.length} printer
              {printersWithoutToner.length === 1 ? '' : 's'} in this room {' '}
              {printersWithoutToner.length === 1 ? 'has' : 'have'} no toner code on file.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
