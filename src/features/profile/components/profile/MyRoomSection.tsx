import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { DoorOpen, Star, MapPin, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@features/auth/hooks/useAuth';
import { useUserRoomAssignments } from '@features/spaces/hooks/useUserRoomAssignments';
import { RoomSelector } from '@features/keys/components/keys/lockbox/RoomSelector';
import { getErrorMessage } from '@/lib/errorUtils';
import { logger } from '@/lib/logger';

/**
 * My Room — self-serve room assignment.
 * A user picks their own room; it is stored immediately (as their own
 * profile-keyed occupant_room_assignment) and auto-loads into the Report
 * Issue / Supply Order / Set Up a Room forms. Admins can still view/override
 * anyone's room from Admin → Users, but it is never required here.
 */
export function MyRoomSection() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: rawAssignments = [], isLoading } = useUserRoomAssignments(user?.id);

  // A user can have both a legacy occupant-keyed row and a profile-keyed row for
  // the same room; show each room once.
  const assignments = rawAssignments.filter(
    (a, i, arr) => arr.findIndex(x => x.room_id === a.room_id) === i,
  );

  const primary = assignments.find(a => a.is_primary) ?? assignments[0];
  const currentRoomId = primary?.room_id ?? undefined;

  const setRoom = useMutation({
    mutationFn: async (roomId: string | null) => {
      if (!user) throw new Error('Not authenticated');
      // Replace the user's own work-location row(s). Self-serve writes only
      // ever touch rows where profile_id = the caller (enforced by RLS).
      await supabase
        .from('occupant_room_assignments')
        .delete()
        .eq('profile_id', user.id)
        .eq('assignment_type', 'work_location');

      if (roomId) {
        const { error } = await supabase
          .from('occupant_room_assignments')
          .insert({
            profile_id: user.id,
            room_id: roomId,
            assignment_type: 'work_location',
            is_primary: true,
          });
        if (error) throw error;
      }
    },
    onSuccess: (_data, roomId) => {
      toast.success(roomId ? 'Room updated' : 'Room cleared');
      queryClient.invalidateQueries({ queryKey: ['userRoomAssignments', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['occupantAssignments', user?.id] });
    },
    onError: (error: unknown) => {
      logger.error('Error setting room:', error);
      toast.error(getErrorMessage(error) || 'Failed to update room');
    },
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <DoorOpen className="h-5 w-5" />
          My Room
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <Skeleton className="h-14 w-full" />
        ) : assignments.length > 0 ? (
          <div className="space-y-2">
            {assignments.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <MapPin className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">
                        Room {a.rooms?.room_number || a.rooms?.name || '—'}
                      </p>
                      {a.is_primary && (
                        <Badge variant="secondary" className="gap-1 text-xs">
                          <Star className="h-3 w-3 fill-current" />
                          Primary
                        </Badge>
                      )}
                    </div>
                    {a.rooms?.name && a.rooms?.room_number && (
                      <p className="text-xs text-muted-foreground">{a.rooms.name}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 space-y-2">
            <div className="p-3 rounded-full bg-muted w-fit mx-auto">
              <Building2 className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="font-medium">No room set</p>
            <p className="text-sm text-muted-foreground">
              Pick your room below — it will be filled in automatically when you report
              an issue or order supplies.
            </p>
          </div>
        )}

        {/* Self-serve picker */}
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">
            {assignments.length > 0 ? 'Change my room' : 'Set my room'}
          </p>
          <RoomSelector
            value={currentRoomId}
            onChange={(roomId) => setRoom.mutate(roomId)}
            disabled={setRoom.isPending}
          />
        </div>
      </CardContent>
    </Card>
  );
}
