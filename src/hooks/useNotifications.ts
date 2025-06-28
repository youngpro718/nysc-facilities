
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
        // Get room assignments for the user
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
            floor_id
          `)
          .in('id', roomIds);

        if (roomsError) {
          console.error('Error fetching room details:', roomsError);
          return [];
        }

        // Get floor and building info
        const floorIds = rooms?.map(r => r.floor_id).filter(Boolean) || [];
        if (floorIds.length === 0) {
          return [];
        }

        const { data: floors, error: floorsError } = await supabase
          .from('floors')
          .select(`
            id,
            name,
            building_id
          `)
          .in('id', floorIds);

        if (floorsError) {
          console.error('Error fetching floors:', floorsError);
          return [];
        }

        const buildingIds = floors?.map(f => f.building_id).filter(Boolean) || [];
        if (buildingIds.length === 0) {
          return [];
        }

        const { data: buildings, error: buildingsError } = await supabase
          .from('buildings')
          .select(`
            id,
            name
          `)
          .in('id', buildingIds);

        if (buildingsError) {
          console.error('Error fetching buildings:', buildingsError);
          return [];
        }

        const notifications: Notification[] = [];

        // Transform assignments to notifications
        assignments.forEach((assignment) => {
          const room = rooms?.find(r => r.id === assignment.room_id);
          if (!room) return;
          
          const floor = floors?.find(f => f.id === room.floor_id);
          const building = buildings?.find(b => b.id === floor?.building_id);
          
          notifications.push({
            id: assignment.id,
            type: 'new_assignment',
            title: 'Room Assignment',
            message: `You have been assigned to ${room.name || room.room_number} in ${building?.name || 'Unknown Building'}`,
            read: false,
            created_at: assignment.assigned_at,
            urgency: 'medium',
            metadata: {
              room_id: room.id,
              assignment_type: 'room'
            }
          });
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
    console.log('Marking notification as read:', notificationId);
  };

  const markAllAsRead = async () => {
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
