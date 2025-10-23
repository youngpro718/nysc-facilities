import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CoverageAssignment, SessionPeriod, BuildingCode } from '@/types/courtSessions';
import { useCreateCoverageAssignment, useUpdateCoverageAssignment } from '@/hooks/useCoverageAssignments';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface CoverageAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date;
  period: SessionPeriod;
  buildingCode: BuildingCode;
  coverage: CoverageAssignment | null;
}

export function CoverageAssignmentDialog({
  open,
  onOpenChange,
  date,
  period,
  buildingCode,
  coverage,
}: CoverageAssignmentDialogProps) {
  const [formData, setFormData] = useState({
    court_room_id: '',
    absent_staff_name: '',
    absent_staff_role: 'judge',
    covering_staff_name: '',
    start_time: '',
    end_time: '',
    absence_reason: '',
    notes: '',
  });

  const createCoverage = useCreateCoverageAssignment();
  const updateCoverage = useUpdateCoverageAssignment();

  // Fetch available rooms
  const { data: rooms } = useQuery({
    queryKey: ['court-rooms', buildingCode],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('court_rooms')
        .select('id, room_number, courtroom_number')
        .eq('is_active', true)
        .order('room_number');
      
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  // Populate form when editing
  useEffect(() => {
    if (coverage) {
      setFormData({
        court_room_id: coverage.court_room_id,
        absent_staff_name: coverage.absent_staff_name,
        absent_staff_role: coverage.absent_staff_role,
        covering_staff_name: coverage.covering_staff_name,
        start_time: coverage.start_time || '',
        end_time: coverage.end_time || '',
        absence_reason: coverage.absence_reason || '',
        notes: coverage.notes || '',
      });
    } else {
      setFormData({
        court_room_id: '',
        absent_staff_name: '',
        absent_staff_role: 'judge',
        covering_staff_name: '',
        start_time: '',
        end_time: '',
        absence_reason: '',
        notes: '',
      });
    }
  }, [coverage, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      coverage_date: format(date, 'yyyy-MM-dd'),
      period,
      building_code: buildingCode,
      ...formData,
      start_time: formData.start_time || null,
      end_time: formData.end_time || null,
      absence_reason: formData.absence_reason || null,
      notes: formData.notes || null,
    };

    try {
      if (coverage) {
        await updateCoverage.mutateAsync({ id: coverage.id, ...payload });
      } else {
        await createCoverage.mutateAsync(payload);
      }
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving coverage:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {coverage ? 'Edit' : 'Add'} Coverage Assignment
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Courtroom *</Label>
                <Select
                  value={formData.court_room_id}
                  onValueChange={(value) => setFormData({ ...formData, court_room_id: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select room..." />
                  </SelectTrigger>
                  <SelectContent>
                    {rooms?.map((room) => (
                      <SelectItem key={room.id} value={room.id}>
                        Room {room.room_number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Role *</Label>
                <Select
                  value={formData.absent_staff_role}
                  onValueChange={(value) => setFormData({ ...formData, absent_staff_role: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="judge">Judge</SelectItem>
                    <SelectItem value="clerk">Clerk</SelectItem>
                    <SelectItem value="sergeant">Sergeant</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Absent Staff Name *</Label>
              <Input
                value={formData.absent_staff_name}
                onChange={(e) => setFormData({ ...formData, absent_staff_name: e.target.value })}
                placeholder="Enter absent staff name..."
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Covering Staff Name *</Label>
              <Input
                value={formData.covering_staff_name}
                onChange={(e) => setFormData({ ...formData, covering_staff_name: e.target.value })}
                placeholder="Enter covering staff name..."
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Time (Optional)</Label>
                <Input
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>End Time (Optional)</Label>
                <Input
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Absence Reason (Optional)</Label>
              <Input
                value={formData.absence_reason}
                onChange={(e) => setFormData({ ...formData, absence_reason: e.target.value })}
                placeholder="e.g., Vacation, Sick Leave..."
              />
            </div>

            <div className="space-y-2">
              <Label>Notes (Optional)</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createCoverage.isPending || updateCoverage.isPending}
            >
              {coverage ? 'Update' : 'Add'} Coverage
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
