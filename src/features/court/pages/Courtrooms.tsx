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
import { Search, MapPin, Gavel, Phone, Users, AlertCircle, Image as ImageIcon, ChevronLeft, ChevronRight, Accessibility, Armchair } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getCurrentTermId } from '@features/court/utils/currentTerm';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PageHeader } from '@/components/layout/PageHeader';
import { cn } from '@/lib/utils';
import { QUERY_CONFIG } from '@/config';

interface AccessibilityFeatures {
  wheelchair_accessible?: boolean;
  hearing_assistance?: boolean;
  visual_aids?: boolean;
}

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
  // Room details from court_rooms
  courtroom_number: string | null;
  juror_capacity: number | null;
  spectator_capacity: number | null;
  accessibility_features: AccessibilityFeatures | null;
  notes: string | null;
  // Photos from rooms.courtroom_photos (jsonb, already-resolved URLs)
  judge_view_photos: string[];
  audience_view_photos: string[];
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

  // Parallel second pass: court_rooms for status/capacity/accessibility, and
  // rooms for the courtroom_photos jsonb (which holds already-resolved URLs).
  let courtRoomMap = new Map<string, Record<string, unknown>>();
  let roomPhotoMap = new Map<string, { judge_view?: string[]; audience_view?: string[] }>();
  if (roomIds.length > 0) {
    const [courtRoomsRes, roomsRes] = await Promise.all([
      supabase
        .from('court_rooms')
        .select('room_id, courtroom_number, operational_status, maintenance_status, maintenance_notes, temporary_location, juror_capacity, spectator_capacity, accessibility_features, notes')
        .in('room_id', roomIds),
      supabase
        .from('rooms')
        .select('id, courtroom_photos')
        .in('id', roomIds),
    ]);
    courtRoomMap = new Map((courtRoomsRes.data || []).map(r => [r.room_id as string, r as Record<string, unknown>]));
    roomPhotoMap = new Map(
      (roomsRes.data || []).map(r => {
        const photos = (r.courtroom_photos as { judge_view?: string[]; audience_view?: string[] } | null) || {};
        return [r.id as string, photos];
      })
    );
  }

  const asArray = (v: unknown): string[] => {
    if (!v) return [];
    if (Array.isArray(v)) return v.filter(Boolean) as string[];
    if (typeof v === 'string') return [v];
    return [];
  };

  return assignments.map((row) => {
    const cr = (row.room_id ? courtRoomMap.get(row.room_id) : null) || {};
    const photos = (row.room_id ? roomPhotoMap.get(row.room_id) : null) || {};
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
      courtroom_number: (cr.courtroom_number as string | null) ?? null,
      juror_capacity: (cr.juror_capacity as number | null) ?? null,
      spectator_capacity: (cr.spectator_capacity as number | null) ?? null,
      accessibility_features: (cr.accessibility_features as AccessibilityFeatures | null) ?? null,
      notes: (cr.notes as string | null) ?? null,
      judge_view_photos: asArray(photos.judge_view),
      audience_view_photos: asArray(photos.audience_view),
    };
  });
}

