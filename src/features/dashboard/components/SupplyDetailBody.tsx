import { useQuery } from '@tanstack/react-query';
import { Calendar, MapPin, Package } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { SupplyRow } from '@features/dashboard/hooks/useMyRequests';
import { formatDate } from '@/lib/dateTime';

interface Props {
  supply: SupplyRow & {
    priority?: string | null;
    requested_delivery_date?: string | null;
    approval_notes?: string | null;
  };
}

interface SupplyItem {
  id: string;
  quantity_requested: number;
  quantity_approved: number | null;
  quantity_fulfilled: number | null;
  // Supabase types this embedded join as an array even when the FK is 1:1;
  // we collapse it to the first element when rendering.
  inventory_items: { name: string | null; unit: string | null }[] | { name: string | null; unit: string | null } | null;
}

function itemName(item: SupplyItem): string {
  const inv = Array.isArray(item.inventory_items) ? item.inventory_items[0] : item.inventory_items;
  return inv?.name?.trim() || 'Unknown item';
}

export function SupplyDetailBody({ supply }: Props) {
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['supply-request-items', supply.id],
    queryFn: async (): Promise<SupplyItem[]> => {
      const { data, error } = await supabase
        .from('supply_request_items')
        .select('id, quantity_requested, quantity_approved, quantity_fulfilled, inventory_items(name, unit)')
        .eq('request_id', supply.id);
      if (error) throw error;
      return (data ?? []) as unknown as SupplyItem[];
    },
  });

  const priority = supply.priority?.toLowerCase();
  const showPriority = priority && priority !== 'medium' && priority !== 'normal';
  const neededBy = supply.requested_delivery_date
    ? formatDate(supply.requested_delivery_date)
    : null;

  return (
    <div className="space-y-4 p-4">
      <section>
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
          <MapPin className="h-3.5 w-3.5" /> Deliver to
        </div>
        <div className="text-sm">{supply.delivery_location || 'Not specified'}</div>
      </section>

      <section>
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
          <Package className="h-3.5 w-3.5" /> Items
        </div>
        {isLoading && <div className="text-sm text-muted-foreground">Loading items…</div>}
        {!isLoading && items.length === 0 && (
          <div className="text-sm text-muted-foreground">No items recorded.</div>
        )}
        {items.length > 0 && (
          <ul className="space-y-1.5 text-sm">
            {items.map((item) => {
              const fulfilled = item.quantity_fulfilled;
              const partial =
                fulfilled !== null && fulfilled !== undefined && fulfilled < item.quantity_requested;
              return (
                <li key={item.id} className="flex items-baseline justify-between gap-3">
                  <span className="truncate">{itemName(item)}</span>
                  <span className="text-muted-foreground shrink-0 tabular-nums">
                    {fulfilled !== null && fulfilled !== undefined
                      ? `${fulfilled} of ${item.quantity_requested}`
                      : item.quantity_requested}
                    {partial && <span className="text-amber-600 dark:text-amber-400 ml-1">·partial</span>}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {(showPriority || neededBy) && (
        <section className="space-y-1">
          {showPriority && (
            <div className="text-sm">
              <span className="text-muted-foreground">Priority: </span>
              <span className="capitalize">{priority}</span>
            </div>
          )}
          {neededBy && (
            <div className="flex items-center gap-1.5 text-sm">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">Needed by</span>
              <span>{neededBy}</span>
            </div>
          )}
        </section>
      )}

      {supply.description && (
        <section>
          <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Notes</div>
          <div className="text-sm whitespace-pre-wrap">{supply.description}</div>
        </section>
      )}

      {supply.approval_notes && (
        <section className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3">
          <div className="text-xs font-medium text-amber-700 dark:text-amber-300 mb-0.5">
            Approval note
          </div>
          <div className="text-xs text-amber-700/80 dark:text-amber-300/80">{supply.approval_notes}</div>
        </section>
      )}
    </div>
  );
}
