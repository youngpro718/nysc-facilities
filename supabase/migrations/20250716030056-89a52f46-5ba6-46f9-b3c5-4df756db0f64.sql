-- Add DELETE policy for user_notifications table
CREATE POLICY "Users can delete their own notifications" 
ON user_notifications 
FOR DELETE 
USING (auth.uid() = user_id);

-- Update the log_room_assignment_changes function to create user notifications
CREATE OR REPLACE FUNCTION public.log_room_assignment_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Log the assignment change
    INSERT INTO public.room_assignment_audit_log (
      assignment_id,
      action_type,
      performed_by,
      new_values
    ) VALUES (
      NEW.id,
      'created',
      auth.uid(),
      row_to_json(NEW)::jsonb
    );
    
    -- Create user notification for new assignment
    INSERT INTO user_notifications (
      user_id,
      type,
      title,
      message,
      urgency,
      action_url,
      related_id,
      metadata
    ) VALUES (
      NEW.occupant_id,
      'new_assignment',
      'New Room Assignment',
      'You have been assigned to ' || 
      COALESCE(
        (SELECT room_number FROM rooms WHERE id = NEW.room_id),
        'a room'
      ) || 
      CASE 
        WHEN NEW.is_primary THEN ' as your primary office'
        ELSE ' (' || COALESCE(NEW.assignment_type, 'assignment') || ')'
      END,
      CASE WHEN NEW.is_primary THEN 'high' ELSE 'medium' END,
      '/dashboard',
      NEW.id,
      jsonb_build_object(
        'assignment_id', NEW.id,
        'room_id', NEW.room_id,
        'assignment_type', NEW.assignment_type,
        'is_primary', NEW.is_primary
      )
    );
    
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Log the assignment change
    INSERT INTO public.room_assignment_audit_log (
      assignment_id,
      action_type,
      performed_by,
      old_values,
      new_values
    ) VALUES (
      NEW.id,
      CASE 
        WHEN NEW.expiration_date IS DISTINCT FROM OLD.expiration_date 
        AND NEW.expiration_date > now() THEN 'renewed'
        ELSE 'updated'
      END,
      auth.uid(),
      row_to_json(OLD)::jsonb,
      row_to_json(NEW)::jsonb
    );
    
    -- Create notification for significant changes
    IF OLD.room_id IS DISTINCT FROM NEW.room_id OR OLD.is_primary IS DISTINCT FROM NEW.is_primary THEN
      INSERT INTO user_notifications (
        user_id,
        type,
        title,
        message,
        urgency,
        action_url,
        related_id,
        metadata
      ) VALUES (
        NEW.occupant_id,
        'new_assignment',
        'Room Assignment Updated',
        'Your room assignment has been updated to ' || 
        COALESCE(
          (SELECT room_number FROM rooms WHERE id = NEW.room_id),
          'a room'
        ) || 
        CASE 
          WHEN NEW.is_primary THEN ' as your primary office'
          ELSE ' (' || COALESCE(NEW.assignment_type, 'assignment') || ')'
        END,
        'medium',
        '/dashboard',
        NEW.id,
        jsonb_build_object(
          'assignment_id', NEW.id,
          'room_id', NEW.room_id,
          'assignment_type', NEW.assignment_type,
          'is_primary', NEW.is_primary,
          'previous_room_id', OLD.room_id
        )
      );
    END IF;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Log the assignment change
    INSERT INTO public.room_assignment_audit_log (
      assignment_id,
      action_type,
      performed_by,
      old_values
    ) VALUES (
      OLD.id,
      'deleted',
      auth.uid(),
      row_to_json(OLD)::jsonb
    );
    
    -- Create notification for assignment removal
    INSERT INTO user_notifications (
      user_id,
      type,
      title,
      message,
      urgency,
      action_url,
      related_id,
      metadata
    ) VALUES (
      OLD.occupant_id,
      'new_assignment',
      'Room Assignment Removed',
      'Your assignment to ' || 
      COALESCE(
        (SELECT room_number FROM rooms WHERE id = OLD.room_id),
        'a room'
      ) || ' has been removed',
      'medium',
      '/dashboard',
      OLD.id,
      jsonb_build_object(
        'assignment_id', OLD.id,
        'room_id', OLD.room_id,
        'assignment_type', OLD.assignment_type,
        'action', 'removed'
      )
    );
    
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$;