function CourtroomCard({ entry, onOpen }: { entry: CourtroomEntry; onOpen: () => void }) {
  const status = (entry.operational_status || 'operational').toLowerCase();
  const tone = STATUS_TONE[status] ?? STATUS_TONE.operational;
  const label = STATUS_LABEL[status] ?? entry.operational_status ?? 'Unknown';
  const photoCount = entry.judge_view_photos.length + entry.audience_view_photos.length;

  return (
    <Card
      className="hover:shadow-md transition-shadow cursor-pointer focus-within:ring-2 focus-within:ring-primary"
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(); } }}
    >
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

        {/* Footer hint: photo count + capacity (if any) */}
        {(photoCount > 0 || entry.spectator_capacity || entry.juror_capacity) && (
          <div className="flex items-center gap-3 pt-1 text-[11px] text-muted-foreground">
            {photoCount > 0 && (
              <span className="inline-flex items-center gap-1">
                <ImageIcon className="h-3 w-3" />
                {photoCount} photo{photoCount === 1 ? '' : 's'}
              </span>
            )}
            {entry.spectator_capacity != null && (
              <span className="inline-flex items-center gap-1">
                <Armchair className="h-3 w-3" />
                Seats {entry.spectator_capacity}
              </span>
            )}
            {entry.juror_capacity != null && (
              <span className="inline-flex items-center gap-1">
                <Users className="h-3 w-3" />
                Jury {entry.juror_capacity}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CourtroomDetailDialog({ entry, open, onOpenChange }: {
  entry: CourtroomEntry | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const [activeView, setActiveView] = useState<'judge' | 'audience'>('judge');
  const [photoIndex, setPhotoIndex] = useState(0);

  if (!entry) return null;

  const judgePhotos = entry.judge_view_photos;
  const audiencePhotos = entry.audience_view_photos;
  // Default to whichever view actually has photos
  const effectiveView = activeView === 'judge' && judgePhotos.length === 0 && audiencePhotos.length > 0
    ? 'audience'
    : activeView;
  const currentPhotos = effectiveView === 'judge' ? judgePhotos : audiencePhotos;
  const currentPhoto = currentPhotos[Math.min(photoIndex, currentPhotos.length - 1)];
  const totalPhotos = judgePhotos.length + audiencePhotos.length;

  const accessibility = entry.accessibility_features || {};
  const accessibilityFlags: { label: string; on: boolean }[] = [
    { label: 'Wheelchair accessible', on: !!accessibility.wheelchair_accessible },
    { label: 'Hearing assistance', on: !!accessibility.hearing_assistance },
    { label: 'Visual aids', on: !!accessibility.visual_aids },
  ];
  const activeAccessibility = accessibilityFlags.filter(f => f.on);

  const status = (entry.operational_status || 'operational').toLowerCase();
  const statusTone = STATUS_TONE[status] ?? STATUS_TONE.operational;
  const statusLabel = STATUS_LABEL[status] ?? entry.operational_status ?? 'Unknown';

  const switchView = (v: 'judge' | 'audience') => {
    setActiveView(v);
    setPhotoIndex(0);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 flex-wrap">
            <span>
              {entry.part ? `${entry.part}` : 'Courtroom'}
              {entry.room_number && <span className="text-muted-foreground font-normal"> · Room {entry.room_number}</span>}
            </span>
            <Badge variant="outline" className={`text-[10px] px-2 py-0 h-5 ${statusTone}`}>
              {statusLabel}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Photo gallery */}
          {totalPhotos > 0 ? (
            <div className="space-y-2">
              <div className="flex gap-2">
                {judgePhotos.length > 0 && (
                  <Button
                    type="button"
                    size="sm"
                    variant={effectiveView === 'judge' ? 'default' : 'outline'}
                    onClick={() => switchView('judge')}
                    className="flex-1"
                  >
                    Judge View ({judgePhotos.length})
                  </Button>
                )}
                {audiencePhotos.length > 0 && (
                  <Button
                    type="button"
                    size="sm"
                    variant={effectiveView === 'audience' ? 'default' : 'outline'}
                    onClick={() => switchView('audience')}
                    className="flex-1"
                  >
                    Audience View ({audiencePhotos.length})
                  </Button>
                )}
              </div>

              <div className="rounded-md overflow-hidden bg-muted/50 relative flex items-center justify-center min-h-[280px]">
                {currentPhoto ? (
                  <>
                    <img
                      src={currentPhoto}
                      alt={`${effectiveView === 'judge' ? 'Judge' : 'Audience'} view ${photoIndex + 1}`}
                      className="object-contain max-h-[400px] w-full"
                    />
                    {currentPhotos.length > 1 && (
                      <>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setPhotoIndex(p => (p > 0 ? p - 1 : currentPhotos.length - 1))}
                          className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background"
                          aria-label="Previous photo"
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setPhotoIndex(p => (p < currentPhotos.length - 1 ? p + 1 : 0))}
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background"
                          aria-label="Next photo"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </Button>
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-background/80 px-3 py-1 rounded-full text-xs">
                          {photoIndex + 1} / {currentPhotos.length}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="text-muted-foreground text-center p-6 flex flex-col items-center">
                    <ImageIcon className="h-10 w-10 mb-2 opacity-30" />
                    No photos in this view
                  </div>
                )}
              </div>

              {currentPhotos.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {currentPhotos.map((photo, i) => (
                    <button
                      key={photo + i}
                      type="button"
                      onClick={() => setPhotoIndex(i)}
                      className={cn(
                        'flex-shrink-0 w-16 h-12 rounded-md overflow-hidden border-2 transition-all',
                        i === photoIndex ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/50'
                      )}
                    >
                      <img src={photo} alt={`Thumbnail ${i + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-md border border-dashed bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
              <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-40" />
              No courtroom photos available.
            </div>
          )}

          {/* Justice + assignment info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
            {entry.justice && (
              <div className="flex items-start gap-2">
                <Gavel className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Justice</p>
                  <p className="font-medium truncate">{entry.justice}</p>
                </div>
              </div>
            )}
            {entry.tel && (
              <div className="flex items-start gap-2">
                <Phone className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <a href={`tel:${entry.tel}`} className="font-medium hover:underline">{entry.tel}</a>
                </div>
              </div>
            )}
            {entry.sergeant && (
              <div className="flex items-start gap-2">
                <Users className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Sergeant</p>
                  <p className="font-medium truncate">{entry.sergeant}</p>
                </div>
              </div>
            )}
            {entry.clerks && entry.clerks.length > 0 && (
              <div className="flex items-start gap-2">
                <Users className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Clerks</p>
                  <p className="font-medium">{entry.clerks.join(', ')}</p>
                </div>
              </div>
            )}
            {entry.spectator_capacity != null && (
              <div className="flex items-start gap-2">
                <Armchair className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Spectator capacity</p>
                  <p className="font-medium">{entry.spectator_capacity}</p>
                </div>
              </div>
            )}
            {entry.juror_capacity != null && (
              <div className="flex items-start gap-2">
                <Users className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Jury capacity</p>
                  <p className="font-medium">{entry.juror_capacity}</p>
                </div>
              </div>
            )}
            {entry.courtroom_number && (
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Courtroom #</p>
                  <p className="font-medium">{entry.courtroom_number}</p>
                </div>
              </div>
            )}
          </div>

          {/* Accessibility */}
          {activeAccessibility.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Accessibility className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Accessibility</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {activeAccessibility.map(f => (
                  <Badge key={f.label} variant="secondary" className="text-[11px]">
                    {f.label}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Maintenance / relocation callout (same as on card) */}
          {(entry.temporary_location || entry.maintenance_notes) && (
            <div className="flex items-start gap-2 rounded-md bg-status-warning/10 text-status-warning border border-status-warning/30 px-3 py-2 text-sm">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div className="space-y-1 min-w-0">
                {entry.temporary_location && (
                  <p><span className="font-medium">Relocated to:</span> {entry.temporary_location}</p>
                )}
                {entry.maintenance_notes && (
                  <p>{entry.maintenance_notes}</p>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          {entry.notes && (
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Notes</p>
              <p className="text-sm whitespace-pre-line">{entry.notes}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Courtrooms() {
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: entries = [], isLoading, error } = useQuery<CourtroomEntry[]>({
    queryKey: ['courtroom-directory'],
    queryFn: fetchCourtroomDirectory,
    staleTime: QUERY_CONFIG.stale.medium,
  });

  const selectedEntry = selectedId
    ? entries.find(e => e.assignment_id === selectedId) ?? null
    : null;

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
              <CourtroomCard
                key={entry.assignment_id}
                entry={entry}
                onOpen={() => setSelectedId(entry.assignment_id)}
              />
            ))}
          </div>
        </>
      )}

      <CourtroomDetailDialog
        entry={selectedEntry}
        open={selectedId !== null}
        onOpenChange={(o) => { if (!o) setSelectedId(null); }}
      />
    </div>
  );
}
