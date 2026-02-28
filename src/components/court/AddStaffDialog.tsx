import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { logger } from '@/lib/logger';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { addNewStaff } from '@/services/court/staffManagement';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';

interface AddStaffDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AddStaffDialog({ open, onOpenChange }: AddStaffDialogProps) {
    const queryClient = useQueryClient();
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [role, setRole] = useState<'clerk' | 'sergeant' | 'officer'>('clerk');
    const [phone, setPhone] = useState('');
    const [extension, setExtension] = useState('');
    const [assignToRoom, setAssignToRoom] = useState<string>('');

    // Fetch available courtroom assignments for the dropdown
    const { data: assignments } = useQuery({
        queryKey: ['court-assignments-for-staff'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('court_assignments')
                .select('room_id, room_number, part, justice')
                .order('sort_order', { ascending: true });
            if (error) throw error;
            return data || [];
        },
        enabled: open,
    });

    const resetForm = () => {
        setFirstName('');
        setLastName('');
        setRole('clerk');
        setPhone('');
        setExtension('');
        setAssignToRoom('');
    };

    const addMutation = useMutation({
        mutationFn: async () => {
            return addNewStaff({
                firstName,
                lastName,
                role,
                phone: phone || undefined,
                extension: extension || undefined,
                assignToRoomId: assignToRoom || undefined,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['court-personnel'] });
            queryClient.invalidateQueries({ queryKey: ['court-assignments'] });
            queryClient.invalidateQueries({ queryKey: ['court-operations'] });
            toast.success(`${firstName} ${lastName} added as ${role}`);
            resetForm();
            onOpenChange(false);
        },
        onError: (error: Error) => {
            logger.error('Error adding staff:', error);
            toast.error('Failed to add staff member', {
                description: error.message,
            });
        },
    });

    const canSubmit = firstName.trim() && lastName.trim();

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Add Staff Member</DialogTitle>
                    <DialogDescription>
                        Add a new clerk, sergeant, or officer to the system.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    {/* Name */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="first-name">First Name *</Label>
                            <Input
                                id="first-name"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                placeholder="John"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="last-name">Last Name *</Label>
                            <Input
                                id="last-name"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                placeholder="Smith"
                            />
                        </div>
                    </div>

                    {/* Role */}
                    <div className="space-y-1.5">
                        <Label>Role *</Label>
                        <Select value={role} onValueChange={(v) => setRole(v as typeof role)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="clerk">Court Clerk</SelectItem>
                                <SelectItem value="sergeant">Sergeant</SelectItem>
                                <SelectItem value="officer">Court Officer</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Contact Info */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="phone">Phone</Label>
                            <Input
                                id="phone"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="(212) 555-0100"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="extension">Extension</Label>
                            <Input
                                id="extension"
                                value={extension}
                                onChange={(e) => setExtension(e.target.value)}
                                placeholder="1234"
                            />
                        </div>
                    </div>

                    {/* Assign to Courtroom */}
                    <div className="space-y-1.5">
                        <Label>Assign to Courtroom (optional)</Label>
                        <Select value={assignToRoom} onValueChange={setAssignToRoom}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a courtroom..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">None — assign later</SelectItem>
                                {assignments?.map((a) => (
                                    <SelectItem key={a.room_id} value={a.room_id}>
                                        Room {a.room_number} — {a.part || 'No part'}{a.justice ? ` (${a.justice})` : ''}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={addMutation.isPending}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={() => addMutation.mutate()}
                        disabled={!canSubmit || addMutation.isPending}
                    >
                        {addMutation.isPending ? (
                            <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Adding...</>
                        ) : (
                            `Add ${role === 'clerk' ? 'Clerk' : role === 'sergeant' ? 'Sergeant' : 'Officer'}`
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
