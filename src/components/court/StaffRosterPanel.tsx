import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { logger } from '@/lib/logger';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Search, MoreHorizontal, UserMinus, Users, Loader2 } from 'lucide-react';
import { useCourtPersonnel, PersonnelOption } from '@/hooks/useCourtPersonnel';
import { useAbsentStaffNames } from '@/hooks/useStaffAbsences';
import { departStaff } from '@/services/court/staffManagement';
import { AddStaffDialog } from './AddStaffDialog';
import { toast } from 'sonner';

type RoleFilter = 'all' | 'judges' | 'clerks' | 'sergeants';
type DepartureReason = 'promoted' | 'transferred' | 'retired' | 'other';

const DEPARTURE_REASONS: { value: DepartureReason; label: string; description: string }[] = [
    { value: 'promoted', label: 'Promoted', description: 'Promoted out of this command' },
    { value: 'transferred', label: 'Transferred', description: 'Transferred to another command' },
    { value: 'retired', label: 'Retired', description: 'Retired from service' },
    { value: 'other', label: 'Other', description: 'Left for another reason' },
];

export function StaffRosterPanel() {
    const { personnel, isLoading } = useCourtPersonnel();
    const { absentStaffMap } = useAbsentStaffNames(new Date());
    const queryClient = useQueryClient();

    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
    const [showAddDialog, setShowAddDialog] = useState(false);

    // Departure state
    const [departTarget, setDepartTarget] = useState<PersonnelOption | null>(null);
    const [departureReason, setDepartureReason] = useState<DepartureReason>('promoted');
    const [departureNotes, setDepartureNotes] = useState('');

    // Get filtered list
    const getFilteredStaff = (): PersonnelOption[] => {
        let list: PersonnelOption[] = [];

        switch (roleFilter) {
            case 'judges':
                list = personnel.judges;
                break;
            case 'clerks':
                list = personnel.clerks;
                break;
            case 'sergeants':
                list = personnel.sergeants;
                break;
            default:
                list = personnel.allPersonnel;
        }

        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(
                (p) =>
                    p.name.toLowerCase().includes(q) ||
                    p.role.toLowerCase().includes(q) ||
                    p.department?.toLowerCase().includes(q)
            );
        }

        return list;
    };

    const filteredStaff = getFilteredStaff();

    // Depart mutation
    const departMutation = useMutation({
        mutationFn: async (person: PersonnelOption) => {
            const role = person.role.toLowerCase();
            let staffRole: 'clerk' | 'sergeant' | 'officer' | 'judge' = 'clerk';
            if (role.includes('judge') || role.includes('justice')) {
                staffRole = 'judge';
            } else if (role.includes('sergeant') || role.includes('officer')) {
                staffRole = 'sergeant';
            }

            await departStaff({
                personnelId: person.id,
                displayName: person.name,
                role: staffRole,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['court-personnel'] });
            queryClient.invalidateQueries({ queryKey: ['court-assignments'] });
            queryClient.invalidateQueries({ queryKey: ['court-operations'] });
            const reasonLabel = DEPARTURE_REASONS.find(r => r.value === departureReason)?.label || departureReason;
            toast.success(`${departTarget?.name} removed — ${reasonLabel}`);
            setDepartTarget(null);
            setDepartureReason('promoted');
            setDepartureNotes('');
        },
        onError: (error: Error) => {
            logger.error('Error processing departure:', error);
            toast.error('Failed to process departure');
        },
    });

    const isAbsent = (name: string) => absentStaffMap.has(name.toLowerCase());

    const getRoleBadge = (role: string, judgeStatus?: string) => {
        const r = role.toLowerCase();
        if (r.includes('judge') || r.includes('justice')) {
            if (judgeStatus === 'jho') return <Badge variant="outline" className="text-[10px]">JHO</Badge>;
            return <Badge className="text-[10px] bg-blue-600">Judge</Badge>;
        }
        if (r.includes('clerk')) return <Badge variant="secondary" className="text-[10px]">Clerk</Badge>;
        if (r.includes('sergeant') || r.includes('officer')) return <Badge variant="secondary" className="text-[10px] bg-amber-600 text-white">Sgt</Badge>;
        return <Badge variant="outline" className="text-[10px]">{role}</Badge>;
    };

    return (
        <>
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Users className="h-5 w-5" />
                            Staff Roster
                            <Badge variant="secondary" className="ml-1 text-xs">
                                {personnel.allPersonnel.length}
                            </Badge>
                        </CardTitle>
                        <Button size="sm" onClick={() => setShowAddDialog(true)}>
                            <Plus className="h-4 w-4 mr-1" />
                            Add Staff
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-3">
                    {/* Search & Filter */}
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name or role..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-8 h-9"
                            />
                        </div>
                        <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as RoleFilter)}>
                            <SelectTrigger className="w-32 h-9">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All ({personnel.allPersonnel.length})</SelectItem>
                                <SelectItem value="judges">Judges ({personnel.judges.length})</SelectItem>
                                <SelectItem value="clerks">Clerks ({personnel.clerks.length})</SelectItem>
                                <SelectItem value="sergeants">Sergeants ({personnel.sergeants.length})</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Staff Table */}
                    <div className="rounded-md border overflow-x-auto">
                        <Table className="text-sm">
                            <TableHeader>
                                <TableRow className="bg-muted/40">
                                    <TableHead className="py-2 px-3 font-bold">Name</TableHead>
                                    <TableHead className="py-2 px-3 font-bold">Role</TableHead>
                                    <TableHead className="py-2 px-3 font-bold hidden sm:table-cell">Status</TableHead>
                                    <TableHead className="py-2 px-3 font-bold hidden md:table-cell">Details</TableHead>
                                    <TableHead className="py-2 px-1 w-10"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                            Loading staff...
                                        </TableCell>
                                    </TableRow>
                                ) : filteredStaff.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                            No staff found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredStaff.map((person) => {
                                        const absent = isAbsent(person.name);

                                        return (
                                            <TableRow key={person.id} className="hover:bg-muted/20">
                                                <TableCell className="py-2 px-3 font-medium">
                                                    {person.name}
                                                </TableCell>
                                                <TableCell className="py-2 px-3">
                                                    {getRoleBadge(person.role, person.judgeStatus)}
                                                </TableCell>
                                                <TableCell className="py-2 px-3 hidden sm:table-cell">
                                                    {absent ? (
                                                        <Badge variant="destructive" className="text-[10px]">Out Today</Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="text-[10px] text-green-600 border-green-300">Active</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="py-2 px-3 hidden md:table-cell">
                                                    <div className="text-xs text-muted-foreground space-y-0.5">
                                                        {person.chambersRoom && <div>Chambers: {person.chambersRoom}</div>}
                                                        {person.courtAttorney && <div>Atty: {person.courtAttorney}</div>}
                                                        {person.department && <div>{person.department}</div>}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-2 px-1">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem
                                                                onClick={() => setDepartTarget(person)}
                                                                className="text-destructive"
                                                            >
                                                                <UserMinus className="h-4 w-4 mr-2" />
                                                                Remove from Command
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Add Staff Dialog */}
            <AddStaffDialog
                open={showAddDialog}
                onOpenChange={setShowAddDialog}
            />

            {/* Departure Dialog — asks for reason */}
            <Dialog open={!!departTarget} onOpenChange={(open) => {
                if (!open) {
                    setDepartTarget(null);
                    setDepartureReason('promoted');
                    setDepartureNotes('');
                }
            }}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Remove {departTarget?.name}</DialogTitle>
                        <DialogDescription>
                            This will remove them from all court assignments. Select the reason they're leaving.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        {/* Reason Selection */}
                        <div className="space-y-2">
                            <Label>Reason</Label>
                            <div className="grid grid-cols-2 gap-2">
                                {DEPARTURE_REASONS.map((reason) => (
                                    <Button
                                        key={reason.value}
                                        variant={departureReason === reason.value ? 'default' : 'outline'}
                                        size="sm"
                                        className="justify-start text-xs h-auto py-2 px-3"
                                        onClick={() => setDepartureReason(reason.value)}
                                    >
                                        <div className="text-left">
                                            <div className="font-medium">{reason.label}</div>
                                            <div className={`text-[10px] ${departureReason === reason.value ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                                                {reason.description}
                                            </div>
                                        </div>
                                    </Button>
                                ))}
                            </div>
                        </div>

                        {/* Optional Notes */}
                        <div className="space-y-1.5">
                            <Label htmlFor="departure-notes">Notes (optional)</Label>
                            <Input
                                id="departure-notes"
                                value={departureNotes}
                                onChange={(e) => setDepartureNotes(e.target.value)}
                                placeholder="e.g., Promoted to Bronx Supreme Court"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDepartTarget(null)}
                            disabled={departMutation.isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => departTarget && departMutation.mutate(departTarget)}
                            disabled={departMutation.isPending}
                        >
                            {departMutation.isPending ? (
                                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Processing...</>
                            ) : (
                                'Remove from Command'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
