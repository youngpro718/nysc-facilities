import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { logger } from '@/lib/logger';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Search, MoreHorizontal, UserMinus, ArrowUpRight, Users } from 'lucide-react';
import { useCourtPersonnel, PersonnelOption } from '@/hooks/useCourtPersonnel';
import { useAbsentStaffNames } from '@/hooks/useStaffAbsences';
import { departStaff, promoteStaff } from '@/services/court/staffManagement';
import { AddStaffDialog } from './AddStaffDialog';
import { toast } from 'sonner';

type RoleFilter = 'all' | 'judges' | 'clerks' | 'sergeants';

export function StaffRosterPanel() {
    const { personnel, isLoading, refetch } = useCourtPersonnel();
    const { absentStaffMap } = useAbsentStaffNames(new Date());
    const queryClient = useQueryClient();

    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [departTarget, setDepartTarget] = useState<PersonnelOption | null>(null);
    const [promoteTarget, setPromoteTarget] = useState<PersonnelOption | null>(null);

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
            let staffRole: 'clerk' | 'sergeant' | 'officer' = 'clerk';
            if (role.includes('sergeant') || role.includes('officer')) {
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
            toast.success(`${departTarget?.name} marked as departed`);
            setDepartTarget(null);
        },
        onError: (error: Error) => {
            logger.error('Error departing staff:', error);
            toast.error('Failed to process departure');
        },
    });

    // Promote mutation
    const promoteMutation = useMutation({
        mutationFn: async ({ person, newRole }: { person: PersonnelOption; newRole: 'clerk' | 'sergeant' | 'officer' }) => {
            const currentRole = person.role.toLowerCase();
            let oldRole: 'clerk' | 'sergeant' | 'officer' = 'clerk';
            if (currentRole.includes('sergeant') || currentRole.includes('officer')) {
                oldRole = 'sergeant';
            }

            await promoteStaff({
                personnelId: person.id,
                displayName: person.name,
                oldRole,
                newRole,
            });
        },
        onSuccess: (_data, vars) => {
            queryClient.invalidateQueries({ queryKey: ['court-personnel'] });
            queryClient.invalidateQueries({ queryKey: ['court-assignments'] });
            toast.success(`${vars.person.name} promoted to ${vars.newRole}`);
            setPromoteTarget(null);
        },
        onError: (error: Error) => {
            logger.error('Error promoting staff:', error);
            toast.error('Failed to promote staff');
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
                                        const isJudge = person.role.toLowerCase().includes('judge') || person.role.toLowerCase().includes('justice');

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
                                                    {!isJudge && (
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem
                                                                    onClick={() => setPromoteTarget(person)}
                                                                >
                                                                    <ArrowUpRight className="h-4 w-4 mr-2" />
                                                                    Change Role
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem
                                                                    onClick={() => setDepartTarget(person)}
                                                                    className="text-destructive"
                                                                >
                                                                    <UserMinus className="h-4 w-4 mr-2" />
                                                                    Mark as Departed
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    )}
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

            {/* Depart Confirmation */}
            <AlertDialog open={!!departTarget} onOpenChange={(open) => !open && setDepartTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Mark {departTarget?.name} as Departed?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will mark them as inactive and remove them from all court assignments.
                            This action can be undone by reactivating them later.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => departTarget && departMutation.mutate(departTarget)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {departMutation.isPending ? 'Processing...' : 'Mark as Departed'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Promote Dialog */}
            <AlertDialog open={!!promoteTarget} onOpenChange={(open) => !open && setPromoteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Change Role for {promoteTarget?.name}</AlertDialogTitle>
                        <AlertDialogDescription>
                            Current role: {promoteTarget?.role}. Select the new role:
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="flex gap-2 py-4">
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => promoteTarget && promoteMutation.mutate({ person: promoteTarget, newRole: 'clerk' })}
                            disabled={promoteMutation.isPending}
                        >
                            Court Clerk
                        </Button>
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => promoteTarget && promoteMutation.mutate({ person: promoteTarget, newRole: 'sergeant' })}
                            disabled={promoteMutation.isPending}
                        >
                            Sergeant
                        </Button>
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => promoteTarget && promoteMutation.mutate({ person: promoteTarget, newRole: 'officer' })}
                            disabled={promoteMutation.isPending}
                        >
                            Court Officer
                        </Button>
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
