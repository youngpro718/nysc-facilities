-- Insert test notifications for the current user
INSERT INTO user_notifications (user_id, type, title, message, urgency, read)
VALUES 
  (auth.uid(), 'new_assignment', 'New Room Assignment', 'You have been assigned to Room 101', 'medium', false),
  (auth.uid(), 'maintenance', 'Scheduled Maintenance', 'Maintenance is scheduled for your area next week', 'low', false);