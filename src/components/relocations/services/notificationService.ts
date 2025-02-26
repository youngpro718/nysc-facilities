import { supabase } from "@/integrations/supabase/client";
import { RelocationNotification } from "../types/relocationTypes";

// Define a simpler type for recipients
export type NotificationRecipient = {
  id?: string;
  email?: string;
  name?: string;
  type?: string;
};

// Helper function to prepare notification data
function prepareNotificationData(data: {
  relocation_id?: string;
  schedule_change_id?: string;
  message: string;
  recipients: NotificationRecipient[];
}) {
  return {
    ...data,
    status: 'pending',
    recipients: JSON.stringify(data.recipients) // Convert to string instead of parsing
  };
}

// Create a notification for a relocation
export async function createRelocationNotification(
  relocationId: string,
  recipients: NotificationRecipient[],
  subject?: string,
  message?: string
) {
  const defaultMessage = subject || "Relocation Update";
  const notificationMessage = message || defaultMessage;
  
  const notificationData = prepareNotificationData({
    relocation_id: relocationId,
    message: notificationMessage,
    recipients: recipients
  });
  
  const { data, error } = await supabase
    .from('relocation_notifications')
    .insert({
      ...notificationData,
      notification_type: "relocation_update"
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating relocation notification:', error);
    throw error;
  }

  return data as RelocationNotification;
}

// Create a notification for a schedule change
export async function createScheduleChangeNotification(
  scheduleChangeId: string,
  recipients: NotificationRecipient[],
  subject?: string,
  message?: string
) {
  const defaultMessage = subject || "Schedule Change Update";
  const notificationMessage = message || defaultMessage;
  
  const notificationData = prepareNotificationData({
    schedule_change_id: scheduleChangeId,
    message: notificationMessage,
    recipients: recipients
  });
  
  const { data, error } = await supabase
    .from('relocation_notifications')
    .insert({
      ...notificationData,
      notification_type: "schedule_change"
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating schedule change notification:', error);
    throw error;
  }

  return data as RelocationNotification;
}

// Mark a notification as sent
export async function markNotificationAsSent(id: string) {
  const { data, error } = await supabase
    .from('relocation_notifications')
    .update({
      status: 'sent',
      sent_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error(`Error marking notification ${id} as sent:`, error);
    throw error;
  }

  return data as RelocationNotification;
}

// Fetch notifications for a relocation
export async function fetchRelocationNotifications(relocationId: string) {
  const { data, error } = await supabase
    .from('relocation_notifications')
    .select('*')
    .eq('relocation_id', relocationId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error(`Error fetching notifications for relocation ${relocationId}:`, error);
    throw error;
  }

  return data as RelocationNotification[];
}

// Fetch notifications for a schedule change
export async function fetchScheduleChangeNotifications(scheduleChangeId: string): Promise<RelocationNotification[]> {
  // Completely bypass the type instantiation issue by using a different approach
  // First, get all notifications (without filtering)
  try {
    // Get all notifications and filter them in memory
    const { data, error } = await supabase
      .from('relocation_notifications')
      .select('*');
    
    if (error) {
      throw error;
    }
    
    // Filter and sort in memory instead of in the query
    const filteredData = data
      .filter(notification => {
        // Use type assertion to avoid property access error
        const typedNotification = notification as any;
        return typedNotification.schedule_change_id === scheduleChangeId;
      })
      .sort((a, b) => {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return dateB - dateA; // descending order
      });
    
    return filteredData as RelocationNotification[];
  } catch (err) {
    console.error(`Error fetching notifications for schedule change ${scheduleChangeId}:`, err);
    return [];
  }
}

// Fetch pending notifications
export async function fetchPendingNotifications() {
  const { data, error } = await supabase
    .from('relocation_notifications')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching pending notifications:', error);
    throw error;
  }

  return data as RelocationNotification[];
}

// Generate notification message for relocation status change
export function generateRelocationStatusMessage(
  status: string,
  originalRoomName: string,
  originalRoomNumber: string,
  temporaryRoomName: string,
  temporaryRoomNumber: string,
  startDate: string,
  endDate?: string
) {
  const formattedStartDate = new Date(startDate).toLocaleDateString();
  const formattedEndDate = endDate ? new Date(endDate).toLocaleDateString() : 'TBD';
  
  switch (status) {
    case 'pending':
      return `UPCOMING RELOCATION: ${originalRoomName} (Room ${originalRoomNumber}) will be temporarily relocated to ${temporaryRoomName} (Room ${temporaryRoomNumber}) starting on ${formattedStartDate}. Expected return: ${formattedEndDate}.`;
    
    case 'active':
      return `ACTIVE RELOCATION: ${originalRoomName} (Room ${originalRoomNumber}) has been temporarily relocated to ${temporaryRoomName} (Room ${temporaryRoomNumber}) as of ${formattedStartDate}. Expected return: ${formattedEndDate}.`;
    
    case 'completed':
      return `COMPLETED RELOCATION: ${originalRoomName} (Room ${originalRoomNumber}) has returned to its original location from ${temporaryRoomName} (Room ${temporaryRoomNumber}). Relocation period: ${formattedStartDate} to ${formattedEndDate}.`;
    
    case 'cancelled':
      return `CANCELLED RELOCATION: The planned relocation of ${originalRoomName} (Room ${originalRoomNumber}) to ${temporaryRoomName} (Room ${temporaryRoomNumber}) has been cancelled.`;
    
    default:
      return `RELOCATION UPDATE: ${originalRoomName} (Room ${originalRoomNumber}) - ${temporaryRoomName} (Room ${temporaryRoomNumber}). Period: ${formattedStartDate} to ${formattedEndDate}.`;
  }
}

// Generate notification message for schedule change
export function generateScheduleChangeMessage(
  originalCourtPart: string,
  temporaryAssignment: string,
  startDate: string,
  endDate?: string,
  specialInstructions?: string
) {
  const formattedStartDate = new Date(startDate).toLocaleDateString();
  const formattedEndDate = endDate ? new Date(endDate).toLocaleDateString() : 'TBD';
  
  let message = `SCHEDULE CHANGE: ${originalCourtPart} matters will be temporarily assigned to ${temporaryAssignment} from ${formattedStartDate} to ${formattedEndDate}.`;
  
  if (specialInstructions) {
    message += ` Special instructions: ${specialInstructions}`;
  }
  
  return message;
} 