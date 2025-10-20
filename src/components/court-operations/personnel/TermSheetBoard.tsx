import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, ZoomIn, ZoomOut } from 'lucide-react';

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
  const wrapRef = useRef<HTMLDivElement>(null);

  // Fetch term assignments
  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ['term-sheet-board'],
    queryFn: async () => {
      // Fetch court assignments with all related data
      const { data, error } = await supabase
        .from('court_assignments')
        .select(`
          *,
          court_rooms (
            room_number,
            building:buildings (name)
          ),
          justice:term_personnel!court_assignments_justice_id_fkey (name, phone, fax),
          sergeant:term_personnel!court_assignments_sergeant_id_fkey (name, phone, extension),
          clerk1:term_personnel!court_assignments_clerk1_id_fkey (name),
          clerk2:term_personnel!court_assignments_clerk2_id_fkey (name)
        `)
        .order('part_name');

      if (error) throw error;

      return (data || []).map((assignment: any): TermAssignment => {
        const clerks = [
          assignment.clerk1?.name,
          assignment.clerk2?.name
        ].filter(Boolean);

        return {
          part: assignment.part_name || '—',
          justice: assignment.justice?.name || '—',
          room: assignment.court_rooms?.room_number || '—',
          fax: assignment.justice?.fax || '—',
          tel: assignment.justice?.phone || '—',
          sergeant: assignment.sergeant?.name || '—',
          clerks: clerks.length > 0 ? clerks : ['—'],
          building: assignment.court_rooms?.building?.name || undefined
        };
      });
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Scale board to fit screen width
  useEffect(() => {
    const fitBoard = () => {
      if (!wrapRef.current) return;
      const designWidth = 1024; // Fixed design width
      const vw = document.documentElement.clientWidth - 24; // Account for padding
      const scale = Math.min(vw / designWidth, 1); // Never scale up, only down
      wrapRef.current.style.transform = `scale(${scale})`;
      
      // Adjust container height to match scaled content
      const scaledHeight = wrapRef.current.scrollHeight * scale;
      if (wrapRef.current.parentElement) {
        wrapRef.current.parentElement.style.height = `${scaledHeight}px`;
      }
    };

    fitBoard();
    window.addEventListener('resize', fitBoard);
    window.addEventListener('orientationchange', fitBoard);

    return () => {
      window.removeEventListener('resize', fitBoard);
      window.removeEventListener('orientationchange', fitBoard);
    };
  }, [assignments, isDense]);

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
    <div className="bg-neutral-900 text-neutral-100 min-h-screen p-3">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-400" />
          <h2 className="text-sm font-semibold">Criminal Term – Board</h2>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            {assignments.length} Parts
          </Badge>
        </div>
        <Button
          onClick={() => setIsDense(!isDense)}
          variant="outline"
          size="sm"
          className="text-xs px-2 py-1 h-7 bg-neutral-800 border-neutral-700 hover:bg-neutral-700"
        >
          {isDense ? <ZoomOut className="h-3 w-3 mr-1" /> : <ZoomIn className="h-3 w-3 mr-1" />}
          {isDense ? 'Normal' : 'Dense'}
        </Button>
      </div>

      {/* Info Banner */}
      <div className="mb-3 bg-blue-500/10 border border-blue-500/20 rounded-lg p-2 text-xs text-blue-300">
        <p className="flex items-center gap-1">
          <span className="font-semibold">📱 Tip:</span>
          <span>Pinch to zoom • Scroll to see all rows • Toggle density for smaller text</span>
        </p>
      </div>

      {/* Scaled Board Container */}
      <div style={{ overflow: 'visible', position: 'relative' }}>
        <div
          ref={wrapRef}
          className="origin-top-left"
          style={{ width: '1024px', transformOrigin: 'top left' }}
        >
          <div className="rounded-lg border border-neutral-800 bg-neutral-950 shadow-2xl overflow-hidden">
            <table className={`w-full table-fixed ${isDense ? 'text-[11px] leading-[1.05]' : 'text-[12px] leading-[1.15]'}`}>
              <colgroup>
                <col style={{ width: '90px' }} />   {/* Part */}
                <col style={{ width: '140px' }} />  {/* Justice */}
                <col style={{ width: '70px' }} />   {/* Room */}
                <col style={{ width: '100px' }} />  {/* Fax */}
                <col style={{ width: '90px' }} />   {/* Tel */}
                <col style={{ width: '120px' }} />  {/* Sergeant */}
                <col style={{ width: '414px' }} />  {/* Clerks */}
              </colgroup>
              <thead className="bg-neutral-800/70 text-neutral-300 sticky top-0 z-10">
                <tr>
                  <th className="px-2 py-1.5 text-left font-semibold border-r border-neutral-700/50">PART</th>
                  <th className="px-2 py-1.5 text-left font-semibold border-r border-neutral-700/50">JUSTICE</th>
                  <th className="px-2 py-1.5 text-left font-semibold border-r border-neutral-700/50">ROOM</th>
                  <th className="px-2 py-1.5 text-left font-semibold border-r border-neutral-700/50">FAX</th>
                  <th className="px-2 py-1.5 text-left font-semibold border-r border-neutral-700/50">TEL</th>
                  <th className="px-2 py-1.5 text-left font-semibold border-r border-neutral-700/50">SGT.</th>
                  <th className="px-2 py-1.5 text-left font-semibold">CLERKS</th>
                </tr>
              </thead>
              <tbody>
                {assignments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-2 py-8 text-center text-neutral-400">
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
                      <td className="px-2 py-1.5 font-semibold text-blue-300 border-r border-neutral-800/50">
                        {assignment.part}
                      </td>
                      <td className="px-2 py-1.5 text-neutral-200 border-r border-neutral-800/50 truncate">
                        {assignment.justice}
                      </td>
                      <td className="px-2 py-1.5 text-neutral-300 border-r border-neutral-800/50 text-center">
                        {assignment.room}
                      </td>
                      <td className="px-2 py-1.5 text-neutral-300 border-r border-neutral-800/50 tabular-nums">
                        {assignment.fax}
                      </td>
                      <td className="px-2 py-1.5 text-neutral-300 border-r border-neutral-800/50 tabular-nums">
                        {assignment.tel}
                      </td>
                      <td className="px-2 py-1.5 text-neutral-200 border-r border-neutral-800/50 truncate">
                        {assignment.sergeant}
                      </td>
                      <td className="px-2 py-1.5 text-neutral-300">
                        {assignment.clerks.join(' • ')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer Info */}
          <div className="mt-2 px-2 text-[10px] text-neutral-500 flex items-center justify-between">
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
