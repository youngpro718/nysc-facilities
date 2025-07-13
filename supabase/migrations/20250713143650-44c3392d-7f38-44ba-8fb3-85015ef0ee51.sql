-- Create a new unread notification for testing
INSERT INTO user_notifications (
  user_id,
  type,
  title,
  message,
  read,
  urgency,
  action_url,
  metadata
) VALUES (
  '4fbaf107-c81b-4442-af1d-cbe965736fe3',
  'key_request_approved',
  'New Test Notification',
  'This is a new unread notification for testing the mark as read functionality. Click on this notification to test if it gets marked as read.',
  false,
  'high',
  '/my-requests',
  '{"test": true}'
);