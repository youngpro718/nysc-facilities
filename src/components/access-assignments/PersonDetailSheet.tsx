import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useOccupantAssignments } from '@/components/occupants/hooks/useOccupantAssignments';
import { useRoomAssignment, PersonSourceType } from '@/components/occupants/hooks/useRoomAssignment';
import { useRooms } from '@/features/facilities/hooks/useFacilities';
import { supabase } from '@/lib/supabase';
import { useQueryClient } from '@tanstack/react-query';
import { logger } from '@/lib/logger';
import { getErrorMessage } from '@/lib/errorUtils';
import { toast } from 'sonner';
import type { PersonnelAccessRecord } from '@/hooks/usePersonnelAccess';

import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
    DoorOpen,
    Key,
    Star,
    Trash2,
    Plus,
    Loader2,
    ChevronsUpDown,
    Check,
    Building2,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface PersonDetailSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    person: PersonnelAccessRecord | null;
}

// ── Key Display Component ─────────────────────────────────────────────────────

interface KeyEntry {
    id: string;
    key_id: string;
    assigned_at: string;
    is_spare: boolean | null;
    is_elevator_card: boolean | null;
    keys: {
        id: string;
        name: string;
        type: string | null;
        is_passkey: boolean | null;
    } | null;
}

function usePersonKeys(personId: string | undefined, sourceType: PersonSourceType) {
    const idColumn = sourceType === 'profile' ? 'profile_id' : 'personnel_profile_id';

    return useQuery<KeyEntry[]>({
        queryKey: ['person-keys', personId, sourceType],
        queryFn: async () => {
            if (!personId) return [];
            const { data, error } = await supabase
                .from('key_assignments')
                .select(`
          id,
          key_id,
          assigned_at,
          is_spare,
          is_elevator_card,
          keys (
            id,
            name,
            type,
            is_passkey
          )
        `)
                .eq(idColumn, personId)
                .is('returned_at', null)
                .order('assigned_at', { ascending: false });

            if (error) throw error;
            return (data || []) as unknown as KeyEntry[];
        },
        enabled: !!personId,
    });
}

