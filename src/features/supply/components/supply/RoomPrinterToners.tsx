import { useMemo } from 'react';
import { Printer, AlertTriangle, Loader2, Check, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useRoomPrinters, type RoomPrinter } from '@features/supply/hooks/useRoomPrinters';

interface RoomPrinterTonersProps {
  roomId?: string | null;
  /** Item IDs currently in the cart, used to show which toners are already added. */
  cartItemIds: string[];
  /** Add a canonical toner inventory item to the cart. */
  onAddInventoryItem: (item: {
    id: string;
    name: string;
    unit?: string;
    sku?: string;
    requires_justification?: boolean;
    pack_size?: number | null;
    order_code_threshold?: number | null;
  }) => void;
  onRemoveInventoryItem: (itemId: string) => void;
  /** Manual toner code entry — used only when the room has no printers on file. */
  manualToner: string;
  onManualTonerChange: (value: string) => void;
}

interface TonerGroup {
  code: string;
  printers: RoomPrinter[];
  needsReview: boolean;
  inventoryItem: RoomPrinter['inventory_item'] | null;
}

/**
 * Panel shown under the delivery-room picker on the supply order form.
 *
 * When printers are linked to the room, each toner code shows as an "Add
 * cartridge" action that pushes the canonical Toner inventory item into the
 * cart (same as adding any other supply). The line then flows through the
 * normal fulfillment + stock path — no separate toner-note channel.
 *
 * When no printers exist, the panel falls back to a manual toner code input
 * that flags the room for admin review (parent handles the flag on submit).
 */
export function RoomPrinterToners({
  roomId,
  cartItemIds,
  onAddInventoryItem,
  onRemoveInventoryItem,
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
        if (!existing.inventoryItem && p.inventory_item) {
          existing.inventoryItem = p.inventory_item;
        }
      } else {
        map.set(key, {
          code: p.toner_code.trim(),
          printers: [p],
          needsReview: p.needs_review,
          inventoryItem: p.inventory_item ?? null,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.code.localeCompare(b.code));
  }, [printers]);

  const printersWithoutToner = printers.filter((p) => !p.toner_code);

  if (!roomId) return null;

  return (
    <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
      <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
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
            const item = g.inventoryItem;
            const inCart = !!item && cartItemIds.includes(item.id);
            const uniqueModels = Array.from(
              new Set(g.printers.map((p) => p.printer_model).filter(Boolean)),
            );
            return (
              <div
                key={g.code}
                className={`flex items-start gap-2 p-2 rounded-md border transition-colors ${
                  inCart ? 'border-primary bg-primary/5' : 'border-border bg-background'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-foreground">Toner {g.code}</span>
                    {g.needsReview && (
                      <Badge
                        variant="outline"
                        className="h-5 px-1.5 text-[10px] border-amber-500/40 text-amber-700 dark:text-amber-400 bg-amber-500/5"
                      >
                        <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
                        Needs review
                      </Badge>
                    )}
                    {item && (
                      <span className="text-[10px] text-muted-foreground">
                        {item.quantity} in stock · Room 1726
                      </span>
                    )}
                  </div>
                  {uniqueModels.length > 0 && (
                    <div className="text-[11px] text-muted-foreground mt-0.5 break-words">
                      {uniqueModels.join(' · ')}
                    </div>
                  )}
                  {!item && (
                    <div className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5">
                      Not linked to inventory yet — an admin can link it in
                      Admin → Printers.
                    </div>
                  )}
                </div>
                {item && (
                  <Button
                    type="button"
                    size="sm"
                    variant={inCart ? 'secondary' : 'default'}
                    className="h-8 min-w-[92px]"
                    onClick={() =>
                      inCart
                        ? onRemoveInventoryItem(item.id)
                        : onAddInventoryItem({
                            id: item.id,
                            name: item.name,
                            unit: item.unit ?? undefined,
                            sku: item.sku ?? undefined,
                            requires_justification: item.requires_justification,
                            pack_size: item.pack_size,
                            order_code_threshold: item.order_code_threshold,
                          })
                    }
                  >
                    {inCart ? (
                      <>
                        <Check className="h-3.5 w-3.5 mr-1" />
                        In cart
                      </>
                    ) : (
                      <>
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        Add cartridge
                      </>
                    )}
                  </Button>
                )}
              </div>
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
