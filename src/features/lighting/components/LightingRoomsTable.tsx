import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  listRoomsWithLightingProfiles,
  upsertRoomLightingProfile,
  type RoomBulbType,
  type RoomCeilingAccess,
  type RoomWithProfile,
} from '@features/lighting/services/roomLightingProfileService';

const BULB_OPTIONS: { value: RoomBulbType; label: string }[] = [
  { value: 'unknown', label: 'Unknown' },
  { value: 'led', label: 'LED' },
  { value: 'fluorescent', label: 'Fluorescent' },
  { value: 'screw_in', label: 'Screw-in' },
  { value: 'mixed', label: 'Mixed' },
];

const CEILING_OPTIONS: { value: RoomCeilingAccess; label: string }[] = [
  { value: 'unknown', label: 'Unknown' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
  { value: 'hard_to_reach', label: 'Hard to reach' },
];

/**
 * Per-room lighting profile management. Admin/FC sees every room, can set
 * bulb type / ceiling access / LED-converted toggle per row. Profile gets
 * auto-filled by trigger from user reports — this is the override / manual
 * entry surface.
 */
export function LightingRoomsTable() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [buildingFilter, setBuildingFilter] = useState<string>('__all__');
  const [bulbFilter, setBulbFilter] = useState<string>('__all__');

  const { data: rooms = [], isLoading } = useQuery({
    queryKey: ['rooms-with-lighting-profiles'],
    queryFn: listRoomsWithLightingProfiles,
  });

  const buildings = useMemo(
    () => Array.from(new Set(rooms.map((r) => r.building_name).filter(Boolean))) as string[],
    [rooms],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rooms.filter((r) => {
      if (buildingFilter !== '__all__' && r.building_name !== buildingFilter) return false;
      if (bulbFilter !== '__all__') {
        const bulb = r.profile?.bulb_type ?? 'unknown';
        if (bulbFilter === 'unprofiled') {
          if (r.profile) return false;
        } else if (bulb !== bulbFilter) return false;
      }
      if (!q) return true;
      const hay = `${r.room_number ?? ''} ${r.name ?? ''} ${r.floor_name ?? ''} ${r.building_name ?? ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [rooms, search, buildingFilter, bulbFilter]);

  const upsert = useMutation({
    mutationFn: upsertRoomLightingProfile,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rooms-with-lighting-profiles'] });
    },
    onError: (e: unknown) => {
      toast.error(`Save failed: ${e instanceof Error ? e.message : 'unknown'}`);
    },
  });

  const save = (
    room: RoomWithProfile,
    patch: Partial<{ bulb_type: RoomBulbType; ceiling_access: RoomCeilingAccess; led_converted: boolean }>,
  ) => {
    upsert.mutate({
      room_id: room.id,
      bulb_type: patch.bulb_type ?? room.profile?.bulb_type ?? 'unknown',
      ceiling_access: patch.ceiling_access ?? room.profile?.ceiling_access ?? 'unknown',
      led_converted: patch.led_converted ?? room.profile?.led_converted ?? (patch.bulb_type === 'led'),
    });
  };

  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by room, floor, or building…"
              className="pl-9 h-9"
            />
          </div>
          <Select value={buildingFilter} onValueChange={setBuildingFilter}>
            <SelectTrigger className="h-9 w-[160px]" aria-label="Building filter"><SelectValue placeholder="All buildings" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All buildings</SelectItem>
              {buildings.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={bulbFilter} onValueChange={setBulbFilter}>
            <SelectTrigger className="h-9 w-[150px]" aria-label="Bulb filter"><SelectValue placeholder="All bulbs" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All bulbs</SelectItem>
              <SelectItem value="unprofiled">Unprofiled</SelectItem>
              {BULB_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading rooms…
          </div>
        ) : filtered.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No rooms match.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                  <th className="px-2 py-2 font-medium">Room</th>
                  <th className="px-2 py-2 font-medium">Floor / Building</th>
                  <th className="px-2 py-2 font-medium">Fixtures</th>
                  <th className="px-2 py-2 font-medium">Bulb</th>
                  <th className="px-2 py-2 font-medium">Ceiling</th>
                  <th className="px-2 py-2 font-medium text-center">LED converted</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 200).map((r) => {
                  const bulb = r.profile?.bulb_type ?? 'unknown';
                  const ceiling = r.profile?.ceiling_access ?? 'unknown';
                  const led = r.profile?.led_converted ?? false;
                  return (
                    <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-2 py-2 align-middle">
                        <span className="font-medium">Room {r.room_number}</span>
                        {r.name && <span className="ml-1 text-xs text-muted-foreground">— {r.name}</span>}
                      </td>
                      <td className="px-2 py-2 align-middle text-xs text-muted-foreground">
                        {r.floor_name ?? '—'}
                        {r.building_name && <span className="ml-1">· {r.building_name}</span>}
                      </td>
                      <td className="px-2 py-2 align-middle">
                        <Select
                          value={bulb}
                          onValueChange={(v) => save(r, { bulb_type: v as RoomBulbType, led_converted: v === 'led' || (led && v !== 'unknown') })}
                        >
                          <SelectTrigger className="h-8 w-[130px]" aria-label={`Bulb type for Room ${r.room_number}`}><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {BULB_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-2 py-2 align-middle">
                        <Select
                          value={ceiling}
                          onValueChange={(v) => save(r, { ceiling_access: v as RoomCeilingAccess })}
                        >
                          <SelectTrigger className="h-8 w-[140px]" aria-label={`Ceiling access for Room ${r.room_number}`}><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {CEILING_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-2 py-2 align-middle text-center">
                        <Switch
                          checked={led}
                          onCheckedChange={(checked) => save(r, { led_converted: checked, bulb_type: checked ? 'led' : bulb })}
                          aria-label={`LED converted for Room ${r.room_number}`}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length > 200 && (
              <p className="mt-2 text-xs text-muted-foreground">
                Showing first 200 of {filtered.length} matches — narrow the search to see more.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
