-- Create user_notifications table
CREATE TABLE user_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('key_request_approved', 'key_request_denied', 'key_request_fulfilled', 'new_assignment', 'maintenance', 'issue_update')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  urgency TEXT CHECK (urgency IN ('low', 'medium', 'high')) DEFAULT 'medium',
  action_url TEXT,
  metadata JSONB DEFAULT '{}',
  related_id UUID -- can reference key_requests.id or other entities
);

-- Enable RLS
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own notifications" 
ON user_notifications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
ON user_notifications 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_user_notifications_user_id ON user_notifications(user_id);
CREATE INDEX idx_user_notifications_created_at ON user_notifications(created_at DESC);
CREATE INDEX idx_user_notifications_read ON user_notifications(read);

-- Create function to create user notifications
CREATE OR REPLACE FUNCTION create_user_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_urgency TEXT DEFAULT 'medium',
  p_action_url TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}',
  p_related_id UUID DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO user_notifications (
    user_id, type, title, message, urgency, action_url, metadata, related_id
  ) VALUES (
    p_user_id, p_type, p_title, p_message, p_urgency, p_action_url, p_metadata, p_related_id
  ) RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;

-- Enable realtime for user_notifications
ALTER TABLE user_notifications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE user_notifications;