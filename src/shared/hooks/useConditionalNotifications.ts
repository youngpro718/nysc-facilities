import { useUserRealtimeNotifications } from '@shared/hooks/useUserRealtimeNotifications';
import { useAdminRealtimeNotifications } from '@features/admin/hooks/useAdminRealtimeNotifications';

export const useConditionalNotifications = () => {
  // Consolidated user notifications (1 channel instead of 6)
  const userNotifications = useUserRealtimeNotifications();
  
  // Consolidated admin notifications (1 channel instead of 9+)
  const adminNotifications = useAdminRealtimeNotifications();
  
  return {
    isConnected: userNotifications.isConnected,
    lastNotification: userNotifications.lastNotification,
    isAdminConnected: adminNotifications.isConnected,
    lastAdminNotification: adminNotifications.lastNotification,
  };
};