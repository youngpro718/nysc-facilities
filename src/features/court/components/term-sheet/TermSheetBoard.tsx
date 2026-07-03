import React, { useState, useEffect } from 'react';
import { useIsMobile } from '@shared/hooks/use-mobile';
import { Loader2, GripVertical, AlertTriangle, Calendar, ChevronLeft, ChevronRight, Plus, Phone, Megaphone } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useRolePermissions } from '@features/auth/hooks/useRolePermissions';
import { IssuePreviewSheet } from '@features/issues/components/issues/details/IssuePreviewSheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileText, Download, FileSpreadsheet, Printer, Search, LayoutGrid, List, Users, Gavel, Shield } from 'lucide-react';
import { useToast } from '@shared/hooks/use-toast';
import { useCourtPersonnel } from '@features/court/hooks/useCourtPersonnel';
import { JudgeStatusBadge } from '@features/court/components/term-sheet/JudgeStatusBadge';
import { useCourtIssuesIntegration } from '@features/court/hooks/useCourtIssuesIntegration';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { AssignmentEditDialog, type EditableAssignment } from './AssignmentEditDialog';
import { Pencil, WifiOff, Copy } from 'lucide-react';
import { generateYearTerms, formatSittingDays } from '@features/court/utils/termPattern';

interface TermAssignment {
  id: string;        // assignment id — used as DnD key
  room_id: string;   // rooms.id — used for issue lookup
  part: string;
  justice: string;
  room: string;
  fax: string;
  tel: string;
  sergeant: string;
  clerks: string[];
  calendar_day: string | null; // sitting days for calendar parts ("Tuesday,Thursday")
  sort_order: number;
  updated_at: string | null; // used for optimistic concurrency on reorder
}

// Stable default so the sortedList-sync effect doesn't loop on a fresh []
// reference every render while the query has no data yet
const EMPTY_ASSIGNMENTS: TermAssignment[] = [];

// ── Offline pocket copy ───────────────────────────────────────────────────────
// The term sheet must stay readable when the backend is unreachable ("a copy
// in everyone's pocket"): every successful fetch is snapshotted to
// localStorage, and query failures fall back to that snapshot.
const OFFLINE_CACHE_KEY = 'term-sheet-offline-cache';

interface OfflineCache {
  terms?: unknown;
  staff?: unknown;
  assignments?: Record<string, unknown>;
  savedAt?: string;
}

function readOfflineCache(): OfflineCache | null {
  try {
    return JSON.parse(localStorage.getItem(OFFLINE_CACHE_KEY) || 'null');
  } catch {
    return null;
  }
}

function writeOfflineCache(patch: Partial<OfflineCache>) {
  try {
    const current = readOfflineCache() ?? {};
    localStorage.setItem(
      OFFLINE_CACHE_KEY,
      JSON.stringify({ ...current, ...patch, savedAt: new Date().toISOString() }),
    );
  } catch {
    // Storage full or unavailable — the live view still works without the snapshot
  }
}

type ViewMode = 'table' | 'cards';

// ── Sortable table row ────────────────────────────────────────────────────────
interface SortableRowProps {
  assignment: TermAssignment;
  issueCount: number;
  hasUrgent: boolean;
  judge: ReturnType<typeof useCourtPersonnel>['personnel']['judges'][number] | undefined;
  isAdmin?: boolean;
  onIssueBadgeClick?: () => void;
  onEditClick?: () => void;
}

