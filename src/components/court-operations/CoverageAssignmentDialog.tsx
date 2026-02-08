import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { CoverageAssignment, SessionPeriod, BuildingCode } from '@/types/courtSessions';
import { useCreateCoverageAssignment, useUpdateCoverageAssignment } from '@/hooks/useCoverageAssignments';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

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
  const [selectedAssignment, setSelectedAssignment] = useState<Record<string, unknown> | null>(null);
  const [coveringStaffSearch, setCoveringStaffSearch] = useState('');
  const [showCoveringStaffDropdown, setShowCoveringStaffDropdown] = useState(false);

  const createCoverage = useCreateCoverageAssignment();
  const updateCoverage = useUpdateCoverageAssignment();

  // Fetch available rooms with assignments
  const { data: roomsWithAssignments } = useQuery({
    queryKey: ['court-rooms-with-assignments', buildingCode],
    queryFn: async () => {
      // Get building ID for selected building code
      const buildingName = buildingCode === '100' ? '100 Centre Street Supreme Court' : '111 Centre Street Supreme Court';
      
      const { data: building, error: buildingError } = await supabase
        .from('buildings')
        .select('id')
        .eq('name', buildingName)
        .single();
      
      if (buildingError) throw buildingError;

      // Get court rooms for this building
      const { data: rooms, error: roomsError } = await supabase
        .from('court_rooms')
        .select(`
          id, 
          room_number, 
          courtroom_number, 
          room_id,
          rooms!inner(
            floor_id,
            floors!inner(
              building_id
            )
          )
        `)
        .eq('is_active', true)
        .eq('rooms.floors.building_id', building.id)
        .order('room_number');
      
      if (roomsError) throw roomsError;

      // Get court assignments
      const { data: assignments, error: assignmentsError } = await supabase
        .from('court_assignments')
        .select('room_id, justice, part, clerks, sergeant')
        .not('justice', 'is', null);
      
      if (assignmentsError) throw assignmentsError;

      // Combine data
      return rooms.map(room => {
        const assignment = assignments?.find(a => a.room_id === room.room_id);
        return {
          ...room,
          assignment,
          hasAssignment: !!assignment,
        };
      });
    },
    enabled: open,
  });

  // Fetch personnel for covering staff autocomplete
  const { data: personnelList } = useQuery({
    queryKey: ['personnel-profiles-autocomplete'],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('list_personnel_profiles_minimal');
      
      if (error) {
        logger.error('Error fetching personnel:', error);
        throw error;
      }
      
      // Map to consistent format
      const mapped = (data || []).map((person: Record<string, unknown>) => ({
        id: person.id,
        name: person.display_name || person.full_name || '',
        role: person.title || person.primary_role || 'Staff',
      }));
      
      logger.debug(`Personnel loaded for autocomplete: ${mapped.length} people`);
      return mapped;
    },
    enabled: open,
  });

  // Filter personnel based on search
  const filteredPersonnel = personnelList?.filter(person => {
    if (!coveringStaffSearch) return false;
    const name = person.name.toLowerCase();
    const searchLower = coveringStaffSearch.toLowerCase();
    const matches = name.includes(searchLower);
    return matches;
  }) || [];

  // Debug logging
  useEffect(() => {
    if (coveringStaffSearch) {
      logger.debug('Search term:', coveringStaffSearch);
      logger.debug('Total personnel:', personnelList?.length || 0);
      logger.debug('Filtered results:', filteredPersonnel.length);
      logger.debug('Show dropdown:', showCoveringStaffDropdown);
    }
  }, [coveringStaffSearch, filteredPersonnel.length, personnelList?.length, showCoveringStaffDropdown]);

  // Auto-populate assignment when room is selected
  useEffect(() => {
    if (formData.court_room_id && roomsWithAssignments && !coverage) {
      const room = roomsWithAssignments.find(r => r.id === formData.court_room_id);
      if (room?.assignment) {
        setSelectedAssignment(room.assignment);
      } else {
        setSelectedAssignment(null);
      }
    }
  }, [formData.court_room_id, roomsWithAssignments, coverage]);

  // Auto-populate absent staff name based on role and assignment
  useEffect(() => {
    if (selectedAssignment && !coverage) {
      let absentStaffName = '';
      
      switch (formData.absent_staff_role) {
        case 'judge':
          absentStaffName = selectedAssignment.justice || '';
          break;
        case 'clerk':
          absentStaffName = selectedAssignment.clerks?.[0] || '';
          break;
        case 'sergeant':
          absentStaffName = selectedAssignment.sergeant || '';
          break;
      }
      
      if (absentStaffName) {
        setFormData(prev => ({ ...prev, absent_staff_name: absentStaffName }));
      }
    }
  }, [selectedAssignment, formData.absent_staff_role, coverage]);

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
      setSelectedAssignment(null);
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
      setSelectedAssignment(null);
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
      logger.error('Error saving coverage:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
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
                    {roomsWithAssignments?.map((room) => (
                      <SelectItem key={room.id} value={room.id}>
                        Room {room.room_number}
                        {room.assignment && ` - Part ${room.assignment.part}`}
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

            {/* Auto-populated Absent Staff Name */}
            {selectedAssignment && formData.court_room_id && !coverage ? (
              <div className="rounded-lg border-2 border-primary/20 p-4 bg-primary/5 space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <Label className="text-primary font-medium">Auto-Populated Absent Staff</Label>
                  <Badge variant="secondary" className="ml-auto text-xs">From Room Assignment</Badge>
                </div>
                <div className="p-2 bg-background rounded border">
                  <div className="text-xs text-muted-foreground mb-1">
                    {formData.absent_staff_role === 'judge' ? 'Judge' : formData.absent_staff_role === 'clerk' ? 'Clerk' : 'Sergeant'}
                  </div>
                  <div className="font-medium">{formData.absent_staff_name}</div>
                </div>
                <Alert className="border-primary/30 bg-primary/5">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <AlertDescription className="text-xs">
                    <strong>Automatic:</strong> Staff name populated from room assignment. Change the role to see other personnel.
                  </AlertDescription>
                </Alert>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Absent Staff Name *</Label>
                <Input
                  value={formData.absent_staff_name}
                  onChange={(e) => setFormData({ ...formData, absent_staff_name: e.target.value })}
                  placeholder="Enter absent staff name..."
                  required
                />
                {!selectedAssignment && formData.court_room_id && (
                  <Alert className="border-amber-500/30 bg-amber-500/5">
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                    <AlertDescription className="text-xs">
                      This courtroom has no assignment. Please enter the staff name manually.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label>Covering Staff Name *</Label>
              <div className="relative">
                <Input
                  value={formData.covering_staff_name}
                  onChange={(e) => {
                    setFormData({ ...formData, covering_staff_name: e.target.value });
                    setCoveringStaffSearch(e.target.value);
                    setShowCoveringStaffDropdown(true);
                  }}
                  onFocus={() => {
                    setCoveringStaffSearch(formData.covering_staff_name);
                    setShowCoveringStaffDropdown(true);
                  }}
                  onBlur={() => {
                    // Delay to allow click on dropdown
                    setTimeout(() => setShowCoveringStaffDropdown(false), 200);
                  }}
                  placeholder="Start typing a name..."
                  required
                />
                
                {/* Autocomplete Dropdown */}
                {showCoveringStaffDropdown && coveringStaffSearch && filteredPersonnel.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-[200px] overflow-y-auto">
                    {filteredPersonnel.map((person) => (
                      <button
                        key={person.id}
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, covering_staff_name: person.name });
                          setCoveringStaffSearch('');
                          setShowCoveringStaffDropdown(false);
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-muted transition-colors flex items-center justify-between"
                      >
                        <div>
                          <div className="font-medium">{person.name}</div>
                          <div className="text-xs text-muted-foreground">{person.role}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">Start typing to see available staff, or enter any name</p>
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
