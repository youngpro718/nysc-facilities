/**
 * Courtrooms - read-only courthouse directory.
 *
 * Built for court officers (Major / front desk) so they can answer
 * "where's Judge Smith?" / "what's Part 30?" / "is Room 1130 in service?"
 * at a glance. Read-only by design: there are no actions, no edit dialogs,
 * no drag-and-drop. Data comes from court_assignments (scoped to the
 * current term via getCurrentTermId) joined with court_rooms for
 * operational status.
 */

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, MapPin, Gavel, Phone, Users, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getCurrentTermId } from '@features/court/utils/currentTerm';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/layout/PageHeader';
import { QUERY_CONFIG } from '@/config';

interface CourtroomEntry {
  assignment_id: string;
  part: string | null;
  justice: string | null;
  room_id: string;
  room_number: string | null;
  sergeant: string | null;
  clerks: string[] | null;
  tel: string | null;
  operational_status: string | null;
  maintenance_status: string | null;
  maintenance_notes: string | null;
  temporary_location: string | null;
}

const STATUS_TONE: Record<string, string> = {
  operational: 'bg-status-operational/10 text-status-operational border-status-operational/30',
  maintenance: 'bg-status-warning/10 text-status-warning border-status-warning/30',
  inactive: 'bg-status-neutral/10 text-status-neutral border-status-neutral/30',
};

const STATUS_LABEL: Record<string, string> = {
  operational: 'Operational',
  maintenance: 'Maintenance',
  inactive: 'Inactive',
};

async function fetchCourtroomDirectory(): Promise<CourtroomEntry[]> {
  const termId = await getCurrentTermId();
  if (!termId) return [];

  // court_assignments.room_id FKs to rooms.id, NOT court_rooms.id. The
  // court_rooms row that describes operational/maintenance state is found
  // via court_rooms.room_id = court_assignments.room_id, so we look that up
  // in a second pass and merge in memory.
  const { data: assignments, error: assignmentsError } = await supabase
    .from('court_assignments')
    .select(`
      id,
      part,
      justice,
      room_id,
      room_number,
      sergeant,
      clerks,
      tel
    `)
    .eq('term_id', termId)
    .order('part', { ascending: true });

  if (assignmentsError) throw assignmentsError;
  if (!assignments || assignments.length === 0) return [];

  const roomIds = [...new Set(assignments.map(a => a.room_id).filter(Boolean))];
  let roomMap = new Map<string, Record<string, unknown>>();
  if (roomIds.length > 0) {
    const { data: rooms } = await supabase
      .from('court_rooms')
      .select('room_id, operational_status, maintenance_status, maintenance_notes, temporary_location')
      .in('room_id', roomIds);
    roomMap = new Map((rooms || []).map(r => [r.room_id as string, r as Record<string, unknown>]));
  }

  return assignments.map((row) => {
    const cr = (row.room_id ? roomMap.get(row.room_id) : null) || {};
    return {
      assignment_id: row.id as string,
      part: (row.part as string | null) ?? null,
      justice: (row.justice as string | null) ?? null,
      room_id: row.room_id as string,
      room_number: (row.room_number as string | null) ?? null,
      sergeant: (row.sergeant as string | null) ?? null,
      clerks: (row.clerks as string[] | null) ?? null,
      tel: (row.tel as string | null) ?? null,
      operational_status: (cr.operational_status as string | null) ?? null,
      maintenance_status: (cr.maintenance_status as string | null) ?? null,
      maintenance_notes: (cr.maintenance_notes as string | null) ?? null,
      temporary_location: (cr.temporary_location as string | null) ?? null,
    };
  });
}

function CourtroomCard({ entry }: { entry: CourtroomEntry }) {
  const status = (entry.operational_status || 'operational').toLowerCase();
  const tone = STATUS_TONE[status] ?? STATUS_TONE.operational;
  const label = STATUS_LABEL[status] ?? entry.operational_status ?? 'Unknown';

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4 space-y-3">
        {/* Header: part + room number + status pill */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-baseline gap-2 flex-wrap">
              {entry.part && (
                <h3 className="font-semibold text-base leading-none">
                  {entry.part}
                </h3>
              )}
              {entry.room_number && (
                <span className="text-sm text-muted-foreground inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  Room {entry.room_number}
                </span>
              )}
            </div>
          </div>
          <Badge variant="outline" className={`text-[10px] px-2 py-0 h-5 ${tone}`}>
            {label}
          </Badge>
        </div>

        {/* Justice */}
        {entry.justice && (
          <div className="flex items-center gap-2 text-sm">
            <Gavel className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="font-medium truncate">{entry.justice}</span>
          </div>
        )}

        {/* Phone */}
        {entry.tel && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Phone className="h-3.5 w-3.5 shrink-0" />
            <a href={`tel:${entry.tel}`} className="hover:underline">{entry.tel}</a>
          </div>
        )}

        {/* Sergeant + clerks */}
        {(entry.sergeant || (entry.clerks && entry.clerks.length > 0)) && (
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <div className="space-y-0.5 min-w-0">
              {entry.sergeant && (
                <p className="truncate"><span className="text-foreground/80">Sergeant:</span> {entry.sergeant}</p>
              )}
              {entry.clerks && entry.clerks.length > 0 && (
                <p className="line-clamp-2"><span className="text-foreground/80">Clerks:</span> {entry.clerks.join(', ')}</p>
              )}
            </div>
          </div>
        )}

        {/* Maintenance / temporary location callout */}
        {(entry.temporary_location || entry.maintenance_notes) && (
          <div className="flex items-start gap-2 rounded-md bg-status-warning/10 text-status-warning border border-status-warning/30 px-2 py-1.5 text-xs">
            <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <div className="space-y-0.5 min-w-0">
              {entry.temporary_location && (
                <p className="truncate"><span className="font-medium">Relocated to:</span> {entry.temporary_location}</p>
              )}
              {entry.maintenance_notes && (
                <p className="line-clamp-2">{entry.maintenance_notes}</p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Courtrooms() {
  const [query, setQuery] = useState('');

  const { data: entries = [], isLoading, error } = useQuery<CourtroomEntry[]>({
    queryKey: ['courtroom-directory'],
    queryFn: fetchCourtroomDirectory,
    staleTime: QUERY_CONFIG.stale.medium,
  });

  // Match on part / justice / room number — covers the three things people
  // walk up to the desk asking for.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter(e =>
      (e.part || '').toLowerCase().includes(q) ||
      (e.justice || '').toLowerCase().includes(q) ||
      (e.room_number || '').toLowerCase().includes(q)
    );
  }, [entries, query]);

  return (
    <div className="container max-w-6xl mx-auto px-4 py-6 space-y-5">
      <PageHeader
        title="Courtrooms"
        description="Directory of active courtrooms for the current term"
        icon={Gavel}
      />

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by part, justice, or room number…"
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-lg" />
          ))}
        </div>
      ) : error ? (
        <Card className="p-6 text-center">
          <p className="text-sm text-destructive">Failed to load courtroom directory.</p>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="p-8 text-center">
          <Gavel className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">
            {query ? 'No courtrooms match your search.' : 'No courtroom assignments for the current term.'}
          </p>
        </Card>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">
            {filtered.length} courtroom{filtered.length === 1 ? '' : 's'}
            {query && ` matching "${query}"`}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((entry) => (
              <CourtroomCard key={entry.assignment_id} entry={entry} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
