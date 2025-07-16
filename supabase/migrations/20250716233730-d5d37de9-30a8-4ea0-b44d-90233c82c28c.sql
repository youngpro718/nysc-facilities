-- Insert test notifications for the existing user
INSERT INTO user_notifications (user_id, type, title, message, urgency, read)
VALUES 
  ('4fbaf107-c81b-4442-af1d-cbe965736fe3', 'new_assignment', 'New Room Assignment', 'You have been assigned to Room 101', 'medium', false),
  ('4fbaf107-c81b-4442-af1d-cbe965736fe3', 'maintenance', 'Scheduled Maintenance', 'Maintenance is scheduled for your area next week', 'low', false);