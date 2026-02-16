// @ts-nocheck
import { useState } from 'react';
import { logger } from '@/lib/logger';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { DoorOpen, Star, MapPin, Loader2, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useOccupantAssignments } from '@/components/occupants/hooks/useOccupantAssignments';

export function MyRoomSection() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [hasRequestedRoom, setHasRequestedRoom] = useState(false);
  
  const { data: assignments, isLoading } = useOccupantAssignments(user?.id);

  const requestRoomMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('staff_tasks')
        .insert({
          title: 'Room Assignment Request',
          description: 'User is requesting to be assigned a room/office location.',
          task_type: 'general',
          priority: 'medium',
          status: 'pending_approval',
          is_request: true,
          requested_by: user.id,
          created_by: user.id,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Room assignment request submitted');
      setHasRequestedRoom(true);
      queryClient.invalidateQueries({ queryKey: ['staff_tasks'] });
    },
    onError: (error: unknown) => {
      logger.error('Error requesting room:', error);
      toast.error(error.message || 'Failed to submit request');
    }
  });

  const hasRooms = assignments?.roomDetails && assignments.roomDetails.length > 0;

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
          <div className="space-y-2">
            <Skeleton className="h-14 w-full" />
          </div>
        ) : hasRooms ? (
          <div className="space-y-2">
            {assignments.roomDetails.map((assignment: Record<string, unknown>) => {
              const room = assignment.rooms;
              if (!room) return null;
              
              return (
                <div 
                  key={assignment.room_id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <MapPin className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">
                          Room {room.room_number || room.name}
                        </p>
                        {assignment.is_primary && (
                          <Badge variant="secondary" className="gap-1 text-xs">
                            <Star className="h-3 w-3 fill-current" />
                            Primary
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {room.floors?.name} • {room.floors?.buildings?.name}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-4 space-y-3">
            <div className="p-3 rounded-full bg-muted w-fit mx-auto">
              <Building2 className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">No room assigned</p>
              <p className="text-sm text-muted-foreground">
                Request a room assignment from your administrator
              </p>
            </div>
            
            {hasRequestedRoom ? (
              <Badge variant="secondary" className="gap-1">
                Request pending
              </Badge>
            ) : (
              <Button 
                onClick={() => requestRoomMutation.mutate()}
                disabled={requestRoomMutation.isPending}
                className="w-full sm:w-auto"
              >
                {requestRoomMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <DoorOpen className="h-4 w-4 mr-2" />
                    Request Room Assignment
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
