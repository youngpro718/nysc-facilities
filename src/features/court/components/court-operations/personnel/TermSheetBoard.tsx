import React, { useState, useEffect } from 'react';
import { useIsMobile } from '@shared/hooks/use-mobile';
import { Loader2, GripVertical, AlertTriangle, Calendar, ChevronLeft, ChevronRight, Plus, Phone } from "lucide-react";
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
import { JudgeStatusBadge } from '@features/court/components/court/JudgeStatusManager';
import { useCourtIssuesIntegration } from '@features/court/hooks/useCourtIssuesIntegration';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { generateTermSheetPDF } from './TermSheetPDFExport';

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
  sort_order: number;
}

type ViewMode = 'table' | 'cards';

// ── Sortable table row ────────────────────────────────────────────────────────
interface SortableRowProps {
  assignment: TermAssignment;
  issueCount: number;
  hasUrgent: boolean;
  judge: ReturnType<typeof useCourtPersonnel>['personnel']['judges'][number] | undefined;
  isAdmin?: boolean;
}

function SortableRow({ assignment: a, issueCount, hasUrgent, judge, isAdmin = true }: SortableRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: a.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isVacant = a.justice === '—';

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
          {isAdmin && issueCount > 0 && (
            <span
              title={`${issueCount} open issue${issueCount > 1 ? 's' : ''}`}
              className={`inline-flex items-center justify-center h-4 w-4 rounded-full text-[9px] font-bold text-white ${hasUrgent ? 'bg-destructive' : 'bg-orange-400'}`}
            >
              {issueCount}
            </span>
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
    </tr>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
interface TermSheetBoardProps {
  isAdmin?: boolean;
}

export const TermSheetBoard: React.FC<TermSheetBoardProps> = ({ isAdmin = true }) => {
  const isMobile = useIsMobile();
  const [viewMode, setViewMode] = useState<ViewMode>(() => isMobile ? 'cards' : 'table');
  const [search, setSearch] = useState('');
  const [sortedList, setSortedList] = useState<TermAssignment[]>([]);
  const [pdfLoading, setPdfLoading] = useState(false);
  const { toast } = useToast();
  const { personnel } = useCourtPersonnel();
  const queryClient = useQueryClient();
  const { getIssuesForRoom, hasUrgentIssues } = useCourtIssuesIntegration();

  // ── Fetch ALL terms ────────────────────────────────────────────────────────
  const [selectedTermIndex, setSelectedTermIndex] = useState(-1); // -1 = not yet resolved
  const [showStaffHeader, setShowStaffHeader] = useState(true);
  const hasAutoSelected = React.useRef(false);

  // ── Inline term editing state ───────────────────────────────────────────────
  const [editingTerm, setEditingTerm] = useState(false);
  const [editTermName, setEditTermName] = useState('');
  const [editTermStart, setEditTermStart] = useState('');
  const [editTermEnd, setEditTermEnd] = useState('');

  // ── Staff editing state ─────────────────────────────────────────────────────
  const [editingStaff, setEditingStaff] = useState(false);
  interface StaffRow { id: string; title: string; name: string; phone: string; room: string; sort_order: number }
  const [editStaffRows, setEditStaffRows] = useState<StaffRow[]>([]);

  const fmt = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const { data: allTerms = [] } = useQuery({
    queryKey: ['court-terms-all'],
    queryFn: async () => {
      const { data } = await supabase
        .from('court_terms')
        .select('id, term_name, start_date, end_date')
        .order('start_date', { ascending: false });
      return (data || []).map(t => ({
        id: t.id,
        name: t.term_name || 'Unnamed Term',
        rawStart: t.start_date || '',
        rawEnd: t.end_date || '',
        startDate: t.start_date ? fmt(t.start_date) : '',
        endDate: t.end_date ? fmt(t.end_date) : '',
      }));
    },
    staleTime: 1000 * 60 * 5,
  });

  // Auto-select the term that covers today's date
  useEffect(() => {
    if (allTerms.length === 0 || hasAutoSelected.current) return;
    hasAutoSelected.current = true;

    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
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
  const todayStr = new Date().toISOString().slice(0, 10);
  const isTodayInSelectedTerm = currentTerm
    ? currentTerm.rawStart <= todayStr && currentTerm.rawEnd >= todayStr
    : false;

  // ── Fetch admin staff from database ──────────────────────────────────────────
  const { data: adminStaff = [] } = useQuery({
    queryKey: ['court-admin-staff'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('court_admin_staff')
        .select('id, title, name, phone, room, sort_order')
        .order('sort_order');
      if (error) throw error;
      return (data || []) as StaffRow[];
    },
    staleTime: 1000 * 60 * 5,
  });

  // ── Update current term inline ─────────────────────────────────────────────
  const enterTermEditMode = () => {
    if (!currentTerm) return;
    setEditTermName(currentTerm.name);
    setEditTermStart(currentTerm.rawStart);
    setEditTermEnd(currentTerm.rawEnd);
    setEditingTerm(true);
  };

  const updateTermMutation = useMutation({
    mutationFn: async () => {
      if (!currentTerm) throw new Error('No term selected');
      const { error } = await supabase
        .from('court_terms')
        .update({ term_name: editTermName, start_date: editTermStart, end_date: editTermEnd })
        .eq('id', currentTerm.id);
      if (error) throw error;
    },
    onSuccess: () => {
      hasAutoSelected.current = false;
      queryClient.invalidateQueries({ queryKey: ['court-terms-all'] });
      setEditingTerm(false);
      toast({ title: 'Term updated', description: 'Changes saved and visible to all users.' });
    },
    onError: (err) => toast({ variant: 'destructive', title: 'Error', description: String(err) }),
  });

  // ── Start next term (one-click) ────────────────────────────────────────────
  const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
  const nextTermName = (name: string): string => {
    const match = name.match(/^(.*?\s*)(I{1,3}|IV|VI{0,3}|IX|XI{0,2}|X{0,3})(\s*.*)$/i);
    if (!match) return name + ' II';
    const idx = romanNumerals.indexOf(match[2].toUpperCase());
    const next = idx >= 0 && idx < romanNumerals.length - 1 ? romanNumerals[idx + 1] : romanNumerals[0];
    return `${match[1]}${next}${match[3]}`;
  };

  const startNextTermMutation = useMutation({
    mutationFn: async () => {
      const latest = allTerms[0];
      // Compute next term name + dates
      const termName = latest ? nextTermName(latest.name) : 'Term I';
      let startDate: string, endDate: string;
      if (latest) {
        const prevEnd = new Date(latest.rawEnd + 'T12:00:00');
        const prevStart = new Date(latest.rawStart + 'T12:00:00');
        const ns = new Date(prevEnd); ns.setDate(ns.getDate() + 1);
        const dur = Math.max(Math.round((prevEnd.getTime() - prevStart.getTime()) / 86400000), 28);
        const ne = new Date(ns); ne.setDate(ne.getDate() + dur);
        startDate = ns.toISOString().slice(0, 10);
        endDate = ne.toISOString().slice(0, 10);
      } else {
        const today = new Date();
        startDate = today.toISOString().slice(0, 10);
        const fw = new Date(today); fw.setDate(fw.getDate() + 28);
        endDate = fw.toISOString().slice(0, 10);
      }
      // Insert new term
      const { data: newTerm, error: insertErr } = await supabase
        .from('court_terms')
        .insert({ term_name: termName, start_date: startDate, end_date: endDate })
        .select('id')
        .single();
      if (insertErr) throw insertErr;
      // Copy assignments from previous term
      if (latest && newTerm) {
        await supabase.rpc('copy_term_assignments', {
          p_source_term_id: latest.id,
          p_target_term_id: newTerm.id,
        });
      }
      return newTerm;
    },
    onSuccess: () => {
      hasAutoSelected.current = false;
      queryClient.invalidateQueries({ queryKey: ['court-terms-all'] });
      queryClient.invalidateQueries({ queryKey: ['term-sheet-board'] });
      toast({ title: 'Next term started', description: 'Assignments copied. Edit them as needed.' });
    },
    onError: (err) => toast({ variant: 'destructive', title: 'Error', description: String(err) }),
  });

  // ── Save staff edits ───────────────────────────────────────────────────────
  const enterStaffEditMode = () => {
    setEditStaffRows(adminStaff.map(s => ({ ...s })));
    setEditingStaff(true);
  };

  const saveStaffMutation = useMutation({
    mutationFn: async () => {
      for (const row of editStaffRows) {
        await supabase.from('court_admin_staff')
          .update({ title: row.title, name: row.name, phone: row.phone, room: row.room })
          .eq('id', row.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['court-admin-staff'] });
      setEditingStaff(false);
      toast({ title: 'Directory updated', description: 'Staff changes saved.' });
    },
    onError: (err) => toast({ variant: 'destructive', title: 'Error', description: String(err) }),
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // ── Fetch assignments for selected term ──────────────────────────────────────
  const selectedTermId = currentTerm?.id ?? null;

  const { data: assignments = [], isLoading } = useQuery({
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
              sort_order: a.sort_order ?? 9999,
            } as TermAssignment;
          })
          .filter((r): r is TermAssignment => r !== null);
      };

      // Try fetching with term_id filter
      let query = supabase
        .from("court_assignments")
        .select("id, room_id, part, justice, tel, fax, sergeant, clerks, calendar_day, sort_order, term_id")
        .order("sort_order");

      if (selectedTermId) {
        query = query.eq('term_id', selectedTermId);
      }

      const { data: assignmentsData, error: assignmentsError } = await query;

      // If term_id column doesn't exist yet, fall back to unfiltered query
      if (assignmentsError && assignmentsError.message?.includes('term_id')) {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from("court_assignments")
          .select("id, room_id, part, justice, tel, fax, sergeant, clerks, calendar_day, sort_order")
          .order("sort_order");
        if (fallbackError) throw fallbackError;
        return joinWithRooms((fallbackData || []) as AssignmentRow[]);
      }

      if (assignmentsError) throw assignmentsError;
      return joinWithRooms((assignmentsData || []) as AssignmentRow[]);
    },
    staleTime: 1000 * 30,
  });

  useEffect(() => {
    if (assignments.length > 0) setSortedList(assignments);
  }, [assignments]);

  // ── Save sort order mutation ───────────────────────────────────────────────
  const saveSortOrder = useMutation({
    mutationFn: async (updates: { id: string; sort_order: number }[]) => {
      for (const u of updates) {
        await supabase.from('court_assignments').update({ sort_order: u.sort_order }).eq('id', u.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['term-sheet-board'] });
      queryClient.invalidateQueries({ queryKey: ['court-assignments-enhanced'] });
      queryClient.invalidateQueries({ queryKey: ['court-assignments-table'] });
    },
    onError: () => {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save new order.' });
      setSortedList(assignments); // revert
    },
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setSortedList(prev => {
      const oldIndex = prev.findIndex(a => a.id === active.id);
      const newIndex = prev.findIndex(a => a.id === over.id);
      const reordered = arrayMove(prev, oldIndex, newIndex);
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
    const headers = ['PART', 'JUSTICE', 'ROOM', 'FAX', 'TEL', 'SGT.', 'CLERKS'];
    const rows = sortedList.map(a => [a.part, a.justice, a.room, a.fax, a.tel, a.sergeant, a.clerks.join(' • ')]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    link.download = `criminal-term-sheet-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast({ title: '✅ Export successful', description: `Exported ${sortedList.length} assignments` });
  };

  const exportToPDF = async () => {
    if (!sortedList.length) {
      toast({ variant: 'destructive', title: 'No data to export' });
      return;
    }
    setPdfLoading(true);
    try {
      await generateTermSheetPDF(sortedList);
      toast({ title: '✅ PDF exported', description: 'Official term sheet downloaded.' });
    } catch (err) {
      toast({ variant: 'destructive', title: 'PDF export failed', description: String(err) });
    } finally {
      setPdfLoading(false);
    }
  };

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

  return (
    <div className="space-y-4">
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
              <DropdownMenuItem onClick={() => window.print()}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Term Selector — inline editable for admins */}
      {allTerms.length === 0 ? (
        <div className="flex items-center justify-between rounded-lg border border-dashed border-muted-foreground/30 bg-muted/30 px-4 py-4">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-muted-foreground shrink-0" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">No current terms stored</p>
              <p className="text-xs text-muted-foreground/60">
                {isAdmin ? 'Click "Start First Term" to begin.' : 'Court administration has not entered any terms yet.'}
              </p>
            </div>
          </div>
          {isAdmin && (
            <Button size="sm" onClick={() => startNextTermMutation.mutate()} disabled={startNextTermMutation.isPending}>
              {startNextTermMutation.isPending ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Plus className="h-3.5 w-3.5 mr-1" />}
              Start First Term
            </Button>
          )}
        </div>
      ) : selectedTermIndex >= 0 && (
        <div className={`rounded-lg border px-4 py-3 ${
          isTodayInSelectedTerm ? 'bg-primary/5 border-primary/20' : 'bg-muted/30 border-muted-foreground/20'
        }`}>
          {editingTerm ? (
            /* ── Inline edit mode ── */
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">Term Name</Label>
                  <Input value={editTermName} onChange={e => setEditTermName(e.target.value)} className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">Start Date</Label>
                  <Input type="date" value={editTermStart} onChange={e => setEditTermStart(e.target.value)} className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">End Date</Label>
                  <Input type="date" value={editTermEnd} onChange={e => setEditTermEnd(e.target.value)} className="h-8 text-sm" />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setEditingTerm(false)}>Cancel</Button>
                <Button size="sm" className="h-7 text-xs" disabled={updateTermMutation.isPending} onClick={() => updateTermMutation.mutate()}>
                  {updateTermMutation.isPending ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : null}
                  Save
                </Button>
              </div>
            </div>
          ) : (
            /* ── Display mode ── */
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0"
                disabled={selectedTermIndex >= allTerms.length - 1}
                onClick={() => setSelectedTermIndex(i => Math.min(i + 1, allTerms.length - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-center min-w-0 flex-1">
                <p className="text-sm font-semibold">{currentTerm?.name}</p>
                <p className="text-xs text-muted-foreground">{currentTerm?.startDate} – {currentTerm?.endDate}</p>
                <p className="text-[10px] mt-0.5">
                  {isTodayInSelectedTerm
                    ? <span className="text-primary font-medium">Active Term</span>
                    : <span className="text-muted-foreground/60">Past Term</span>}
                  {allTerms.length > 1 && <span className="text-muted-foreground/60">{' · '}{allTerms.length} terms stored</span>}
                </p>
              </div>
              <div className="flex items-center gap-1">
                {isAdmin && isTodayInSelectedTerm && (
                  <Button variant="ghost" size="sm" className="h-7 text-xs px-2" onClick={enterTermEditMode}>
                    Edit
                  </Button>
                )}
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0"
                  disabled={selectedTermIndex <= 0}
                  onClick={() => setSelectedTermIndex(i => Math.max(i - 1, 0))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
          {/* Admin: Start Next Term button */}
          {isAdmin && isTodayInSelectedTerm && !editingTerm && (
            <div className="mt-2 pt-2 border-t border-primary/10 flex justify-end">
              <Button variant="outline" size="sm" className="h-7 text-xs"
                disabled={startNextTermMutation.isPending}
                onClick={() => startNextTermMutation.mutate()}
              >
                {startNextTermMutation.isPending ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Plus className="h-3 w-3 mr-1" />}
                Start Next Term
              </Button>
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
            <span className="text-xs font-semibold uppercase tracking-wider">Court Administration Directory</span>
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
                        <th className="px-2 py-1 text-left text-[10px] font-semibold text-muted-foreground">Room</th>
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
                      <th className="px-3 py-1.5 text-left font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">Room</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {adminStaff.map((s) => (
                      <tr key={s.id} className="hover:bg-muted/20">
                        <td className="px-3 py-1.5 font-medium text-muted-foreground">{s.title}</td>
                        <td className="px-3 py-1.5 font-medium">{s.name}</td>
                        <td className="px-3 py-1.5 text-primary font-mono tabular-nums">
                          <a href={`tel:${s.phone}`} className="hover:underline">{s.phone}</a>
                        </td>
                        <td className="px-3 py-1.5 text-muted-foreground">{s.room}</td>
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
                      <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">Part</th>
                      <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">Justice</th>
                      <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">Room</th>
                      <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground uppercase tracking-wider text-[10px] hidden sm:table-cell">Tel</th>
                      <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground uppercase tracking-wider text-[10px] hidden md:table-cell">Fax</th>
                      <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">Sgt.</th>
                      <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">Clerks</th>
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

              return (
                <Card key={a.id} className={`overflow-hidden ${isVacant ? 'border-amber-500/30' : ''} ${isAdmin && issueCount > 0 ? 'border-destructive/30' : ''}`}>
                  <div className={`px-3 py-2 border-b flex items-center justify-between ${isVacant ? 'bg-amber-500/10' : isAdmin && issueCount > 0 ? 'bg-destructive/5' : 'bg-primary/5'}`}>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm text-primary">{a.part}</span>
                      {isAdmin && issueCount > 0 && (
                        <span className={`inline-flex items-center gap-0.5 text-[10px] font-medium ${urgentIssue ? 'text-destructive' : 'text-orange-500'}`}>
                          <AlertTriangle className="h-3 w-3" />
                          {issueCount}
                        </span>
                      )}
                    </div>
                    <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0">Rm {a.room}</Badge>
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
    </div>
  );
};
