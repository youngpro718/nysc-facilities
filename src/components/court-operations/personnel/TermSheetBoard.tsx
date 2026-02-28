import React, { useState } from 'react';
import { Loader2 } from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { FileText, Download, FileSpreadsheet, Printer, Search, LayoutGrid, List, Users, Gavel, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCourtPersonnel } from '@/hooks/useCourtPersonnel';
import { JudgeStatusBadge } from '@/components/court/JudgeStatusManager';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TermAssignment {
  part: string;
  justice: string;
  room: string;
  fax: string;
  tel: string;
  sergeant: string;
  clerks: string[];
  building?: string;
}

type ViewMode = 'table' | 'cards';

export const TermSheetBoard: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [search, setSearch] = useState('');
  const { toast } = useToast();
  const { personnel } = useCourtPersonnel();

  // Export to CSV/Excel
  const exportToCSV = () => {
    if (!assignments || assignments.length === 0) {
      toast({
        variant: "destructive",
        title: "No data to export",
        description: "There are no term assignments to export.",
      });
      return;
    }

    const headers = ['PART', 'JUSTICE', 'ROOM', 'FAX', 'TEL', 'SGT.', 'CLERKS'];
    const rows = assignments.map(a => [
      a.part,
      a.justice,
      a.room,
      a.fax,
      a.tel,
      a.sergeant,
      a.clerks.join(' • ')
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `criminal-term-sheet-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "✅ Export successful",
      description: `Exported ${assignments.length} assignments to CSV`,
    });
  };

  const printTermSheet = () => {
    window.print();
  };

  // Fetch term assignments
  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ['term-sheet-board'],
    queryFn: async () => {
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from("court_assignments")
        .select("*")
        .order("sort_order");

      if (assignmentsError) throw assignmentsError;

      const { data: roomsData, error: roomsError } = await supabase
        .from("court_rooms")
        .select(`id, room_id, room_number, courtroom_number, is_active`);

      if (roomsError) throw roomsError;

      const roomMap = new Map();
      (roomsData || []).forEach((room: Record<string, unknown>) => {
        roomMap.set(room.room_id, room);
      });

      interface AssignmentRow {
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
        room_id: string;
        room_number: string;
        courtroom_number: string | null;
        is_active: boolean;
      }

      const combined = ((assignmentsData || []) as AssignmentRow[])
        .map((assignment) => {
          const room = roomMap.get(assignment.room_id) as RoomRow | undefined;
          if (!room) return null;

          return {
            room_number: room.room_number || room.courtroom_number || '—',
            part: assignment.part || '—',
            justice: assignment.justice || '—',
            tel: assignment.tel || '—',
            fax: assignment.fax || '—',
            sergeant: assignment.sergeant || '—',
            clerks: assignment.clerks || [],
            calendar_day: assignment.calendar_day || '—',
            is_active: room.is_active,
            sort_order: assignment.sort_order
          };
        })
        .filter((row): row is NonNullable<typeof row> => row !== null && row.is_active);

      return combined.map((row): TermAssignment => ({
        part: row.part,
        justice: row.justice,
        room: row.room_number,
        fax: row.fax,
        tel: row.tel,
        sergeant: row.sergeant,
        clerks: Array.isArray(row.clerks) ? row.clerks.filter(c => c && c !== '—') : [],
        building: undefined
      }));
    },
    staleTime: 1000 * 30, // 30 seconds — faster refresh for accurate data
  });

  // Filter by search
  const filteredAssignments = search.trim()
    ? assignments.filter(a => {
      const q = search.toLowerCase();
      return (
        a.part.toLowerCase().includes(q) ||
        a.justice.toLowerCase().includes(q) ||
        a.room.toLowerCase().includes(q) ||
        a.sergeant.toLowerCase().includes(q) ||
        a.clerks.some(c => c.toLowerCase().includes(q))
      );
    })
    : assignments;

  // Stats
  const filledParts = assignments.filter(a => a.justice !== '—').length;
  const vacantParts = assignments.filter(a => a.justice === '—').length;
  const totalClerks = new Set(assignments.flatMap(a => a.clerks).filter(c => c && c !== '—')).size;

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
              {assignments.length} parts • {filledParts} assigned • {vacantParts} vacant
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 w-40 text-xs"
            />
          </div>
          {/* View toggle */}
          <div className="flex rounded-md border overflow-hidden">
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              className="h-8 px-2 rounded-none"
              onClick={() => setViewMode('table')}
            >
              <List className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant={viewMode === 'cards' ? 'default' : 'ghost'}
              size="sm"
              className="h-8 px-2 rounded-none"
              onClick={() => setViewMode('cards')}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </Button>
          </div>
          {/* Export */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-xs px-2">
                <Download className="h-3.5 w-3.5 mr-1" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={exportToCSV}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Export to CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={printTermSheet}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Stats Strip */}
      <div className="grid grid-cols-3 gap-2">
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
              {new Set(assignments.map(a => a.sergeant).filter(s => s !== '—')).size}
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
      </div>

      {/* Table View */}
      {viewMode === 'table' && (
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b bg-muted/50">
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
                  {filteredAssignments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-3 py-8 text-center text-muted-foreground">
                        {search ? 'No matches found' : 'No term assignments available'}
                      </td>
                    </tr>
                  ) : (
                    filteredAssignments.map((a, i) => {
                      const isVacant = a.justice === '—';
                      const judge = personnel.judges.find(j => j.name === a.justice);

                      return (
                        <tr
                          key={`${a.part}-${i}`}
                          className={`hover:bg-muted/40 transition-colors ${isVacant ? 'bg-amber-500/5' : ''}`}
                        >
                          <td className="px-3 py-2">
                            <span className="font-bold text-primary">{a.part}</span>
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
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Card View */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredAssignments.length === 0 ? (
            <div className="col-span-full text-center py-8 text-muted-foreground">
              {search ? 'No matches found' : 'No term assignments available'}
            </div>
          ) : (
            filteredAssignments.map((a, i) => {
              const isVacant = a.justice === '—';
              const judge = personnel.judges.find(j => j.name === a.justice);

              return (
                <Card key={`${a.part}-${i}`} className={`overflow-hidden ${isVacant ? 'border-amber-500/30' : ''}`}>
                  {/* Card Header */}
                  <div className={`px-3 py-2 border-b ${isVacant ? 'bg-amber-500/10' : 'bg-primary/5'}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-primary">{a.part}</span>
                      <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0">
                        Rm {a.room}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-3 space-y-2">
                    {/* Justice */}
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

                    {/* Sergeant */}
                    <div className="flex items-center gap-1.5">
                      <Shield className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                      {a.sergeant !== '—' ? (
                        <span className="text-xs text-amber-600 dark:text-amber-400">{a.sergeant}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground/40">No sergeant</span>
                      )}
                    </div>

                    {/* Clerks */}
                    <div className="flex items-start gap-1.5">
                      <Users className="h-3.5 w-3.5 text-green-500 shrink-0 mt-0.5" />
                      <div className="text-xs text-muted-foreground">
                        {a.clerks.length > 0
                          ? a.clerks.join(' · ')
                          : <span className="text-muted-foreground/40">No clerks</span>
                        }
                      </div>
                    </div>

                    {/* Contact */}
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
        <span>Criminal Term Sheet • {new Date().toLocaleDateString()}</span>
        <span>{filteredAssignments.length} of {assignments.length} shown</span>
      </div>
    </div>
  );
};
