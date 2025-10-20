import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Phone, Printer, Calendar, Shield, Building2 } from 'lucide-react';

interface SergeantData {
  id: string;
  name: string;
  phone?: string;
  extension?: string;
  fax?: string;
  calendar_day?: string;
  status: 'assigned' | 'available' | 'unavailable';
  building?: string;
  room?: string;
  floor?: string;
}

export const SergeantsCompactTable: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch sergeants from term_personnel table
  const { data: sergeants = [], isLoading } = useQuery({
    queryKey: ['sergeants-compact'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('term_personnel')
        .select('*')
        .eq('role', 'Sergeant')
        .order('name');

      if (error) throw error;

      return (data || []).map((person): SergeantData => ({
        id: person.id,
        name: person.name,
        phone: person.phone || undefined,
        extension: person.extension || undefined,
        fax: person.fax || undefined,
        calendar_day: person.calendar_day || undefined,
        status: person.phone ? 'assigned' : 'available',
        building: person.building || undefined,
        room: person.room || undefined,
        floor: person.floor || undefined,
      }));
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Filter sergeants based on search
  const filteredSergeants = useMemo(() => {
    if (!searchTerm) return sergeants;
    
    const term = searchTerm.toLowerCase();
    return sergeants.filter(sgt => 
      sgt.name.toLowerCase().includes(term) ||
      sgt.phone?.toLowerCase().includes(term) ||
      sgt.extension?.toLowerCase().includes(term) ||
      sgt.building?.toLowerCase().includes(term) ||
      sgt.room?.toLowerCase().includes(term)
    );
  }, [sergeants, searchTerm]);

  const getStatusBadge = (status: SergeantData['status']) => {
    switch (status) {
      case 'assigned':
        return <span className="inline-block rounded-full bg-emerald-500/20 text-emerald-300 px-2 py-0.5 text-[11px] font-medium">A</span>;
      case 'available':
        return <span className="inline-block rounded-full bg-blue-500/20 text-blue-300 px-2 py-0.5 text-[11px] font-medium">Av</span>;
      case 'unavailable':
        return <span className="inline-block rounded-full bg-neutral-500/20 text-neutral-400 px-2 py-0.5 text-[11px] font-medium">—</span>;
      default:
        return <span className="text-neutral-400">—</span>;
    }
  };

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
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-emerald-400" />
          <h2 className="text-sm font-semibold">Sergeants</h2>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            {filteredSergeants.length}
          </Badge>
        </div>
        <Input
          placeholder="Search…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="text-xs px-2 py-1 h-7 rounded bg-neutral-800 border border-neutral-700 w-32 sm:w-40"
        />
      </div>

      {/* Compact Table */}
      <div className="overflow-x-auto rounded border border-neutral-800 bg-neutral-900/50">
        <table className="min-w-full text-[12px] leading-tight">
          <thead className="bg-neutral-800/60 text-neutral-300">
            <tr>
              <th 
                className="sticky left-0 z-10 bg-neutral-800/90 backdrop-blur-sm px-2 py-2 text-left font-medium w-32 sm:w-40"
                title="Sergeant Name"
              >
                <div className="flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  <span className="hidden sm:inline">Sgt</span>
                </div>
              </th>
              <th className="px-2 py-2 font-medium text-center" title="Phone Extension">
                <Phone className="h-3.5 w-3.5 mx-auto" />
              </th>
              <th className="px-2 py-2 font-medium text-center" title="Fax">
                <Printer className="h-3.5 w-3.5 mx-auto" />
              </th>
              <th className="px-2 py-2 font-medium text-center" title="Calendar Day">
                <Calendar className="h-3.5 w-3.5 mx-auto" />
              </th>
              <th className="px-2 py-2 font-medium text-center" title="Building">
                <Building2 className="h-3.5 w-3.5 mx-auto" />
              </th>
              <th className="px-2 py-2 font-medium text-center" title="Status">
                ⚡
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredSergeants.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-2 py-8 text-center text-neutral-400 text-xs">
                  {searchTerm ? 'No sergeants found matching your search' : 'No sergeants available'}
                </td>
              </tr>
            ) : (
              filteredSergeants.map((sgt, index) => (
                <tr 
                  key={sgt.id}
                  className={`border-t border-neutral-800 hover:bg-neutral-800/30 transition-colors ${
                    index % 2 === 0 ? 'bg-neutral-900' : 'bg-neutral-900/70'
                  }`}
                >
                  <td className="sticky left-0 z-10 bg-inherit px-2 py-2 font-semibold truncate">
                    {sgt.name}
                  </td>
                  <td className="px-2 py-2 text-center tabular-nums text-neutral-200">
                    {sgt.extension || sgt.phone || <span className="text-neutral-500">—</span>}
                  </td>
                  <td className="px-2 py-2 text-center tabular-nums text-neutral-200">
                    {sgt.fax || <span className="text-neutral-500">—</span>}
                  </td>
                  <td className="px-2 py-2 text-center text-neutral-300">
                    {sgt.calendar_day || <span className="text-neutral-500">—</span>}
                  </td>
                  <td className="px-2 py-2 text-center text-neutral-300 truncate max-w-[80px]">
                    {sgt.building ? (
                      <span className="text-[11px]">{sgt.building.replace('Centre Street Supreme Court', 'CS')}</span>
                    ) : (
                      <span className="text-neutral-500">—</span>
                    )}
                  </td>
                  <td className="px-2 py-2 text-center">
                    {getStatusBadge(sgt.status)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-neutral-400">
        <div className="flex items-center gap-1">
          <Phone className="h-3 w-3" />
          <span>Phone</span>
        </div>
        <div className="flex items-center gap-1">
          <Printer className="h-3 w-3" />
          <span>Fax</span>
        </div>
        <div className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          <span>Calendar</span>
        </div>
        <div className="flex items-center gap-1">
          <Building2 className="h-3 w-3" />
          <span>Building</span>
        </div>
        <div className="flex items-center gap-1">
          <span>⚡</span>
          <span>Status: A=Assigned, Av=Available</span>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mt-3 grid grid-cols-3 gap-2 text-[11px]">
        <div className="bg-neutral-800/40 rounded p-2 border border-neutral-700/50">
          <div className="text-neutral-400">Total</div>
          <div className="text-lg font-bold text-neutral-100">{sergeants.length}</div>
        </div>
        <div className="bg-emerald-500/10 rounded p-2 border border-emerald-500/20">
          <div className="text-emerald-400">Assigned</div>
          <div className="text-lg font-bold text-emerald-300">
            {sergeants.filter(s => s.status === 'assigned').length}
          </div>
        </div>
        <div className="bg-blue-500/10 rounded p-2 border border-blue-500/20">
          <div className="text-blue-400">Available</div>
          <div className="text-lg font-bold text-blue-300">
            {sergeants.filter(s => s.status === 'available').length}
          </div>
        </div>
      </div>
    </div>
  );
};
