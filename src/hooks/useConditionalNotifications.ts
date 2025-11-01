import { useAuth } from '@/hooks/useAuth';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import { useAdminRealtimeNotifications } from '@/hooks/useAdminRealtimeNotifications';

export const useConditionalNotifications = () => {
  // Always initialize user notifications
  const userNotifications = useRealtimeNotifications();
  
  // Always initialize admin notifications (it will be conditional inside the hook)
  const adminNotifications = useAdminRealtimeNotifications();
  
  // Return the appropriate notification status
  return {
    isConnected: userNotifications.isConnected,
    lastNotification: userNotifications.lastNotification,
    isAdminConnected: adminNotifications.isConnected,
    lastAdminNotification: adminNotifications.lastNotification,
  };
};