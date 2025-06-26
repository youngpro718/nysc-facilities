
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Notification {
  id: string;
  type: string;
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
        // Get relocations data
        const { data: relocationsData } = await supabase
          .from('occupant_room_assignments')
          .select(`
            id,
            assigned_at,
            rooms!occupant_room_assignments_room_id_fkey (
              id,
              name,
              room_number,
              floors!rooms_floor_id_fkey (
                name,
                buildings!floors_building_id_fkey (
                  name
                )
              )
            )
          `)
          .eq('occupant_id', userId)
          .order('assigned_at', { ascending: false });

        const notifications: Notification[] = [];

        // Transform relocations to notifications
        relocationsData?.forEach((assignment) => {
          if (assignment.rooms?.id) {
            notifications.push({
              id: assignment.id,
              type: 'assignment',
              title: 'Room Assignment',
              message: `You have been assigned to ${assignment.rooms.name || assignment.rooms.room_number} in ${assignment.rooms.floors?.buildings?.name}`,
              read: false,
              created_at: assignment.assigned_at,
              urgency: 'medium',
              metadata: {
                room_id: assignment.rooms.id,
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
