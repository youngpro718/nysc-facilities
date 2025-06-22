
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Notification } from '@/components/dashboard/NotificationCard';

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    let mounted = true;

    const fetchNotifications = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        
        // Fetch notifications from various sources
        const [issueUpdates, roomAssignments, maintenanceNotices] = await Promise.all([
          // Get issue updates
          supabase
            .from('issue_history')
            .select(`
              id,
              action_type,
              performed_at,
              notes,
              issues!inner (
                id,
                title,
                created_by
              )
            `)
            .eq('issues.created_by', user.id)
            .order('performed_at', { ascending: false })
            .limit(10),

          // Get room assignments with explicit foreign key
          supabase
            .from('occupant_room_assignments')
            .select(`
              id,
              assigned_at,
              rooms:room_id!occupant_room_assignments_room_id_fkey (
                id,
                name,
                room_number,
                floors (
                  name,
                  buildings (name)
                )
              )
            `)
            .eq('occupant_id', user.id)
            .order('assigned_at', { ascending: false })
            .limit(5),

          // Get maintenance notifications
          supabase
            .from('lighting_notifications')
            .select(`
              id,
              message,
              notification_type,
              created_at,
              status
            `)
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .limit(5)
        ]);

        if (!mounted) return;

        const combinedNotifications: Notification[] = [
          // Map issue updates
          ...(issueUpdates.data || []).map(update => ({
            id: update.id,
            type: 'issue_update' as const,
            title: 'Issue Update',
            message: update.notes || `Status updated for issue: ${update.issues.title}`,
            created_at: update.performed_at,
            read: false,
            metadata: {
              issue_id: update.issues.id,
              action_type: update.action_type
            }
          })),

          // Map room assignments
          ...(roomAssignments.data || []).map(assignment => ({
            id: assignment.id,
            type: 'new_assignment' as const,
            title: 'New Room Assignment',
            message: `You have been assigned to ${assignment.rooms?.name} (${assignment.rooms?.room_number}) in ${assignment.rooms?.floors?.buildings?.name}`,
            created_at: assignment.assigned_at,
            read: false,
            metadata: {
              room_id: assignment.rooms?.id,
              building_name: assignment.rooms?.floors?.buildings?.name
            }
          })),

          // Map maintenance notifications
          ...(maintenanceNotices.data || []).map(notice => ({
            id: notice.id,
            type: 'maintenance' as const,
            title: 'Maintenance Notice',
            message: notice.message,
            created_at: notice.created_at,
            read: false,
            metadata: {
              notification_type: notice.notification_type
            }
          }))
        ].sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        setNotifications(combinedNotifications);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    fetchNotifications();

    // Set up real-time subscriptions
    const issueSubscription = supabase
      .channel('issue-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'issue_history',
          filter: `issues.created_by=eq.${user?.id}`
        },
        () => fetchNotifications()
      )
      .subscribe();

    const assignmentSubscription = supabase
      .channel('room-assignments')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'occupant_room_assignments',
          filter: `occupant_id=eq.${user?.id}`
        },
        () => fetchNotifications()
      )
      .subscribe();

    const maintenanceSubscription = supabase
      .channel('maintenance-notices')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lighting_notifications'
        },
        () => fetchNotifications()
      )
      .subscribe();

    return () => {
      mounted = false;
      issueSubscription.unsubscribe();
      assignmentSubscription.unsubscribe();
      maintenanceSubscription.unsubscribe();
    };
  }, [user]);

  const markAsRead = async (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, read: true }))
    );
  };

  return {
    notifications,
    isLoading,
    markAsRead,
    markAllAsRead
  };
}
