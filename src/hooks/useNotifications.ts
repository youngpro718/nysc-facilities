
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Notification {
  id: string;
  type: 'issue_update' | 'new_assignment' | 'maintenance';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  urgency?: 'low' | 'medium' | 'high';
  action_url?: string;
  metadata?: any;
}

export const useNotifications = (userId?: string) => {
  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ['notifications', userId],
    queryFn: async () => {
      if (!userId) return [];

      try {
        // Get room assignments
        const { data: assignments, error: assignmentsError } = await supabase
          .from('occupant_room_assignments')
          .select(`
            id,
            assigned_at,
            room_id
          `)
          .eq('occupant_id', userId)
          .order('assigned_at', { ascending: false });

        if (assignmentsError) {
          console.error('Error fetching assignments:', assignmentsError);
          return [];
        }

        if (!assignments || assignments.length === 0) {
          return [];
        }

        // Get room details
        const roomIds = assignments.map(a => a.room_id);
        const { data: rooms, error: roomsError } = await supabase
          .from('rooms')
          .select(`
            id,
            name,
            room_number,
            floors!rooms_floor_id_fkey (
              name,
              buildings!floors_building_id_fkey (
                name
              )
            )
          `)
          .in('id', roomIds);

        if (roomsError) {
          console.error('Error fetching room details:', roomsError);
          return [];
        }

        const notifications: Notification[] = [];

        // Transform assignments to notifications
        assignments.forEach((assignment) => {
          const room = rooms?.find(r => r.id === assignment.room_id);
          
          if (room) {
            notifications.push({
              id: assignment.id,
              type: 'new_assignment',
              title: 'Room Assignment',
              message: `You have been assigned to ${room.name || room.room_number} in ${room.floors?.buildings?.name}`,
              read: false,
              created_at: assignment.assigned_at,
              urgency: 'medium',
              metadata: {
                room_id: room.id,
                assignment_type: 'room'
              }
            });
          }
        });

        console.log('Generated notifications:', notifications);
        return notifications;
      } catch (error) {
        console.error('Error fetching notifications:', error);
        return [];
      }
    },
    enabled: !!userId,
    staleTime: 300000, // 5 minutes
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = async (notificationId: string) => {
    // This would typically update the notification in the database
    console.log('Marking notification as read:', notificationId);
  };

  const markAllAsRead = async () => {
    // This would typically update all notifications in the database
    console.log('Marking all notifications as read');
  };

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead
  };
};
