import React, { useState, useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Loader2, GripVertical, AlertTriangle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { FileText, Download, FileSpreadsheet, Printer, Search, LayoutGrid, List, Users, Gavel, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCourtPersonnel } from '@/hooks/useCourtPersonnel';
import { JudgeStatusBadge } from '@/components/court/JudgeStatusManager';
import { useCourtIssuesIntegration } from '@/hooks/useCourtIssuesIntegration';
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
}

function SortableRow({ assignment: a, issueCount, hasUrgent, judge }: SortableRowProps) {
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
      <td className="px-3 py-2">
        <div className="flex items-center gap-1">
          <span className="font-bold text-primary whitespace-pre-line">{a.part}</span>
          {issueCount > 0 && (
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
export const TermSheetBoard: React.FC = () => {
  const isMobile = useIsMobile();
  const [viewMode, setViewMode] = useState<ViewMode>(() => isMobile ? 'cards' : 'table');
  const [search, setSearch] = useState('');
  const [sortedList, setSortedList] = useState<TermAssignment[]>([]);
  const [pdfLoading, setPdfLoading] = useState(false);
  const { toast } = useToast();
  const { personnel } = useCourtPersonnel();
  const queryClient = useQueryClient();
  const { getIssuesForRoom, hasUrgentIssues } = useCourtIssuesIntegration();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // ── Fetch assignments (live room_number from join) ─────────────────────────
  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ['term-sheet-board'],
    queryFn: async () => {
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from("court_assignments")
        .select("id, room_id, part, justice, tel, fax, sergeant, clerks, calendar_day, sort_order")
        .order("sort_order");

      if (assignmentsError) throw assignmentsError;

      // Join to court_rooms → rooms to get the LIVE room_number (not the stale denormalized copy)
      const { data: roomsData, error: roomsError } = await supabase
        .from("court_rooms")
        .select(`id, room_id, room_number, courtroom_number, is_active, rooms:room_id(id, name, room_number)`);

      if (roomsError) throw roomsError;

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

      const roomMap = new Map<string, RoomRow>();
      (roomsData || []).forEach((r: Record<string, unknown>) => {
        roomMap.set(r.room_id as string, r as unknown as RoomRow);
      });

      const combined = ((assignmentsData || []) as AssignmentRow[])
        .map((a) => {
          const cr = roomMap.get(a.room_id);
          if (!cr) return null;
          // Prefer the live room_number from rooms table (joined), fall back to court_rooms.room_number
          const liveRoomNumber =
            (cr.rooms as { room_number?: string } | null)?.room_number ||
            cr.room_number ||
            cr.courtroom_number ||
            '—';

          return {
            id: a.id,
            room_id: a.room_id,
            room_number: liveRoomNumber,
            part: a.part || '—',
            justice: a.justice || '—',
            tel: a.tel || '—',
            fax: a.fax || '—',
            sergeant: a.sergeant || '—',
            clerks: a.clerks || [],
            is_active: cr.is_active,
            sort_order: a.sort_order ?? 9999,
          };
        })
        .filter((r): r is NonNullable<typeof r> => r !== null && r.is_active);

      return combined.map((row): TermAssignment => ({
        id: row.id,
        room_id: row.room_id,
        part: row.part,
        justice: row.justice,
        room: row.room_number,
        fax: row.fax,
        tel: row.tel,
        sergeant: row.sergeant,
        clerks: Array.isArray(row.clerks) ? row.clerks.filter(c => c && c !== '—') : [],
        sort_order: row.sort_order,
      }));
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

  // ── Stats ─────────────────────────────────────────────────────────────────
  const filledParts = sortedList.filter(a => a.justice !== '—').length;
  const vacantParts = sortedList.filter(a => a.justice === '—').length;
  const totalClerks = new Set(sortedList.flatMap(a => a.clerks).filter(Boolean)).size;
  const roomsWithIssues = sortedList.filter(a => getIssuesForRoom(a.room_id).length > 0).length;

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
            <p className="text-xs text-muted-foreground">
              {sortedList.length} parts • {filledParts} assigned • {vacantParts} vacant
              {roomsWithIssues > 0 && (
                <span className="text-destructive ml-1">• {roomsWithIssues} with issues</span>
              )}
            </p>
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

      {/* Stats Strip */}
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

      {/* Table View */}
      {viewMode === 'table' && (
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="w-6 px-1" />
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
                <Card key={a.id} className={`overflow-hidden ${isVacant ? 'border-amber-500/30' : ''} ${issueCount > 0 ? 'border-destructive/30' : ''}`}>
                  <div className={`px-3 py-2 border-b flex items-center justify-between ${isVacant ? 'bg-amber-500/10' : issueCount > 0 ? 'bg-destructive/5' : 'bg-primary/5'}`}>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm text-primary">{a.part}</span>
                      {issueCount > 0 && (
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
        <span>Criminal Term Sheet • {new Date().toLocaleDateString()} • Drag rows to reorder</span>
        <span>{displayList.length} of {sortedList.length} shown</span>
      </div>
    </div>
  );
};
