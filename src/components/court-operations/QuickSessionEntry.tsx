import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useCreateCourtSession, useRecentCourtSessions } from '@/hooks/useCourtSessions';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { BuildingCode, SessionPeriod } from '@/types/courtSessions';
import { SESSION_STATUSES } from '@/constants/sessionStatuses';
import { Loader2, Zap } from 'lucide-react';

interface QuickSessionEntryProps {
    date: Date;
    period: SessionPeriod;
    buildingCode: BuildingCode;
}

export function QuickSessionEntry({ date, period, buildingCode }: QuickSessionEntryProps) {
    const [roomId, setRoomId] = useState('');
    const [defendants, setDefendants] = useState('');
    const [status, setStatus] = useState('OUT');
    const [attorney, setAttorney] = useState('');
    const defendantsInputRef = useRef<HTMLInputElement>(null);

    const createSession = useCreateCourtSession();
    const dateStr = format(date, 'yyyy-MM-dd');

    // Fetch rooms for building
    const { data: roomsWithAssignments } = useQuery({
        queryKey: ['quick-rooms', buildingCode],
        queryFn: async () => {
            const buildingName = buildingCode === '100' ? '100 Centre Street Supreme Court' : '111 Centre Street Supreme Court';
            const { data: building } = await supabase.from('buildings').select('id').eq('name', buildingName).single();
            if (!building) return [];

            const { data: rooms } = await supabase
                .from('court_rooms')
                .select(`id, room_number, room_id, rooms!inner(floor_id, floors!inner(building_id))`)
                .eq('is_active', true)
                .eq('rooms.floors.building_id', building.id)
                .order('room_number');

            const { data: assignments } = await supabase.from('court_assignments').select('room_id, justice, part');

            return (rooms || []).map(r => ({
                ...r,
                assignment: assignments?.find(a => a.room_id === r.room_id)
            }));
        }
    });

    // Recent sessions for smart defaults
    const { data: recentSessions } = useRecentCourtSessions(roomId);

    useEffect(() => {
        if (roomId && recentSessions && recentSessions.length > 0) {
            if (status === 'OUT') {
                const lastSession = recentSessions[0];
                if (lastSession.status && lastSession.status !== 'CUSTOM') {
                    setStatus(lastSession.status);
                }
            }
        }
    }, [roomId, recentSessions]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!roomId) return;

        const room = roomsWithAssignments?.find(r => r.id === roomId);

        try {
            await createSession.mutateAsync({
                session_date: dateStr,
                period,
                building_code: buildingCode,
                court_room_id: roomId,
                status,
                judge_name: room?.assignment?.justice,
                part_number: room?.assignment?.part,
                defendants: defendants || undefined,
                attorney: attorney || undefined,
                parts_entered_by: 'OWN'
            });

            setDefendants('');
            setAttorney('');
            setStatus('OUT');
            defendantsInputRef.current?.focus();
        } catch (e) {
            // Error handled by mutation
        }
    };

    return (
        <Card className="border-primary/20 bg-primary/5 shadow-none mb-4">
            <CardContent className="p-3">
                <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 items-end">
                    <div className="flex items-center gap-2 mb-2 sm:mb-0 sm:mr-2 h-8 pb-1">
                        <Zap className="h-4 w-4 text-primary" />
                        <span className="text-sm font-semibold text-primary whitespace-nowrap">Quick Entry</span>
                    </div>

                    <div className="flex-1 space-y-1 w-full sm:w-auto min-w-[120px]">
                        <label className="text-xs font-medium text-muted-foreground truncate">Room *</label>
                        <Select value={roomId} onValueChange={setRoomId} required>
                            <SelectTrigger className="h-8 text-sm">
                                <SelectValue placeholder="Room" />
                            </SelectTrigger>
                            <SelectContent>
                                {roomsWithAssignments?.map(r => (
                                    <SelectItem key={r.id} value={r.id}>
                                        Rm {r.room_number} {r.assignment?.part ? `(Pt ${r.assignment.part})` : ''}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex-[2] space-y-1 w-full sm:w-auto min-w-[150px]">
                        <label className="text-xs font-medium text-muted-foreground truncate">Defendants</label>
                        <Input
                            ref={defendantsInputRef}
                            className="h-8 text-sm"
                            placeholder="e.g. John Doe, Jane Smith"
                            value={defendants}
                            onChange={e => setDefendants(e.target.value)}
                            list={roomId ? "qe-defendants" : undefined}
                        />
                    </div>

                    <div className="flex-1 space-y-1 w-full sm:w-auto min-w-[120px]">
                        <label className="text-xs font-medium text-muted-foreground truncate">Status *</label>
                        <Select value={status} onValueChange={setStatus} required>
                            <SelectTrigger className="h-8 text-sm">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {SESSION_STATUSES.map(s => (
                                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex-1 space-y-1 w-full sm:w-auto min-w-[120px]">
                        <label className="text-xs font-medium text-muted-foreground truncate">Attorney</label>
                        <Input
                            className="h-8 text-sm"
                            placeholder="Attorney..."
                            value={attorney}
                            onChange={e => setAttorney(e.target.value)}
                            list={roomId ? "qe-attorneys" : undefined}
                        />
                    </div>

                    <Button type="submit" size="sm" className="h-8 w-full sm:w-auto whitespace-nowrap" disabled={!roomId || createSession.isPending}>
                        {createSession.isPending && <Loader2 className="h-3 w-3 mr-2 animate-spin" />}
                        Save & Next
                    </Button>
                </form>

                {/* Datalists for type-ahead */}
                {recentSessions && recentSessions.length > 0 && (
                    <>
                        <datalist id="qe-defendants">
                            {Array.from(new Set(recentSessions.map(s => s.defendants).filter(Boolean))).slice(0, 10).map(d => (
                                <option key={`qed-${d as string}`} value={d as string} />
                            ))}
                        </datalist>
                        <datalist id="qe-attorneys">
                            {Array.from(new Set(recentSessions.map(s => s.attorney).filter(Boolean))).slice(0, 10).map(a => (
                                <option key={`qea-${a as string}`} value={a as string} />
                            ))}
                        </datalist>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
