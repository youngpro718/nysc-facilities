import { useUserRealtimeNotifications } from '@/hooks/realtime/useUserRealtimeNotifications';
import { useAdminRealtimeNotifications } from '@/hooks/realtime/useAdminRealtimeNotifications';

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