import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Phone, Printer, Calendar, Shield, Building2, MapPin, User } from 'lucide-react';

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
  const [selectedSergeant, setSelectedSergeant] = useState<SergeantData | null>(null);

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

  const getStatusColor = (status: SergeantData['status']) => {
    switch (status) {
      case 'assigned':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'available':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'unavailable':
        return 'bg-neutral-500/20 text-neutral-400 border-neutral-500/30';
      default:
        return 'bg-neutral-500/20 text-neutral-400 border-neutral-500/30';
    }
  };

  const getStatusLabel = (status: SergeantData['status']) => {
    switch (status) {
      case 'assigned': return 'Assigned';
      case 'available': return 'Available';
      case 'unavailable': return 'Unavailable';
      default: return 'Unknown';
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
          <Shield className="h-5 w-5 text-emerald-400" />
          <h2 className="text-base font-semibold">Sergeants</h2>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            {filteredSergeants.length}
          </Badge>
        </div>
        <Input
          placeholder="Search…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="text-sm px-3 py-2 h-9 rounded bg-neutral-800 border border-neutral-700 w-40"
        />
      </div>

      {/* Summary Stats */}
      <div className="mb-4 grid grid-cols-3 gap-2 text-[11px]">
        <div className="bg-neutral-800/40 rounded-lg p-2.5 border border-neutral-700/50">
          <div className="text-neutral-400 text-[10px] uppercase tracking-wide">Total</div>
          <div className="text-xl font-bold text-neutral-100 mt-0.5">{sergeants.length}</div>
        </div>
        <div className="bg-emerald-500/10 rounded-lg p-2.5 border border-emerald-500/20">
          <div className="text-emerald-400 text-[10px] uppercase tracking-wide">Assigned</div>
          <div className="text-xl font-bold text-emerald-300 mt-0.5">
            {sergeants.filter(s => s.status === 'assigned').length}
          </div>
        </div>
        <div className="bg-blue-500/10 rounded-lg p-2.5 border border-blue-500/20">
          <div className="text-blue-400 text-[10px] uppercase tracking-wide">Available</div>
          <div className="text-xl font-bold text-blue-300 mt-0.5">
            {sergeants.filter(s => s.status === 'available').length}
          </div>
        </div>
      </div>

      {/* Sergeant Cards */}
      <div className="space-y-2">
        {filteredSergeants.length === 0 ? (
          <div className="text-center py-12 text-neutral-400 text-sm">
            {searchTerm ? 'No sergeants found matching your search' : 'No sergeants available'}
          </div>
        ) : (
          filteredSergeants.map((sgt) => (
            <div
              key={sgt.id}
              onClick={() => setSelectedSergeant(sgt)}
              className="bg-neutral-800/50 border border-neutral-700/50 rounded-lg p-3 hover:bg-neutral-800/70 hover:border-neutral-600 transition-all cursor-pointer active:scale-[0.98]"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                  <h3 className="font-semibold text-sm text-neutral-100">{sgt.name}</h3>
                </div>
                <Badge className={`text-[10px] px-2 py-0.5 border ${getStatusColor(sgt.status)}`}>
                  {getStatusLabel(sgt.status)}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                <div className="flex items-center gap-1.5 text-neutral-300">
                  <Phone className="h-3.5 w-3.5 text-neutral-500" />
                  <span>{sgt.extension || sgt.phone || '—'}</span>
                </div>
                <div className="flex items-center gap-1.5 text-neutral-300">
                  <Printer className="h-3.5 w-3.5 text-neutral-500" />
                  <span>{sgt.fax || '—'}</span>
                </div>
                <div className="flex items-center gap-1.5 text-neutral-300">
                  <Calendar className="h-3.5 w-3.5 text-neutral-500" />
                  <span>{sgt.calendar_day || '—'}</span>
                </div>
                <div className="flex items-center gap-1.5 text-neutral-300">
                  <Building2 className="h-3.5 w-3.5 text-neutral-500" />
                  <span className="truncate">{sgt.building?.replace(' Centre Street Supreme Court', '') || '—'}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Detail Modal */}
      <Dialog open={!!selectedSergeant} onOpenChange={() => setSelectedSergeant(null)}>
        <DialogContent className="bg-neutral-900 border-neutral-700 text-neutral-100 max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5 text-emerald-400" />
              Sergeant Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedSergeant && (
            <div className="space-y-4 pt-2">
              {/* Name & Status */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <User className="h-4 w-4 text-neutral-500" />
                    <span className="text-xs text-neutral-400 uppercase tracking-wide">Name</span>
                  </div>
                  <h3 className="text-xl font-bold text-neutral-100">{selectedSergeant.name}</h3>
                </div>
                <Badge className={`text-xs px-3 py-1 border ${getStatusColor(selectedSergeant.status)}`}>
                  {getStatusLabel(selectedSergeant.status)}
                </Badge>
              </div>

              <div className="h-px bg-neutral-700/50" />

              {/* Contact Information */}
              <div className="space-y-3">
                <h4 className="text-xs text-neutral-400 uppercase tracking-wide font-medium">Contact Information</h4>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between bg-neutral-800/50 rounded-lg p-3 border border-neutral-700/30">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-emerald-400" />
                      <span className="text-sm text-neutral-300">Phone</span>
                    </div>
                    <span className="text-sm font-semibold text-neutral-100 tabular-nums">
                      {selectedSergeant.extension || selectedSergeant.phone || '—'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between bg-neutral-800/50 rounded-lg p-3 border border-neutral-700/30">
                    <div className="flex items-center gap-2">
                      <Printer className="h-4 w-4 text-blue-400" />
                      <span className="text-sm text-neutral-300">Fax</span>
                    </div>
                    <span className="text-sm font-semibold text-neutral-100 tabular-nums">
                      {selectedSergeant.fax || '—'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="h-px bg-neutral-700/50" />

              {/* Schedule & Location */}
              <div className="space-y-3">
                <h4 className="text-xs text-neutral-400 uppercase tracking-wide font-medium">Schedule & Location</h4>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between bg-neutral-800/50 rounded-lg p-3 border border-neutral-700/30">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-purple-400" />
                      <span className="text-sm text-neutral-300">Calendar Day</span>
                    </div>
                    <span className="text-sm font-semibold text-neutral-100">
                      {selectedSergeant.calendar_day || 'Not assigned'}
                    </span>
                  </div>

                  <div className="bg-neutral-800/50 rounded-lg p-3 border border-neutral-700/30">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="h-4 w-4 text-orange-400" />
                      <span className="text-sm text-neutral-300">Location</span>
                    </div>
                    <div className="ml-6 space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Building:</span>
                        <span className="text-neutral-100 font-medium">{selectedSergeant.building || '—'}</span>
                      </div>
                      {selectedSergeant.floor && (
                        <div className="flex justify-between">
                          <span className="text-neutral-400">Floor:</span>
                          <span className="text-neutral-100 font-medium">{selectedSergeant.floor}</span>
                        </div>
                      )}
                      {selectedSergeant.room && (
                        <div className="flex justify-between">
                          <span className="text-neutral-400">Room:</span>
                          <span className="text-neutral-100 font-medium">{selectedSergeant.room}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
