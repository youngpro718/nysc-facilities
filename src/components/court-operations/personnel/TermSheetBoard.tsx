import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, ZoomIn, ZoomOut, Download, FileSpreadsheet, Printer } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
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

export const TermSheetBoard: React.FC = () => {
  const [isDense, setIsDense] = useState(false);
  const { toast } = useToast();

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

  // Print term sheet
  const printTermSheet = () => {
    window.print();
  };

  // Fetch term assignments (using same query structure as EnhancedCourtAssignmentTable)
  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ['term-sheet-board'],
    queryFn: async () => {
      // Get all court assignments ordered by sort_order (same as Manage Assignments)
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from("court_assignments")
        .select("*")
        .order("sort_order");

      if (assignmentsError) throw assignmentsError;

      // Get court rooms data
      const { data: roomsData, error: roomsError } = await supabase
        .from("court_rooms")
        .select(`
          id,
          room_id,
          room_number,
          courtroom_number,
          is_active
        `);

      if (roomsError) throw roomsError;

      // Create a map of rooms by room_id for quick lookup
      const roomMap = new Map();
      (roomsData || []).forEach((room: any) => {
        roomMap.set(room.room_id, room);
      });

      // Map assignments to include room data, maintaining sort_order
      const combined = (assignmentsData || [])
        .map((assignment: any) => {
          const room = roomMap.get(assignment.room_id);
          if (!room) return null;
          
          return {
            room_number: room.room_number || room.courtroom_number || '—',
            part: assignment?.part || '—',
            justice: assignment?.justice || '—',
            tel: assignment?.tel || '—',
            fax: assignment?.fax || '—',
            sergeant: assignment?.sergeant || '—',
            clerks: assignment?.clerks || ['—'],
            calendar_day: assignment?.calendar_day || '—',
            is_active: room.is_active,
            sort_order: assignment.sort_order
          };
        })
        .filter((row: any) => row !== null && row.is_active); // Only show active rooms with assignments

      return combined.map((row: any): TermAssignment => ({
        part: row.part,
        justice: row.justice,
        room: row.room_number,
        fax: row.fax,
        tel: row.tel,
        sergeant: row.sergeant,
        clerks: Array.isArray(row.clerks) ? row.clerks : [row.clerks || '—'],
        building: undefined // Building info not in current schema
      }));
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });


  if (isLoading) {
    return (
      <div className="bg-neutral-900 text-neutral-100 min-h-screen p-3">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-neutral-900 text-neutral-100 p-3 pb-safe">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="h-5 w-5 text-blue-400 flex-shrink-0" />
          <h2 className="text-sm font-semibold truncate">Criminal Term – Board</h2>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 flex-shrink-0">
            {assignments.length} Parts
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="text-xs px-2 py-1 h-7 bg-neutral-800 border-neutral-700 hover:bg-neutral-700 flex-shrink-0"
              >
                <Download className="h-3 w-3 mr-1" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-neutral-900 border-neutral-700">
              <DropdownMenuItem onClick={exportToCSV} className="text-neutral-100 hover:bg-neutral-800">
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Export to CSV/Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={printTermSheet} className="text-neutral-100 hover:bg-neutral-800">
                <Printer className="h-4 w-4 mr-2" />
                Print Term Sheet
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            onClick={() => setIsDense(!isDense)}
            variant="outline"
            size="sm"
            className="text-xs px-2 py-1 h-7 bg-neutral-800 border-neutral-700 hover:bg-neutral-700 flex-shrink-0"
          >
            {isDense ? <ZoomOut className="h-3 w-3 mr-1" /> : <ZoomIn className="h-3 w-3 mr-1" />}
            {isDense ? 'Normal' : 'Dense'}
          </Button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="mb-3 bg-blue-500/10 border border-blue-500/20 rounded-lg p-2 text-xs text-blue-300">
        <p className="flex items-center gap-1">
          <span className="font-semibold">📱 Tip:</span>
          <span>Scroll horizontally to see all columns • Toggle density for smaller text</span>
        </p>
      </div>

      {/* Scrollable Table Container */}
      <div className="w-full overflow-x-auto -mx-3 px-3 scrollbar-hide">
        <div className="min-w-max">
          <div className="rounded-lg border border-neutral-800 bg-neutral-950 shadow-2xl overflow-hidden">
            <table className={`w-full ${isDense ? 'text-[11px] leading-[1.05]' : 'text-xs leading-tight'}`}>
              <colgroup>
                <col style={{ minWidth: '80px' }} />
                <col style={{ minWidth: '150px' }} />
                <col style={{ minWidth: '70px' }} />
                <col style={{ minWidth: '100px' }} />
                <col style={{ minWidth: '100px' }} />
                <col style={{ minWidth: '130px' }} />
                <col style={{ minWidth: '200px' }} />
              </colgroup>
              <thead className="bg-neutral-800/70 text-neutral-300">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold border-r border-neutral-700/50 whitespace-nowrap">PART</th>
                  <th className="px-3 py-2 text-left font-semibold border-r border-neutral-700/50 whitespace-nowrap">JUSTICE</th>
                  <th className="px-3 py-2 text-left font-semibold border-r border-neutral-700/50 whitespace-nowrap">ROOM</th>
                  <th className="px-3 py-2 text-left font-semibold border-r border-neutral-700/50 whitespace-nowrap">FAX</th>
                  <th className="px-3 py-2 text-left font-semibold border-r border-neutral-700/50 whitespace-nowrap">TEL</th>
                  <th className="px-3 py-2 text-left font-semibold border-r border-neutral-700/50 whitespace-nowrap">SGT.</th>
                  <th className="px-3 py-2 text-left font-semibold whitespace-nowrap">CLERKS</th>
                </tr>
              </thead>
              <tbody>
                {assignments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-8 text-center text-neutral-400">
                      No term assignments available
                    </td>
                  </tr>
                ) : (
                  assignments.map((assignment, index) => (
                    <tr
                      key={`${assignment.part}-${index}`}
                      className={`border-t border-neutral-800 hover:bg-neutral-800/30 transition-colors ${
                        index % 2 === 0 ? 'bg-neutral-900/50' : 'bg-neutral-900/30'
                      }`}
                    >
                      <td className="px-3 py-2 font-semibold text-blue-300 border-r border-neutral-800/50 whitespace-nowrap">
                        {assignment.part}
                      </td>
                      <td className="px-3 py-2 text-neutral-200 border-r border-neutral-800/50">
                        {assignment.justice}
                      </td>
                      <td className="px-3 py-2 text-neutral-300 border-r border-neutral-800/50 text-center whitespace-nowrap">
                        {assignment.room}
                      </td>
                      <td className="px-3 py-2 text-neutral-300 border-r border-neutral-800/50 tabular-nums whitespace-nowrap">
                        {assignment.fax}
                      </td>
                      <td className="px-3 py-2 text-neutral-300 border-r border-neutral-800/50 tabular-nums whitespace-nowrap">
                        {assignment.tel}
                      </td>
                      <td className="px-3 py-2 text-neutral-200 border-r border-neutral-800/50">
                        {assignment.sergeant}
                      </td>
                      <td className="px-3 py-2 text-neutral-300">
                        {assignment.clerks.join(' • ')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer Info */}
          <div className="mt-2 text-[10px] text-neutral-500 flex items-center justify-between">
            <span>Criminal Term Sheet • All Columns Visible</span>
            <span>{new Date().toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-2 gap-2">
        <div className="bg-neutral-800/40 rounded-lg p-3 border border-neutral-700/50">
          <div className="text-neutral-400 text-[10px] uppercase tracking-wide">Total Parts</div>
          <div className="text-2xl font-bold text-neutral-100 mt-1">{assignments.length}</div>
        </div>
        <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-500/20">
          <div className="text-blue-400 text-[10px] uppercase tracking-wide">Active Justices</div>
          <div className="text-2xl font-bold text-blue-300 mt-1">
            {new Set(assignments.map(a => a.justice).filter(j => j !== '—')).size}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 bg-neutral-800/30 rounded-lg p-3 border border-neutral-700/50">
        <h3 className="text-xs font-semibold text-neutral-300 mb-2">Column Guide</h3>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-neutral-400">
          <div><span className="font-semibold text-neutral-300">PART:</span> Court Part/Division</div>
          <div><span className="font-semibold text-neutral-300">JUSTICE:</span> Presiding Judge</div>
          <div><span className="font-semibold text-neutral-300">ROOM:</span> Courtroom Number</div>
          <div><span className="font-semibold text-neutral-300">FAX:</span> Fax Extension</div>
          <div><span className="font-semibold text-neutral-300">TEL:</span> Phone Extension</div>
          <div><span className="font-semibold text-neutral-300">SGT:</span> Court Sergeant</div>
          <div className="col-span-2"><span className="font-semibold text-neutral-300">CLERKS:</span> Court Clerks (• separated)</div>
        </div>
      </div>
    </div>
  );
};
