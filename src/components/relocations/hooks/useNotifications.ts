import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  createRelocationNotification,
  createScheduleChangeNotification,
  NotificationRecipient
} from "../services/notificationService";
import {
  RelocationNotification,
  ScheduleChangeNotification
} from "../types/relocationTypes";

export function useNotifications() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Send relocation notification
  const sendRelocationNotificationMutation = useMutation({
    mutationFn: (data: {
      relocationId: string;
      recipients: NotificationRecipient[];
      subject?: string;
      message?: string;
    }) => createRelocationNotification(data.relocationId, data.recipients, data.subject, data.message),
    onSuccess: () => {
      // Invalidate relevant queries if needed
      queryClient.invalidateQueries({ queryKey: ['relocations'] });
      
      toast({
        title: "Notification sent",
        description: "The relocation notification has been successfully sent.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send relocation notification.",
        variant: "destructive",
      });
      console.error('Error sending relocation notification:', error);
    },
  });

  // Send schedule change notification
  const sendScheduleChangeNotificationMutation = useMutation({
    mutationFn: (data: {
      scheduleChangeId: string;
      recipients: NotificationRecipient[];
      subject?: string;
      message?: string;
    }) => createScheduleChangeNotification(data.scheduleChangeId, data.recipients, data.subject, data.message),
    onSuccess: () => {
      // Invalidate relevant queries if needed
      queryClient.invalidateQueries({ queryKey: ['scheduleChanges'] });
      
      toast({
        title: "Notification sent",
        description: "The schedule change notification has been successfully sent.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send schedule change notification.",
        variant: "destructive",
      });
      console.error('Error sending schedule change notification:', error);
    },
  });

  return {
    // Mutations
    sendRelocationNotification: sendRelocationNotificationMutation.mutate,
    sendScheduleChangeNotification: sendScheduleChangeNotificationMutation.mutate,
    
    // Mutation states
    isSendingRelocationNotification: sendRelocationNotificationMutation.isPending,
    isSendingScheduleChangeNotification: sendScheduleChangeNotificationMutation.isPending,
  };
} 