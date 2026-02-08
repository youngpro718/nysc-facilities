import { useState, useEffect } from 'react';
import { getErrorMessage } from "@/lib/errorUtils";
import { logger } from '@/lib/logger';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DoorOpen, Star, Trash2, Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useOccupantAssignments } from '@/components/occupants/hooks/useOccupantAssignments';
import { useRoomAssignment, PersonSourceType } from '@/components/occupants/hooks/useRoomAssignment';
import { useRooms } from '@/features/facilities/hooks/useFacilities';
import { supabase } from '@/lib/supabase';
import { useQueryClient } from '@tanstack/react-query';
import type { PersonnelAccessRecord } from '@/hooks/usePersonnelAccess';

interface PersonnelQuickAssignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  person: PersonnelAccessRecord | null;
}

export function PersonnelQuickAssignDialog({ 
  open, 
  onOpenChange, 
  person 
}: PersonnelQuickAssignDialogProps) {
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [isPrimary, setIsPrimary] = useState(true);
  const [isRemoving, setIsRemoving] = useState<string | null>(null);
  
  const queryClient = useQueryClient();
  
  // Determine the source type for this person
  const sourceType: PersonSourceType = person?.source_type === 'personnel_profile' 
    ? 'personnel_profile' 
    : 'profile';
  
  // Get the correct ID column name for queries
  const idColumn = sourceType === 'profile' ? 'profile_id' : 'personnel_profile_id';
  
  const { data: assignments, isLoading: isLoadingAssignments, refetch: refetchAssignments } = useOccupantAssignments(
    person?.id,
    sourceType
  );
  const { data: allRooms, isLoading: isLoadingRooms } = useRooms();
  const { handleAssignRoom, isAssigning } = useRoomAssignment(() => {
    refetchAssignments();
    queryClient.invalidateQueries({ queryKey: ['personnel-access'] });
    setSelectedRoomId('');
  });

  // Reset selection when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedRoomId('');
      setIsPrimary(true);
    }
  }, [open]);

  const initials = person?.name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '??';

  // Filter out already-assigned rooms
  const assignedRoomIds = new Set(assignments?.rooms || []);
  const availableRooms = allRooms?.filter(room => !assignedRoomIds.has(room.id)) || [];

  const handleAddRoom = async () => {
    if (!selectedRoomId || !person) return;
    
    // Pass the person with their correct source_type
    await handleAssignRoom(
      selectedRoomId,
      [{ id: person.id, source_type: sourceType }],
      'primary_office',
      isPrimary
    );
  };

  const handleRemoveAssignment = async (roomId: string) => {
    if (!person) return;
    
    try {
      setIsRemoving(roomId);
      
      // Use the correct ID column based on source_type
      const { error } = await supabase
        .from('occupant_room_assignments')
        .delete()
        .eq(idColumn, person.id)
        .eq('room_id', roomId);
      
      if (error) throw error;
      
      toast.success('Room assignment removed');
      refetchAssignments();
      queryClient.invalidateQueries({ queryKey: ['personnel-access'] });
    } catch (error) {
      logger.error('Error removing assignment:', error);
      toast.error(getErrorMessage(error) || 'Failed to remove assignment');
    } finally {
      setIsRemoving(null);
    }
  };

  const handleSetPrimary = async (roomId: string) => {
    if (!person) return;
    
    try {
      // First, unset all current primary assignments for this person
      await supabase
        .from('occupant_room_assignments')
        .update({ is_primary: false })
        .eq(idColumn, person.id);
      
      // Then set the new primary
      const { error } = await supabase
        .from('occupant_room_assignments')
        .update({ is_primary: true })
        .eq(idColumn, person.id)
        .eq('room_id', roomId);
      
      if (error) throw error;
      
      toast.success('Primary room updated');
      refetchAssignments();
    } catch (error) {
      logger.error('Error setting primary:', error);
      toast.error('Failed to update primary room');
    }
  };

  if (!person) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              {person.avatar_url && <AvatarImage src={person.avatar_url} alt={person.name} />}
              <AvatarFallback className="bg-primary/10 text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <span>{person.name}</span>
              <p className="text-sm font-normal text-muted-foreground">
                {person.title || person.department || (person.is_registered_user ? 'User' : 'Personnel')}
              </p>
            </div>
          </DialogTitle>
          <DialogDescription>
            Manage room assignments for this person.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Assignments */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <DoorOpen className="h-4 w-4" />
              Current Rooms
            </Label>
            
            {isLoadingAssignments ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : assignments?.roomDetails && assignments.roomDetails.length > 0 ? (
              <ScrollArea className="max-h-[200px]">
                <div className="space-y-2">
                  {assignments.roomDetails.map((assignment: Record<string, unknown>) => {
                    const room = assignment.rooms;
                    if (!room) return null;
                    
                    return (
                      <div 
                        key={assignment.room_id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                      >
                        <div className="flex items-center gap-2">
                          <div>
                            <p className="font-medium text-sm">
                              Room {room.room_number || room.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {room.floors?.name} • {room.floors?.buildings?.name}
                            </p>
                          </div>
                          {assignment.is_primary && (
                            <Badge variant="secondary" className="gap-1 text-xs">
                              <Star className="h-3 w-3 fill-current" />
                              Primary
                            </Badge>
                          )}
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
                            onClick={() => handleRemoveAssignment(assignment.room_id)}
                            disabled={isRemoving === assignment.room_id}
                            className="h-8 w-8 text-destructive hover:text-destructive"
                          >
                            {isRemoving === assignment.room_id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No rooms assigned yet
              </p>
            )}
          </div>

          {/* Add Room */}
          <div className="space-y-3 pt-2 border-t">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Room
            </Label>
            
            <Select value={selectedRoomId} onValueChange={setSelectedRoomId}>
              <SelectTrigger>
                <SelectValue placeholder={isLoadingRooms ? "Loading rooms..." : "Select a room"} />
              </SelectTrigger>
              <SelectContent>
                {availableRooms.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground text-center">
                    {isLoadingRooms ? 'Loading...' : 'No available rooms'}
                  </div>
                ) : (
                  availableRooms.map(room => (
                    <SelectItem key={room.id} value={room.id}>
                      Room {room.room_number || room.name} - {room.floor?.name} • {room.building?.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>

            {selectedRoomId && (
              <div className="flex items-center justify-between">
                <Label htmlFor="primary-toggle" className="text-sm">
                  Set as primary room
                </Label>
                <Switch
                  id="primary-toggle"
                  checked={isPrimary}
                  onCheckedChange={setIsPrimary}
                />
              </div>
            )}

            <Button 
              onClick={handleAddRoom}
              disabled={!selectedRoomId || isAssigning}
              className="w-full"
            >
              {isAssigning ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Assigning...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Room
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
