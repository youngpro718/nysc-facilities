import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  useMyRequests,
  useMyRequestsRealtime,
  type MyRequestRow,
} from '@features/dashboard/hooks/useMyRequests';
import { MyRequestRow as RowComponent } from '@features/dashboard/components/MyRequestRow';
import { MyRequestDetailDrawer } from '@features/dashboard/components/MyRequestDetailDrawer';

type Filter = 'all' | 'open' | 'done';
type TypeFilter = 'all' | 'supply' | 'request';

const OPEN_SUPPLY = new Set([
  'submitted',
  'pending_approval',
  'approved',
  'received',
  'picking',
  'packing',
  'ready',
]);
const OPEN_TASK = new Set(['pending', 'pending_approval', 'approved', 'claimed', 'in_progress']);
const OPEN_KEY = new Set(['pending', 'approved', 'ready']);

function isOpen(row: MyRequestRow): boolean {
  if (row.type === 'supply') return OPEN_SUPPLY.has(row.status_internal);
  if (row.type === 'key') return OPEN_KEY.has(row.status_internal);
  return OPEN_TASK.has(row.status_internal);
}

export default function MyRequests() {
  useMyRequestsRealtime();
  const { data: rows = [], isLoading, error } = useMyRequests();
  const [params, setParams] = useSearchParams();
  const focusId = params.get('focus');
  const [filter, setFilter] = useState<Filter>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!focusId) return;
    setSelectedId(focusId);
    const el = document.getElementById(`row-${focusId}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const timer = setTimeout(() => {
      const next = new URLSearchParams(params);
      next.delete('focus');
      setParams(next, { replace: true });
    }, 3000);
    return () => clearTimeout(timer);
  }, [focusId, params, setParams]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (filter === 'open' && !isOpen(r)) return false;
      if (filter === 'done' && isOpen(r)) return false;
      if (typeFilter !== 'all' && r.type !== typeFilter) return false;
      return true;
    });
  }, [rows, filter, typeFilter]);

  const selected = rows.find((r) => r.id === selectedId) ?? null;

  return (
    <div className="max-w-3xl mx-auto py-6 px-4 space-y-4">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">My Requests</h1>
        <p className="text-sm text-muted-foreground">Supply orders and service requests in one place.</p>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        {(['all', 'open', 'done'] as Filter[]).map((f) => (
          <Button
            key={f}
            type="button"
            variant={filter === f ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(f)}
            className="capitalize"
          >
            {f}
          </Button>
        ))}
        <div className="w-px h-6 bg-border mx-1" />
        {(['all', 'supply', 'request'] as TypeFilter[]).map((t) => (
          <Button
            key={t}
            type="button"
            variant={typeFilter === t ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setTypeFilter(t)}
            className="capitalize"
          >
            {t === 'all' ? 'All types' : t}
          </Button>
        ))}
      </div>

      <div className="border rounded-lg overflow-hidden bg-background">
        {isLoading && (
          <div className="p-6 text-center text-muted-foreground text-sm">Loading…</div>
        )}
        {error && (
          <div className="p-6 text-center text-destructive text-sm">Could not load requests.</div>
        )}
        {!isLoading && !error && filtered.length === 0 && (
          <div className="p-8 text-center text-sm text-muted-foreground">No requests yet.</div>
        )}
        {filtered.map((row) => (
          <div id={`row-${row.id}`} key={row.id}>
            <RowComponent
              row={row}
              highlighted={row.id === focusId}
              onClick={() => setSelectedId(row.id)}
            />
          </div>
        ))}
      </div>

      <MyRequestDetailDrawer
        row={selected}
        onOpenChange={(open) => !open && setSelectedId(null)}
      />
    </div>
  );
}