function SortableRow({ assignment: a, issueCount, hasUrgent, judge, isAdmin = true, onIssueBadgeClick, onEditClick }: SortableRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: a.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isVacant = a.justice === '—';
  const sittingDays = formatSittingDays(a.calendar_day);

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`hover:bg-muted/40 transition-colors ${isVacant ? 'bg-amber-500/5' : ''} ${isDragging ? 'shadow-lg' : ''}`}
    >
      {isAdmin && (
        <td className="px-1 py-2 w-6">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground touch-none"
            tabIndex={-1}
          >
            <GripVertical className="h-3.5 w-3.5" />
          </button>
        </td>
      )}
      <td className="px-3 py-2">
        <div className="flex items-center gap-1">
          <span className="font-bold text-primary whitespace-pre-line">{a.part}</span>
          {sittingDays && (
            <span className="text-[9px] text-muted-foreground font-normal" title="Sitting days">
              {sittingDays}
            </span>
          )}
          {isAdmin && issueCount > 0 && (
            <button
              type="button"
              title={`${issueCount} open issue${issueCount > 1 ? 's' : ''} — click to view`}
              className={`inline-flex items-center justify-center h-4 w-4 rounded-full text-[9px] font-bold text-white cursor-pointer hover:scale-110 transition-transform ${hasUrgent ? 'bg-destructive' : 'bg-orange-400'}`}
              onClick={(e) => { e.stopPropagation(); onIssueBadgeClick?.(); }}
            >
              {issueCount}
            </button>
          )}
        </div>
      </td>
      <td className="px-3 py-2">
        <div className="flex items-center gap-1.5">
          {isVacant ? (
            <span className="text-muted-foreground italic">Vacant</span>
          ) : (
            <>
              <span className="font-medium">{a.justice}</span>
              {judge?.judgeStatus && <JudgeStatusBadge status={judge.judgeStatus} />}
            </>
          )}
        </div>
      </td>
      <td className="px-3 py-2">
        <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0">
          {a.room}
        </Badge>
      </td>
      <td className="px-3 py-2 tabular-nums text-muted-foreground hidden sm:table-cell">{a.tel}</td>
      <td className="px-3 py-2 tabular-nums text-muted-foreground hidden md:table-cell">{a.fax}</td>
      <td className="px-3 py-2">
        {a.sergeant !== '—' ? (
          <span className="text-amber-600 dark:text-amber-400 font-medium">{a.sergeant}</span>
        ) : (
          <span className="text-muted-foreground/40">—</span>
        )}
      </td>
      <td className="px-3 py-2">
        {a.clerks.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {a.clerks.map((clerk, ci) => (
              <span key={ci} className="text-muted-foreground">
                {clerk}{ci < a.clerks.length - 1 ? ' ·' : ''}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-muted-foreground/40">—</span>
        )}
      </td>
      {isAdmin && (
        <td className="px-2 py-2 text-right">
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onEditClick} title="Edit assignment">
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        </td>
      )}
    </tr>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
interface TermSheetBoardProps {
  isAdmin?: boolean;
}

export const TermSheetBoard: React.FC<TermSheetBoardProps> = ({ isAdmin = true }) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { isAdmin: userIsAdmin } = useRolePermissions();
  const [viewMode, setViewMode] = useState<ViewMode>(() => isMobile ? 'cards' : 'table');
  const [search, setSearch] = useState('');
  const [sortedList, setSortedList] = useState<TermAssignment[]>([]);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [previewIssueId, setPreviewIssueId] = useState<string | null>(null);
  const [editingAssignment, setEditingAssignment] = useState<EditableAssignment | null>(null);
  const [notifying, setNotifying] = useState(false);
  const [confirmNotify, setConfirmNotify] = useState(false);

  // Pocket-copy mode: true when the browser is offline or the board data came
  // from the local snapshot because the backend was unreachable.
  const [isOffline, setIsOffline] = useState(typeof navigator !== 'undefined' ? !navigator.onLine : false);
  const [servedFromCache, setServedFromCache] = useState(false);
  useEffect(() => {
    const goOnline = () => setIsOffline(false);
    const goOffline = () => setIsOffline(true);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);
  const { toast } = useToast();
  const { personnel } = useCourtPersonnel();
  const queryClient = useQueryClient();
  const { getIssuesForRoom, hasUrgentIssues } = useCourtIssuesIntegration();

  // ── Fetch ALL terms ────────────────────────────────────────────────────────
  const [selectedTermIndex, setSelectedTermIndex] = useState(-1); // -1 = not yet resolved
  const [showStaffHeader, setShowStaffHeader] = useState(true);
  const hasAutoSelected = React.useRef(false);

  // ── Staff editing state ─────────────────────────────────────────────────────
  const [editingStaff, setEditingStaff] = useState(false);
  interface StaffRow { id: string; title: string; name: string; phone: string; room: string; sort_order: number }
  const [editStaffRows, setEditStaffRows] = useState<StaffRow[]>([]);
  const cleanStaffName = (name: string) => name.replace(/\s*\*+\s*$/, '').replace(/\s+-\s+/g, '-').trim();
  const formatStaffLocation = (location: string) => {
    const value = location.trim();
    if (/^\d+(st|nd|rd|th)\s+fl\.?$/i.test(value)) {
      return value.replace(/\s+fl\.?$/i, ' Floor').replace(/^(\d+)(ST|ND|RD|TH)/i, (_, floor, suffix) => `${floor}${suffix.toLowerCase()}`);
    }
    return /^\d+[A-Z]?$/i.test(value) ? `Room ${value}` : value;
  };

  const fmt = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  // Local calendar date (YYYY-MM-DD) — toISOString() is UTC and flips to
  // tomorrow during NY evenings, which would mislabel terms at their boundaries
  const localToday = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  interface TermOption {
    id: string; name: string; rawStart: string; rawEnd: string; startDate: string; endDate: string;
  }
  const { data: allTerms = [] } = useQuery({
    queryKey: ['court-terms-all'],
    queryFn: async (): Promise<TermOption[]> => {
      try {
        const { data, error } = await supabase
          .from('court_terms')
          .select('id, term_name, start_date, end_date')
          .order('start_date', { ascending: false });
        if (error) throw error;
        const mapped = (data || []).map(t => ({
          id: t.id,
          name: t.term_name || 'Unnamed Term',
          rawStart: t.start_date || '',
          rawEnd: t.end_date || '',
          startDate: t.start_date ? fmt(t.start_date) : '',
          endDate: t.end_date ? fmt(t.end_date) : '',
        }));
        writeOfflineCache({ terms: mapped });
        return mapped;
      } catch (e) {
        const cached = readOfflineCache()?.terms as TermOption[] | undefined;
        if (cached?.length) return cached;
        throw e;
      }
    },
    staleTime: 1000 * 60 * 5,
  });

  // Auto-select the term that covers today's date
  useEffect(() => {
    if (allTerms.length === 0 || hasAutoSelected.current) return;
    hasAutoSelected.current = true;

    const today = localToday();
    const todayIndex = allTerms.findIndex(t => t.rawStart <= today && t.rawEnd >= today);

    if (todayIndex >= 0) {
      setSelectedTermIndex(todayIndex);
    } else {
      // No term covers today — default to most recent (index 0)
      setSelectedTermIndex(0);
    }
  }, [allTerms]);

  const currentTerm = allTerms.length > 0 && selectedTermIndex >= 0 ? allTerms[selectedTermIndex] : null;

  // Whether today falls within the selected term's date range
  const todayStr = localToday();
  const isTodayInSelectedTerm = currentTerm
    ? currentTerm.rawStart <= todayStr && currentTerm.rawEnd >= todayStr
    : false;

  // ── Fetch admin staff from database ──────────────────────────────────────────
  const { data: adminStaff = [] } = useQuery({
    queryKey: ['court-admin-staff'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('court_admin_staff')
          .select('id, title, name, phone, room, sort_order')
          .order('sort_order');
        if (error) throw error;
        const rows = (data || []) as StaffRow[];
        writeOfflineCache({ staff: rows });
        return rows;
      } catch (e) {
        const cached = readOfflineCache()?.staff as StaffRow[] | undefined;
        if (cached?.length) return cached;
        throw e;
      }
    },
    staleTime: 1000 * 60 * 5,
  });

  // One push notification to every user (RPC enforces the editor-role gate).
  const broadcastTermUpdate = async (title: string, message: string) => {
    setNotifying(true);
    const { data, error } = await supabase.rpc('broadcast_term_update', {
      p_title: title,
      p_message: message,
    });
    setNotifying(false);
    if (error) {
      toast({ title: 'Could not notify everyone', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Everyone notified', description: `Update sent to ${data} ${data === 1 ? 'person' : 'people'}.` });
    }
  };

  // ── Year-based term calendar ────────────────────────────────────────────────
  // Dates are never typed in: the 13-term year is generated from the pattern
  // (first Monday of January, four-week Monday grid, holiday Monday → Tuesday,
  // Term XIII stretches to the day before next year's Term I).
  const currentYear = Number(todayStr.slice(0, 4));
  const latestStoredYear = allTerms.length > 0 ? Number(allTerms[0].rawStart.slice(0, 4)) : null;
  const setupYearTarget = latestStoredYear === null ? currentYear : latestStoredYear + 1;
  const canSetupYear = latestStoredYear === null || latestStoredYear <= currentYear;

  // Assignment counts per term drive the "copy from previous term" affordance
  const { data: termCounts = {} } = useQuery({
    queryKey: ['term-assignment-counts'],
    queryFn: async (): Promise<Record<string, number>> => {
      const { data, error } = await supabase.from('court_assignments').select('term_id');
      if (error) throw error;
      const counts: Record<string, number> = {};
      for (const row of (data ?? []) as { term_id: string | null }[]) {
        if (row.term_id) counts[row.term_id] = (counts[row.term_id] ?? 0) + 1;
      }
      return counts;
    },
    staleTime: 1000 * 30,
  });

  const setupYearMutation = useMutation({
    mutationFn: async () => {
      const terms = generateYearTerms(setupYearTarget);
      const existing = new Set(allTerms.map(t => `${t.name}|${t.rawStart.slice(0, 4)}`));
      const rows = terms
        .filter(t => !existing.has(`${t.name}|${t.start.slice(0, 4)}`))
        .map(t => ({
          term_name: t.name,
          start_date: t.start,
          end_date: t.end,
          // Legacy required columns: year of the term + courthouse location
          term_number: String(setupYearTarget),
          location: 'New York',
          status: 'active',
          term_status: 'active',
        }));
      if (rows.length === 0) throw new Error(`The ${setupYearTarget} calendar is already set up`);
      const { error } = await supabase.from('court_terms').insert(rows);
      if (error) throw error;
      return rows.length;
    },
    onSuccess: (count) => {
      hasAutoSelected.current = false;
      queryClient.invalidateQueries({ queryKey: ['court-terms-all'] });
      toast({
        title: `${setupYearTarget} calendar ready`,
        description: `${count} terms generated from the court pattern. Use "Copy assignments" when each term needs its roster.`,
      });
    },
    onError: (err: Error) => toast({ variant: 'destructive', title: 'Could not set up the year', description: err.message }),
  });

  // Copy the roster into the selected (empty) term from the most recent
  // earlier term that has assignments.
  const copySource = currentTerm
    ? allTerms.find(t => t.id !== currentTerm.id && t.rawStart < currentTerm.rawStart && (termCounts[t.id] ?? 0) > 0)
    : undefined;

  const copyFromPrevMutation = useMutation({
    mutationFn: async () => {
      if (!currentTerm) throw new Error('No term selected');
      if (!copySource) throw new Error('No earlier term has assignments to copy');
      const { data, error } = await supabase.rpc('copy_term_assignments', {
        p_source_term_id: copySource.id,
        p_target_term_id: currentTerm.id,
      });
      if (error) throw error;
      return { copied: typeof data === 'number' ? data : 0, from: copySource.name };
    },
    onSuccess: ({ copied, from }) => {
      queryClient.invalidateQueries({ queryKey: ['term-sheet-board'] });
      queryClient.invalidateQueries({ queryKey: ['term-assignment-counts'] });
      toast({ title: 'Assignments copied', description: `${copied} assignment${copied !== 1 ? 's' : ''} copied from ${from}. Edit them as needed.` });
    },
    onError: (err: Error) => toast({ variant: 'destructive', title: 'Could not copy assignments', description: err.message }),
  });

  // Prior years are kept only until their terms have fully passed, then the
  // sheet history is cleared to keep exactly one year in play.
  const clearableTerms = allTerms.filter(
    t => Number(t.rawStart.slice(0, 4)) < currentYear && t.rawEnd < todayStr,
  );
  const [confirmClearYears, setConfirmClearYears] = useState(false);

  const clearOldYearsMutation = useMutation({
    mutationFn: async () => {
      const ids = clearableTerms.map(t => t.id);
      if (ids.length === 0) throw new Error('Nothing to clear');
      const { error: aErr } = await supabase.from('court_assignments').delete().in('term_id', ids);
      if (aErr) throw aErr;
      const { error: tErr } = await supabase.from('court_terms').delete().in('id', ids);
      if (tErr) throw tErr;
      return ids.length;
    },
    onSuccess: (count) => {
      hasAutoSelected.current = false;
      setConfirmClearYears(false);
      queryClient.invalidateQueries({ queryKey: ['court-terms-all'] });
      queryClient.invalidateQueries({ queryKey: ['term-sheet-board'] });
      queryClient.invalidateQueries({ queryKey: ['term-assignment-counts'] });
      toast({ title: 'Prior year cleared', description: `${count} past term${count !== 1 ? 's' : ''} removed.` });
    },
    onError: (err: Error) => {
      setConfirmClearYears(false);
      toast({ variant: 'destructive', title: 'Could not clear prior years', description: err.message });
    },
  });

  // ── Save staff edits ───────────────────────────────────────────────────────
  const enterStaffEditMode = () => {
    setEditStaffRows(adminStaff.map(s => ({
      ...s,
      name: cleanStaffName(s.name),
      room: formatStaffLocation(s.room),
    })));
    setEditingStaff(true);
  };

  const saveStaffMutation = useMutation({
    mutationFn: async () => {
      for (const row of editStaffRows) {
        const { data, error } = await supabase.from('court_admin_staff')
          .update({
            title: row.title.trim(),
            name: cleanStaffName(row.name),
            phone: row.phone.trim(),
            room: row.room.trim(),
          })
          .eq('id', row.id)
          .select('id');
        if (error) throw error;
        // RLS-denied updates return no error and zero rows — surface that
        if (!data || data.length === 0) {
          throw new Error("You don't have permission to edit the directory");
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['court-admin-staff'] });
      setEditingStaff(false);
      toast({ title: 'Directory updated', description: 'Staff changes saved.' });
    },
    onError: (err: Error) => toast({ variant: 'destructive', title: 'Could not save directory', description: err.message }),
  });

  // ── Add / remove parts ──────────────────────────────────────────────────────
  const [addPartOpen, setAddPartOpen] = useState(false);
  const [newPartLabel, setNewPartLabel] = useState('');
  const [newPartRoomId, setNewPartRoomId] = useState('');

  // Active courtrooms for the room picker (value = rooms.id, matching court_assignments.room_id)
  const { data: courtroomOptions = [] } = useQuery({
    queryKey: ['active-courtrooms'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('court_rooms')
        .select('room_id, room_number, courtroom_number, is_active, rooms:room_id(room_number, name)')
        .eq('is_active', true);
      if (error) throw error;
      return (data || [])
        .map((r: any) => ({
          roomId: r.room_id as string,
          roomNumber: (r.rooms?.room_number || r.room_number || r.courtroom_number || '') as string,
          label: `Room ${r.rooms?.room_number || r.room_number || r.courtroom_number || '?'}${r.rooms?.name ? ` — ${r.rooms.name}` : ''}`,
        }))
        .sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true }));
    },
    staleTime: 1000 * 60 * 5,
  });

  const addPartMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTermId) throw new Error('Select a term first');
      if (!newPartLabel.trim()) throw new Error('Part name is required');
      if (!newPartRoomId) throw new Error('Pick a courtroom');
      const maxSort = sortedList.reduce((m, a) => Math.max(m, a.sort_order ?? 0), 0);
      const { error } = await supabase.from('court_assignments').insert({
        term_id: selectedTermId,
        room_id: newPartRoomId,
        room_number: courtroomOptions.find(o => o.roomId === newPartRoomId)?.roomNumber ?? '',
        part: newPartLabel.trim(),
        sort_order: maxSort + 1,
      });
      if (error) {
        // Unique (term_id, room_id): each courtroom appears once per term
        if ((error as { code?: string }).code === '23505') {
          throw new Error('That courtroom already has a part on this term\'s sheet. Pick a different room, or edit the existing part instead.');
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['term-sheet-board'] });
      setAddPartOpen(false);
      setNewPartLabel('');
      setNewPartRoomId('');
      toast({ title: 'Part added', description: 'Use the pencil to assign a justice and staff.' });
    },
    onError: (err: Error) => toast({ variant: 'destructive', title: 'Could not add part', description: err.message }),
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // ── Fetch assignments for selected term ──────────────────────────────────────
  const selectedTermId = currentTerm?.id ?? null;

  const { data: assignments = EMPTY_ASSIGNMENTS, isLoading } = useQuery({
    queryKey: ['term-sheet-board', selectedTermId],
    queryFn: async () => {
      // Helper: join raw assignment rows with live room data
      interface AssignmentRow {
        id: string;
        room_id: string;
        part: string | null;
        justice: string | null;
        tel: string | null;
        fax: string | null;
        sergeant: string | null;
        clerks: string[] | null;
        calendar_day: string | null;
        sort_order: number | null;
        updated_at: string | null;
      }
      interface RoomRow {
        id: string;
        room_id: string;
        room_number: string;
        courtroom_number: string | null;
        is_active: boolean;
        rooms: { id: string; name: string; room_number: string } | null;
      }

      const joinWithRooms = async (rows: AssignmentRow[]): Promise<TermAssignment[]> => {
        const { data: roomsData, error: roomsError } = await supabase
          .from("court_rooms")
          .select(`id, room_id, room_number, courtroom_number, is_active, rooms:room_id(id, name, room_number)`);
        if (roomsError) throw roomsError;

        const roomMap = new Map<string, RoomRow>();
        (roomsData || []).forEach((r: Record<string, unknown>) => {
          roomMap.set(r.room_id as string, r as unknown as RoomRow);
        });

        return rows
          .map((a) => {
            const cr = roomMap.get(a.room_id);
            if (!cr || !cr.is_active) return null;
            const liveRoomNumber =
              (cr.rooms as { room_number?: string } | null)?.room_number ||
              cr.room_number ||
              cr.courtroom_number ||
              '—';
            return {
              id: a.id,
              room_id: a.room_id,
              part: a.part || '—',
              justice: a.justice || '—',
              room: liveRoomNumber,
              tel: a.tel || '—',
              fax: a.fax || '—',
              sergeant: a.sergeant || '—',
              clerks: Array.isArray(a.clerks) ? a.clerks.filter(c => c && c !== '—') : [],
              calendar_day: a.calendar_day || null,
              sort_order: a.sort_order ?? 9999,
              updated_at: a.updated_at ?? null,
            } as TermAssignment;
          })
          .filter((r): r is TermAssignment => r !== null);
      };

      const cacheSlot = selectedTermId ?? 'all';
      try {
        // Try fetching with term_id filter
        let query = supabase
          .from("court_assignments")
          .select("id, room_id, part, justice, tel, fax, sergeant, clerks, calendar_day, sort_order, updated_at, term_id")
          .order("sort_order");

        if (selectedTermId) {
          query = query.eq('term_id', selectedTermId);
        }

        const { data: assignmentsData, error: assignmentsError } = await query;

        // If term_id column doesn't exist yet, fall back to unfiltered query
        if (assignmentsError && assignmentsError.message?.includes('term_id')) {
          const { data: fallbackData, error: fallbackError } = await supabase
            .from("court_assignments")
            .select("id, room_id, part, justice, tel, fax, sergeant, clerks, calendar_day, sort_order, updated_at")
            .order("sort_order");
          if (fallbackError) throw fallbackError;
          return joinWithRooms((fallbackData || []) as AssignmentRow[]);
        }

        if (assignmentsError) throw assignmentsError;
        const joined = await joinWithRooms((assignmentsData || []) as AssignmentRow[]);
        writeOfflineCache({
          assignments: { ...(readOfflineCache()?.assignments ?? {}), [cacheSlot]: joined },
        });
        setServedFromCache(false);
        return joined;
      } catch (e) {
        const cached = readOfflineCache()?.assignments?.[cacheSlot] as TermAssignment[] | undefined;
        if (cached?.length) {
          setServedFromCache(true);
          return cached;
        }
        throw e;
      }
    },
    staleTime: 1000 * 30,
  });

  useEffect(() => {
    // Unconditional: an empty term must clear the board, not keep showing the
    // previously selected term's rows
    setSortedList(assignments);
  }, [assignments]);

  // ── Save sort order mutation (optimistic) ─────────────────────────────────
  const saveSortOrder = useMutation({
    mutationFn: async (updates: { id: string; sort_order: number }[]) => {
      // Build payload with expected_updated_at from the current cache so the
      // server can reject the reorder if another user changed any of these
      // rows since we last read them.
      const key = ['term-sheet-board', selectedTermId];
      const cached = queryClient.getQueryData<TermAssignment[]>(key) ?? [];
      const updatedAtMap = new Map(cached.map(a => [a.id, a.updated_at]));

      const items = updates.map(u => ({
        id: u.id,
        sort_order: u.sort_order,
        expected_updated_at: updatedAtMap.get(u.id) ?? null,
      }));

      const { data, error } = await supabase.rpc('reorder_court_assignments', {
        p_term_id: selectedTermId ?? null,
        p_items: items,
      });

      if (error) {
        const err = new Error(error.message) as Error & { failedIds?: string[]; conflict?: boolean };
        throw err;
      }

      const result = (data ?? {}) as { updated?: number; conflicts?: string[] };
      const conflicts = Array.isArray(result.conflicts) ? result.conflicts : [];
      if (conflicts.length > 0) {
        const err = new Error(
          `Reorder conflict: ${conflicts.length} row(s) were modified by someone else`,
        ) as Error & { failedIds?: string[]; conflict?: boolean };
        err.failedIds = conflicts;
        err.conflict = true;
        throw err;
      }
    },
    // Optimistically reorder the cached query so any re-render uses the new order
    onMutate: async (updates) => {
      const key = ['term-sheet-board', selectedTermId];
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<TermAssignment[]>(key);
      if (previous) {
        const orderMap = new Map(updates.map(u => [u.id, u.sort_order]));
        const next = [...previous]
          .map(a => ({ ...a, sort_order: orderMap.get(a.id) ?? a.sort_order }))
          .sort((a, b) => (a.sort_order ?? 9999) - (b.sort_order ?? 9999));
        queryClient.setQueryData(key, next);
      }
      return { previous };
    },
    onError: (err: Error & { failedIds?: string[]; conflict?: boolean }, _vars, ctx) => {
      const key = ['term-sheet-board', selectedTermId];
      const previous = ctx?.previous;

      // Conflict (another user changed the same rows) → full rollback and refetch
      if (err?.conflict) {
        if (previous) {
          queryClient.setQueryData(key, previous);
          setSortedList(previous);
        }
        queryClient.invalidateQueries({ queryKey: key });
        toast({
          variant: 'destructive',
          title: 'Reorder conflict',
          description: 'Someone else changed these rows. Refreshing the latest order — please try again.',
        });
        return;
      }

      // Any other error → full rollback
      if (previous) {
        queryClient.setQueryData(key, previous);
        setSortedList(previous);
      } else {
        setSortedList(assignments);
      }
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save new order.' });
    },
    onSettled: () => {
      // Refresh related views without disturbing the optimistic board state
      queryClient.invalidateQueries({ queryKey: ['court-assignments-enhanced'] });
      queryClient.invalidateQueries({ queryKey: ['court-assignments-table'] });
    },
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setSortedList(prev => {
      const oldIndex = prev.findIndex(a => a.id === active.id);
      const newIndex = prev.findIndex(a => a.id === over.id);
      const reordered = arrayMove(prev, oldIndex, newIndex);
      // Fire-and-forget; cache + local state already reflect the new order
      saveSortOrder.mutate(reordered.map((a, i) => ({ id: a.id, sort_order: i + 1 })));
      return reordered;
    });
  };

  // ── Export helpers ────────────────────────────────────────────────────────
  const exportToCSV = () => {
    if (!sortedList.length) {
      toast({ variant: 'destructive', title: 'No data to export' });
      return;
    }
    const headers = ['PART', 'DAYS', 'JUSTICE', 'ROOM', 'FAX', 'TEL', 'SGT.', 'CLERKS'];
    const rows = sortedList.map(a => [a.part, formatSittingDays(a.calendar_day), a.justice, a.room, a.fax, a.tel, a.sergeant, a.clerks.join(' • ')]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const termSlug = currentTerm ? `${currentTerm.name.replace(/\s+/g, '-').toLowerCase()}-` : '';
    link.download = `criminal-term-sheet-${termSlug}${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast({ title: '✅ Export successful', description: `Exported ${sortedList.length} assignments` });
  };

  // The official layout is the only format that leaves the building — both
  // Export and Print produce it (Print opens the PDF with the print dialog).
  const runOfficialPDF = async (mode: 'download' | 'print') => {
    if (!sortedList.length) {
      toast({ variant: 'destructive', title: 'No data to export' });
      return;
    }
    setPdfLoading(true);
    try {
      // Lazy-load the jsPDF-based exporter so the library is fetched on demand
      const { generateTermSheetPDF } = await import('./TermSheetPDFExport');
      await generateTermSheetPDF(
        sortedList,
        currentTerm
          ? { name: currentTerm.name, startDate: currentTerm.rawStart, endDate: currentTerm.rawEnd }
          : undefined,
        { print: mode === 'print' },
      );
      toast(mode === 'print'
        ? { title: 'Print ready', description: 'The official term sheet opened in a new tab with the print dialog.' }
        : { title: '✅ PDF exported', description: 'Official term sheet downloaded.' });
    } catch (err) {
      toast({ variant: 'destructive', title: 'PDF export failed', description: String(err) });
    } finally {
      setPdfLoading(false);
    }
  };
  const exportToPDF = () => runOfficialPDF('download');

  // Rooms already carrying a part on the selected term (roomId → part label)
  const takenRooms = new Map(sortedList.map(a => [a.room_id, a.part]));

  // ── Filtering ─────────────────────────────────────────────────────────────
  const displayList = search.trim()
    ? sortedList.filter(a => {
        const q = search.toLowerCase();
        return (
          a.part.toLowerCase().includes(q) ||
          a.justice.toLowerCase().includes(q) ||
          a.room.toLowerCase().includes(q) ||
          a.sergeant.toLowerCase().includes(q) ||
          a.clerks.some(c => c.toLowerCase().includes(q))
        );
      })
    : sortedList;

  // ── Stats (admin only) ─────────────────────────────────────────────────────
  const filledParts = sortedList.filter(a => a.justice !== '—').length;
  const vacantParts = sortedList.filter(a => a.justice === '—').length;
  const totalClerks = isAdmin ? new Set(sortedList.flatMap(a => a.clerks).filter(Boolean)).size : 0;
  const roomsWithIssues = isAdmin ? sortedList.filter(a => getIssuesForRoom(a.room_id).length > 0).length : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // "It goes out to everyone": after finishing a round of term edits, the
  // editor pushes one notification to every user rather than each edit
  // spamming the building.
  const notifyEveryone = () => broadcastTermUpdate(
    'Term sheet updated',
    currentTerm?.name
      ? `${currentTerm.name} has been updated. Open the term sheet for the latest assignments.`
      : 'Court assignments have changed. Open the term sheet for the latest.',
  );

  return (
    <div className="space-y-4">
      {/* Pocket-copy banner: the sheet stays readable from the local snapshot */}
      {(isOffline || servedFromCache) && sortedList.length > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
          <WifiOff className="h-3.5 w-3.5 shrink-0" />
          <span>
            {isOffline ? "You're offline" : "The server can't be reached"} — showing your saved copy of the term sheet
            {readOfflineCache()?.savedAt
              ? ` (last synced ${new Date(readOfflineCache()!.savedAt!).toLocaleString()})`
              : ''}.
          </span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-primary/10 shrink-0">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-bold tracking-tight">Criminal Term Sheet</h2>
            {isAdmin ? (
              <p className="text-xs text-muted-foreground">
                {sortedList.length} parts • {filledParts} assigned • {vacantParts} vacant
                {roomsWithIssues > 0 && (
                  <span className="text-destructive ml-1">• {roomsWithIssues} with issues</span>
                )}
              </p>
            ) : currentTerm ? (
              <p className="text-xs text-muted-foreground">
                {sortedList.length} parts • {currentTerm.name}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">{sortedList.length} parts</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {isAdmin && selectedTermId && (
            <Button variant="outline" size="sm" className="h-8 text-xs px-2" onClick={() => setAddPartOpen(true)}>
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add Part
            </Button>
          )}
          {isAdmin && selectedTermId && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs px-2"
              disabled={notifying}
              onClick={() => setConfirmNotify(true)}
              title="Send a notification to every user that the term sheet changed"
            >
              {notifying ? (
                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
              ) : (
                <Megaphone className="h-3.5 w-3.5 mr-1" />
              )}
              Notify everyone
            </Button>
          )}
          <div className="relative">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 w-40 text-xs"
            />
          </div>
          <div className="flex rounded-md border overflow-hidden">
            <Button variant={viewMode === 'table' ? 'default' : 'ghost'} size="sm" className="h-8 px-2 rounded-none" onClick={() => setViewMode('table')}>
              <List className="h-3.5 w-3.5" />
            </Button>
            <Button variant={viewMode === 'cards' ? 'default' : 'ghost'} size="sm" className="h-8 px-2 rounded-none" onClick={() => setViewMode('cards')}>
              <LayoutGrid className="h-3.5 w-3.5" />
            </Button>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-xs px-2" disabled={pdfLoading}>
                {pdfLoading ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Download className="h-3.5 w-3.5 mr-1" />}
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={exportToPDF}>
                <FileText className="h-4 w-4 mr-2" />
                Export Official PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportToCSV}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Export to CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => runOfficialPDF('print')}>
                <Printer className="h-4 w-4 mr-2" />
                Print Official Copy
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Term Selector — dates come from the court calendar, never typed in */}
      {allTerms.length === 0 ? (
        <div className="flex items-center justify-between rounded-lg border border-dashed border-muted-foreground/30 bg-muted/30 px-4 py-4">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-muted-foreground shrink-0" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">No terms stored</p>
              <p className="text-xs text-muted-foreground/60">
                {isAdmin
                  ? `Set up ${setupYearTarget} to generate all 13 terms from the court calendar.`
                  : 'Court administration has not entered any terms yet.'}
              </p>
            </div>
          </div>
          {isAdmin && (
            <Button size="sm" onClick={() => setupYearMutation.mutate()} disabled={setupYearMutation.isPending}>
              {setupYearMutation.isPending ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Plus className="h-3.5 w-3.5 mr-1" />}
              Set up {setupYearTarget} terms
            </Button>
          )}
        </div>
      ) : selectedTermIndex >= 0 && (
        <div className={`rounded-lg border px-4 py-3 ${
          isTodayInSelectedTerm ? 'bg-primary/5 border-primary/20' : 'bg-muted/30 border-muted-foreground/20'
        }`}>
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0"
              disabled={selectedTermIndex >= allTerms.length - 1}
              onClick={() => setSelectedTermIndex(i => Math.min(i + 1, allTerms.length - 1))}
              title="Previous term"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-center min-w-0 flex-1">
              <Select
                value={currentTerm?.id ?? ''}
                onValueChange={(id) => {
                  const idx = allTerms.findIndex(t => t.id === id);
                  if (idx >= 0) setSelectedTermIndex(idx);
                }}
              >
                <SelectTrigger className="mx-auto h-8 w-auto min-w-[8.5rem] justify-center gap-1 border-none bg-transparent text-sm font-semibold shadow-none focus:ring-0">
                  {/* Children override Radix's default echo of the full item row */}
                  <SelectValue placeholder="Pick a term">{currentTerm?.name}</SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-80">
                  {[...allTerms].reverse().map(t => {
                    const isActive = t.rawStart <= todayStr && t.rawEnd >= todayStr;
                    return (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name} · {t.startDate} – {t.endDate}{isActive ? '  (current)' : ''}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">{currentTerm?.startDate} – {currentTerm?.endDate}</p>
              <p className="text-[10px] mt-0.5">
                {isTodayInSelectedTerm
                  ? <span className="text-primary font-medium">Active Term</span>
                  : currentTerm && currentTerm.rawStart > todayStr
                    ? <span className="text-amber-600 dark:text-amber-400 font-medium">Upcoming Term</span>
                    : <span className="text-muted-foreground/60">Past Term</span>}
                <span className="text-muted-foreground/60">{' · '}{allTerms.length} terms stored</span>
              </p>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0"
              disabled={selectedTermIndex <= 0}
              onClick={() => setSelectedTermIndex(i => Math.max(i - 1, 0))}
              title="Next term"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          {/* Admin: calendar upkeep — copy roster into an empty term, prep next year, clear prior years */}
          {isAdmin && (
            <div className="mt-2 pt-2 border-t border-primary/10 flex flex-wrap items-center justify-end gap-2">
              {!isLoading && sortedList.length === 0 && copySource && (
                <Button variant="outline" size="sm" className="h-7 text-xs"
                  onClick={() => copyFromPrevMutation.mutate()}
                  disabled={copyFromPrevMutation.isPending}
                >
                  {copyFromPrevMutation.isPending ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Copy className="h-3 w-3 mr-1" />}
                  Copy assignments from {copySource.name}
                </Button>
              )}
              {clearableTerms.length > 0 && (
                <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground"
                  onClick={() => setConfirmClearYears(true)}
                >
                  Clear {clearableTerms.length} prior-year term{clearableTerms.length !== 1 ? 's' : ''}…
                </Button>
              )}
              {canSetupYear && (
                <Button variant="outline" size="sm" className="h-7 text-xs"
                  onClick={() => setupYearMutation.mutate()}
                  disabled={setupYearMutation.isPending}
                >
                  {setupYearMutation.isPending ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Plus className="h-3 w-3 mr-1" />}
                  Set up {setupYearTarget} terms
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Admin Staff Directory Header — editable by admins */}
      <Card className="overflow-hidden">
        <button
          onClick={() => setShowStaffHeader(!showStaffHeader)}
          className="w-full flex items-center justify-between px-4 py-2.5 bg-muted/50 hover:bg-muted/70 transition-colors text-left"
        >
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold">Court Administration Directory</span>
          </div>
          <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${showStaffHeader ? 'rotate-90' : ''}`} />
        </button>
        {showStaffHeader && (
          <CardContent className="p-0">
            {isAdmin && !editingStaff && (
              <div className="flex justify-end px-3 pt-2">
                <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2" onClick={enterStaffEditMode}>Edit Directory</Button>
              </div>
            )}
            {editingStaff ? (
              <div className="p-3 space-y-2">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="px-2 py-1 text-left text-[10px] font-semibold text-muted-foreground">Title</th>
                        <th className="px-2 py-1 text-left text-[10px] font-semibold text-muted-foreground">Name</th>
                        <th className="px-2 py-1 text-left text-[10px] font-semibold text-muted-foreground">Phone</th>
                        <th className="px-2 py-1 text-left text-[10px] font-semibold text-muted-foreground">Location</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {editStaffRows.map((s, i) => (
                        <tr key={s.id}>
                          <td className="px-1 py-1"><Input value={s.title} onChange={e => { const rows = [...editStaffRows]; rows[i] = { ...rows[i], title: e.target.value }; setEditStaffRows(rows); }} className="h-7 text-xs" /></td>
                          <td className="px-1 py-1"><Input value={s.name} onChange={e => { const rows = [...editStaffRows]; rows[i] = { ...rows[i], name: e.target.value }; setEditStaffRows(rows); }} className="h-7 text-xs" /></td>
                          <td className="px-1 py-1"><Input value={s.phone} onChange={e => { const rows = [...editStaffRows]; rows[i] = { ...rows[i], phone: e.target.value }; setEditStaffRows(rows); }} className="h-7 text-xs font-mono" /></td>
                          <td className="px-1 py-1"><Input value={s.room} onChange={e => { const rows = [...editStaffRows]; rows[i] = { ...rows[i], room: e.target.value }; setEditStaffRows(rows); }} className="h-7 text-xs w-20" /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setEditingStaff(false)}>Cancel</Button>
                  <Button size="sm" className="h-7 text-xs" disabled={saveStaffMutation.isPending} onClick={() => saveStaffMutation.mutate()}>
                    {saveStaffMutation.isPending ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : null}
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="px-3 py-1.5 text-left font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">Title</th>
                      <th className="px-3 py-1.5 text-left font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">Name</th>
                      <th className="px-3 py-1.5 text-left font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">Phone</th>
                      <th className="px-3 py-1.5 text-left font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">Location</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {adminStaff.map((s) => (
                      <tr key={s.id} className="hover:bg-muted/20">
                        <td className="px-3 py-1.5 font-medium text-muted-foreground">{s.title}</td>
                        <td className="px-3 py-1.5 font-medium">{cleanStaffName(s.name)}</td>
                        <td className="px-3 py-1.5 text-primary font-mono tabular-nums">
                          <a href={`tel:${s.phone}`} className="hover:underline">{s.phone}</a>
                        </td>
                        <td className="px-3 py-1.5 text-muted-foreground">{formatStaffLocation(s.room)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Stats Strip (admin only) */}
      {isAdmin && (
        <div className="grid grid-cols-4 gap-2">
          <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2">
            <Gavel className="h-4 w-4 text-blue-500" />
            <div>
              <div className="text-lg font-bold leading-none">{filledParts}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">Justices</div>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2">
            <Shield className="h-4 w-4 text-amber-500" />
            <div>
              <div className="text-lg font-bold leading-none">
                {new Set(sortedList.map(a => a.sergeant).filter(s => s !== '—')).size}
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">Sergeants</div>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2">
            <Users className="h-4 w-4 text-green-500" />
            <div>
              <div className="text-lg font-bold leading-none">{totalClerks}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">Clerks</div>
            </div>
          </div>
          <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${roomsWithIssues > 0 ? 'bg-destructive/5 border-destructive/30' : 'bg-card'}`}>
            <AlertTriangle className={`h-4 w-4 ${roomsWithIssues > 0 ? 'text-destructive' : 'text-muted-foreground/40'}`} />
            <div>
              <div className={`text-lg font-bold leading-none ${roomsWithIssues > 0 ? 'text-destructive' : ''}`}>{roomsWithIssues}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">Issues</div>
            </div>
          </div>
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      {isAdmin && <th className="w-6 px-1" />}
                      <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground text-[10px]">Part</th>
                      <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground text-[10px]">Justice</th>
                      <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground text-[10px]">Room</th>
                      <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground text-[10px] hidden sm:table-cell">Tel</th>
                      <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground text-[10px] hidden md:table-cell">Fax</th>
                      <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground text-[10px]">Sgt.</th>
                      <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground text-[10px]">Clerks</th>
                      {isAdmin && <th className="px-2 py-2.5 w-10" />}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {displayList.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-3 py-8 text-center text-muted-foreground">
                          {search ? 'No matches found' : 'No term assignments available'}
                        </td>
                      </tr>
                    ) : (
                      <SortableContext items={displayList.map(a => a.id)} strategy={verticalListSortingStrategy}>
                        {displayList.map(a => (
                          <SortableRow
                            key={a.id}
                            assignment={a}
                            issueCount={getIssuesForRoom(a.room_id).length}
                            hasUrgent={hasUrgentIssues(a.room_id)}
                            judge={personnel.judges.find(j => j.name === a.justice)}
                            isAdmin={isAdmin}
                            onIssueBadgeClick={() => {
                              const issues = getIssuesForRoom(a.room_id);
                              if (userIsAdmin) {
                                navigate('/operations?tab=issues');
                              } else if (issues.length > 0) {
                                setPreviewIssueId(issues[0].id);
                              }
                            }}
                            onEditClick={() => setEditingAssignment({
                              id: a.id, part: a.part, justice: a.justice, room: a.room, room_id: a.room_id,
                              tel: a.tel, fax: a.fax, sergeant: a.sergeant, clerks: a.clerks,
                              calendar_day: a.calendar_day,
                            })}
                          />
                        ))}
                      </SortableContext>
                    )}
                  </tbody>
                </table>
              </DndContext>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Card View */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {displayList.length === 0 ? (
            <div className="col-span-full text-center py-8 text-muted-foreground">
              {search ? 'No matches found' : 'No term assignments available'}
            </div>
          ) : (
            displayList.map(a => {
              const isVacant = a.justice === '—';
              const judge = personnel.judges.find(j => j.name === a.justice);
              const issueCount = getIssuesForRoom(a.room_id).length;
              const urgentIssue = hasUrgentIssues(a.room_id);
              const sittingDays = formatSittingDays(a.calendar_day);

              return (
                <Card key={a.id} className={`overflow-hidden ${isVacant ? 'border-amber-500/30' : ''} ${isAdmin && issueCount > 0 ? 'border-destructive/30' : ''}`}>
                  <div className={`px-3 py-2 border-b flex items-center justify-between ${isVacant ? 'bg-amber-500/10' : isAdmin && issueCount > 0 ? 'bg-destructive/5' : 'bg-primary/5'}`}>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm text-primary">{a.part}</span>
                      {sittingDays && (
                        <span className="text-[9px] text-muted-foreground" title="Sitting days">{sittingDays}</span>
                      )}
                      {isAdmin && issueCount > 0 && (
                        <span className={`inline-flex items-center gap-0.5 text-[10px] font-medium ${urgentIssue ? 'text-destructive' : 'text-orange-500'}`}>
                          <AlertTriangle className="h-3 w-3" />
                          {issueCount}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0">Rm {a.room}</Badge>
                      {isAdmin && (
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" title="Edit assignment"
                          onClick={() => setEditingAssignment({
                            id: a.id, part: a.part, justice: a.justice, room: a.room, room_id: a.room_id,
                            tel: a.tel, fax: a.fax, sergeant: a.sergeant, clerks: a.clerks,
                            calendar_day: a.calendar_day,
                          })}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-center gap-1.5">
                      <Gavel className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                      {isVacant ? (
                        <span className="text-xs text-muted-foreground italic">Vacant</span>
                      ) : (
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-semibold">{a.justice}</span>
                          {judge?.judgeStatus && <JudgeStatusBadge status={judge.judgeStatus} />}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Shield className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                      {a.sergeant !== '—' ? (
                        <span className="text-xs text-amber-600 dark:text-amber-400">{a.sergeant}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground/40">No sergeant</span>
                      )}
                    </div>
                    <div className="flex items-start gap-1.5">
                      <Users className="h-3.5 w-3.5 text-green-500 shrink-0 mt-0.5" />
                      <div className="text-xs text-muted-foreground">
                        {a.clerks.length > 0 ? a.clerks.join(' · ') : <span className="text-muted-foreground/40">No clerks</span>}
                      </div>
                    </div>
                    {(a.tel !== '—' || a.fax !== '—') && (
                      <div className="flex gap-3 text-[10px] text-muted-foreground pt-1 border-t">
                        {a.tel !== '—' && <span>Tel: {a.tel}</span>}
                        {a.fax !== '—' && <span>Fax: {a.fax}</span>}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* Footer */}
      <div className="text-[10px] text-muted-foreground flex items-center justify-between pt-1">
        <span>Criminal Term Sheet • {new Date().toLocaleDateString()}{isAdmin ? ' • Drag rows to reorder' : ''}</span>
        <span>{displayList.length} of {sortedList.length} shown</span>
      </div>

      {/* Issue preview sheet */}
      <IssuePreviewSheet
        issueId={previewIssueId}
        open={!!previewIssueId}
        onOpenChange={(open) => { if (!open) setPreviewIssueId(null); }}
      />

      {/* Per-row assignment editor */}
      <AssignmentEditDialog
        assignment={editingAssignment}
        open={!!editingAssignment}
        onOpenChange={(open) => { if (!open) setEditingAssignment(null); }}
        takenRooms={takenRooms}
      />

      {/* Confirm before notifying the whole building */}
      <AlertDialog open={confirmNotify} onOpenChange={setConfirmNotify}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Notify everyone?</AlertDialogTitle>
            <AlertDialogDescription>
              This sends a "{currentTerm?.name ?? 'Term sheet'} updated" notification to every user right away.
              Finish all your edits first so people get one notification, not several.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setConfirmNotify(false); notifyEveryone(); }}>
              Send notification
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clear prior-year terms */}
      <AlertDialog open={confirmClearYears} onOpenChange={setConfirmClearYears}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear prior-year terms?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes {clearableTerms.length} past term{clearableTerms.length !== 1 ? 's' : ''} and
              their sheets ({clearableTerms.map(t => t.name).join(', ')}). The current year's calendar is not affected.
              Export any PDFs you want to keep first.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => clearOldYearsMutation.mutate()}
            >
              {clearOldYearsMutation.isPending && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}
              Clear prior years
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add part */}
      <Dialog open={addPartOpen} onOpenChange={setAddPartOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Part{currentTerm ? ` · ${currentTerm.name}` : ''}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label className="text-xs">Part</Label>
              <Input value={newPartLabel} onChange={e => setNewPartLabel(e.target.value)} placeholder="e.g. Part 50" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Courtroom</Label>
              <Select value={newPartRoomId} onValueChange={setNewPartRoomId}>
                <SelectTrigger><SelectValue placeholder="Pick a courtroom" /></SelectTrigger>
                <SelectContent className="max-h-72">
                  {courtroomOptions.map(o => {
                    const takenBy = takenRooms.get(o.roomId)?.replace(/\s+/g, ' ').trim();
                    return (
                      <SelectItem key={o.roomId} value={o.roomId} disabled={!!takenBy}>
                        {o.label}{takenBy ? ` · already on sheet${takenBy !== '—' ? ` (${takenBy})` : ''}` : ''}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            {courtroomOptions.length > 0 && courtroomOptions.every(o => takenRooms.has(o.roomId)) && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Every active courtroom already has a part on this term's sheet. Remove a part first, or activate another courtroom under Spaces.
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              The part is added at the bottom of the sheet — drag to reposition, and use the pencil to assign a justice and staff.
            </p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAddPartOpen(false)}>Cancel</Button>
            <Button onClick={() => addPartMutation.mutate()} disabled={addPartMutation.isPending}>
              {addPartMutation.isPending && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}
              Add Part
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