function KeysTab({ personId, sourceType }: { personId: string; sourceType: PersonSourceType }) {
    const { data: keys = [], isLoading } = usePersonKeys(personId, sourceType);

    if (isLoading) {
        return (
            <div className="space-y-2 pt-2">
                {[1, 2].map(i => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
        );
    }

    if (keys.length === 0) {
        return (
            <div className="py-10 text-center text-muted-foreground">
                <Key className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">No keys currently held</p>
            </div>
        );
    }

    return (
        <ScrollArea className="max-h-[420px] pr-2">
            <div className="space-y-2 pt-2">
                {keys.map(entry => (
                    <div
                        key={entry.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-muted/20"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-md bg-amber-100 dark:bg-amber-900/30">
                                <Key className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div>
                                <p className="font-medium text-sm">{entry.keys?.name || 'Unknown Key'}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                    {entry.keys?.type && (
                                        <span className="text-xs text-muted-foreground capitalize">{entry.keys.type}</span>
                                    )}
                                    {entry.keys?.is_passkey && (
                                        <Badge variant="secondary" className="text-xs h-4">Passkey</Badge>
                                    )}
                                    {entry.is_elevator_card && (
                                        <Badge variant="outline" className="text-xs h-4">Elevator</Badge>
                                    )}
                                    {entry.is_spare && (
                                        <Badge variant="outline" className="text-xs h-4">Spare</Badge>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Since {format(new Date(entry.assigned_at), 'MMM d, yyyy')}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </ScrollArea>
    );
}

// ── Rooms Tab Component ───────────────────────────────────────────────────────

function RoomsTab({
    personId,
    sourceType,
}: {
    personId: string;
    sourceType: PersonSourceType;
}) {
    const [isPickerOpen, setIsPickerOpen] = useState(false);
    const [selectedRoomId, setSelectedRoomId] = useState('');
    const [isPrimary, setIsPrimary] = useState(true);
    const [isRemoving, setIsRemoving] = useState<string | null>(null);

    const queryClient = useQueryClient();
    const idColumn = sourceType === 'profile' ? 'profile_id' : 'personnel_profile_id';

    const { data: assignments, isLoading: isLoadingAssignments, refetch } = useOccupantAssignments(personId, sourceType);
    const { data: allRooms = [], isLoading: isLoadingRooms } = useRooms();
    const { handleAssignRoom, isAssigning } = useRoomAssignment(() => {
        refetch();
        queryClient.invalidateQueries({ queryKey: ['personnel-access'] });
        setSelectedRoomId('');
        setIsPickerOpen(false);
    });

    const assignedRoomIds = new Set(assignments?.rooms || []);
    const availableRooms = allRooms.filter(r => !assignedRoomIds.has(r.id));

    const selectedRoom = availableRooms.find(r => r.id === selectedRoomId);

    const handleAdd = async () => {
        if (!selectedRoomId) return;
        await handleAssignRoom(
            selectedRoomId,
            [{ id: personId, source_type: sourceType }],
            'primary_office',
            isPrimary
        );
    };

    const handleRemove = async (roomId: string) => {
        try {
            setIsRemoving(roomId);
            const { error } = await supabase
                .from('occupant_room_assignments')
                .delete()
                .eq(idColumn, personId)
                .eq('room_id', roomId);
            if (error) throw error;
            toast.success('Room removed');
            refetch();
            queryClient.invalidateQueries({ queryKey: ['personnel-access'] });
        } catch (err) {
            toast.error(getErrorMessage(err) || 'Failed to remove');
        } finally {
            setIsRemoving(null);
        }
    };

    const handleSetPrimary = async (roomId: string) => {
        try {
            await supabase
                .from('occupant_room_assignments')
                .update({ is_primary: false })
                .eq(idColumn, personId);
            const { error } = await supabase
                .from('occupant_room_assignments')
                .update({ is_primary: true })
                .eq(idColumn, personId)
                .eq('room_id', roomId);
            if (error) throw error;
            toast.success('Primary room updated');
            refetch();
        } catch (err) {
            toast.error('Failed to set primary');
        }
    };

    if (isLoadingAssignments) {
        return (
            <div className="space-y-2 pt-2">
                {[1, 2].map(i => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
        );
    }

    return (
        <div className="space-y-4 pt-2">
            {/* Current rooms */}
            {assignments?.roomDetails && assignments.roomDetails.length > 0 ? (
                <ScrollArea className="max-h-[260px] pr-2">
                    <div className="space-y-2">
                        {assignments.roomDetails.map((assignment: any) => {
                            const room = assignment.rooms;
                            if (!room) return null;
                            return (
                                <div
                                    key={assignment.room_id}
                                    className="flex items-center justify-between p-3 rounded-lg border bg-muted/20"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-md bg-primary/10">
                                            <DoorOpen className="h-4 w-4 text-primary" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-medium text-sm">
                                                    Room {room.room_number || room.name}
                                                </p>
                                                {assignment.is_primary && (
                                                    <Badge variant="secondary" className="gap-1 text-xs h-4">
                                                        <Star className="h-2.5 w-2.5 fill-current" />
                                                        Primary
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                {room.floors?.name} · {room.floors?.buildings?.name}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {!assignment.is_primary && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleSetPrimary(assignment.room_id)}
                                                className="h-8 px-2 text-xs"
                                            >
                                                Set Primary
                                            </Button>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleRemove(assignment.room_id)}
                                            disabled={isRemoving === assignment.room_id}
                                            className="h-8 w-8 text-destructive hover:text-destructive"
                                        >
                                            {isRemoving === assignment.room_id
                                                ? <Loader2 className="h-4 w-4 animate-spin" />
                                                : <Trash2 className="h-4 w-4" />
                                            }
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </ScrollArea>
            ) : (
                <div className="py-6 text-center text-muted-foreground">
                    <DoorOpen className="h-10 w-10 mx-auto mb-3 opacity-40" />
                    <p className="text-sm">No rooms assigned yet</p>
                </div>
            )}

            {/* Add room section */}
            <div className="border rounded-lg p-3 space-y-3 bg-muted/10">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Add Room
                </p>

                {/* Searchable room picker */}
                <Popover open={isPickerOpen} onOpenChange={setIsPickerOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            className="w-full justify-between font-normal"
                            disabled={isLoadingRooms}
                        >
                            {selectedRoom
                                ? `Room ${selectedRoom.room_number || selectedRoom.name}`
                                : isLoadingRooms ? 'Loading rooms...' : 'Search rooms...'}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[340px] p-0" align="start">
                        <Command>
                            <CommandInput placeholder="Search by room number or name..." />
                            <CommandList>
                                <CommandEmpty>No rooms found.</CommandEmpty>
                                <CommandGroup>
                                    {availableRooms.map(room => (
                                        <CommandItem
                                            key={room.id}
                                            value={`${room.room_number || ''} ${room.name || ''} ${room.floor?.name || ''} ${room.building?.name || ''}`}
                                            onSelect={() => {
                                                setSelectedRoomId(room.id);
                                                setIsPickerOpen(false);
                                            }}
                                        >
                                            <Check
                                                className={cn(
                                                    'mr-2 h-4 w-4',
                                                    selectedRoomId === room.id ? 'opacity-100' : 'opacity-0'
                                                )}
                                            />
                                            <div>
                                                <p className="text-sm font-medium">
                                                    Room {room.room_number || room.name}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {room.floor?.name} · {room.building?.name}
                                                </p>
                                            </div>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>

                {selectedRoomId && (
                    <div className="flex items-center justify-between">
                        <Label htmlFor="primary-switch" className="text-sm cursor-pointer">
                            Set as primary room
                        </Label>
                        <Switch
                            id="primary-switch"
                            checked={isPrimary}
                            onCheckedChange={setIsPrimary}
                        />
                    </div>
                )}

                <Button
                    onClick={handleAdd}
                    disabled={!selectedRoomId || isAssigning}
                    className="w-full"
                    size="sm"
                >
                    {isAssigning
                        ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Assigning...</>
                        : <><Plus className="h-4 w-4 mr-2" />Add Room</>
                    }
                </Button>
            </div>
        </div>
    );
}

// ── Main Sheet ────────────────────────────────────────────────────────────────

export function PersonDetailSheet({ open, onOpenChange, person }: PersonDetailSheetProps) {
    const [activeTab, setActiveTab] = useState('rooms');

    useEffect(() => {
        if (open) setActiveTab('rooms');
    }, [open, person?.id]);

    if (!person) return null;

    const sourceType: PersonSourceType =
        person.source_type === 'personnel_profile' ? 'personnel_profile' : 'profile';

    const initials = person.name
        ?.split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || '??';

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-md flex flex-col">
                <SheetHeader className="pb-4 border-b">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                            {person.avatar_url && <AvatarImage src={person.avatar_url} alt={person.name} />}
                            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                            <SheetTitle className="text-base leading-tight">{person.name}</SheetTitle>
                            <SheetDescription className="text-xs leading-snug mt-0.5">
                                {[person.title, person.department].filter(Boolean).join(' · ') ||
                                    (person.is_registered_user ? 'Registered User' : 'Court Personnel')}
                            </SheetDescription>
                            <div className="flex items-center gap-2 mt-1.5">
                                <Badge variant={person.is_registered_user ? 'default' : 'secondary'} className="text-xs h-5">
                                    {person.is_registered_user ? 'User' : 'Personnel'}
                                </Badge>
                                {person.room_count > 0 && (
                                    <span className="text-xs text-muted-foreground">
                                        {person.room_count} room{person.room_count !== 1 ? 's' : ''}
                                    </span>
                                )}
                                {person.key_count > 0 && (
                                    <span className="text-xs text-muted-foreground">
                                        {person.key_count} key{person.key_count !== 1 ? 's' : ''}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </SheetHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0 pt-2">
                    <TabsList className="w-full">
                        <TabsTrigger value="rooms" className="flex-1 gap-2">
                            <DoorOpen className="h-4 w-4" />
                            Rooms
                            {person.room_count > 0 && (
                                <Badge variant="secondary" className="h-4 text-xs">{person.room_count}</Badge>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="keys" className="flex-1 gap-2">
                            <Key className="h-4 w-4" />
                            Keys
                            {person.key_count > 0 && (
                                <Badge variant="secondary" className="h-4 text-xs">{person.key_count}</Badge>
                            )}
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="rooms" className="flex-1 overflow-auto mt-0">
                        <RoomsTab personId={person.id} sourceType={sourceType} />
                    </TabsContent>

                    <TabsContent value="keys" className="flex-1 overflow-auto mt-0">
                        <KeysTab personId={person.id} sourceType={sourceType} />
                    </TabsContent>
                </Tabs>
            </SheetContent>
        </Sheet>
    );
}
