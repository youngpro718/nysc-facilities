-- Enable realtime for room assignments table
ALTER TABLE public.occupant_room_assignments REPLICA IDENTITY FULL;

-- Add the table to the realtime publication
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR TABLE public.occupant_room_assignments;

-- Add expiration tracking and audit fields to room assignments
ALTER TABLE public.occupant_room_assignments 
ADD COLUMN IF NOT EXISTS expiration_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS last_renewal_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS renewal_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id);

-- Create room assignment audit log table
CREATE TABLE IF NOT EXISTS public.room_assignment_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid REFERENCES public.occupant_room_assignments(id) ON DELETE CASCADE,
  action_type text NOT NULL CHECK (action_type IN ('created', 'updated', 'deleted', 'renewed', 'expired')),
  performed_by uuid REFERENCES auth.users(id),
  performed_at timestamp with time zone DEFAULT now(),
  old_values jsonb,
  new_values jsonb,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Enable RLS on audit log
ALTER TABLE public.room_assignment_audit_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for audit log
CREATE POLICY "Allow authenticated users to view audit logs" ON public.room_assignment_audit_log
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to create audit logs" ON public.room_assignment_audit_log
FOR INSERT TO authenticated WITH CHECK (true);

-- Create function to log assignment changes
CREATE OR REPLACE FUNCTION public.log_room_assignment_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
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
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
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
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
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
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Create trigger for assignment audit logging
DROP TRIGGER IF EXISTS trigger_log_room_assignment_changes ON public.occupant_room_assignments;
CREATE TRIGGER trigger_log_room_assignment_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.occupant_room_assignments
  FOR EACH ROW EXECUTE FUNCTION public.log_room_assignment_changes();

-- Create function to update assignment metadata
CREATE OR REPLACE FUNCTION public.update_assignment_metadata()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Set updated_by on updates
  IF TG_OP = 'UPDATE' THEN
    NEW.updated_by = auth.uid();
    NEW.updated_at = now();
    
    -- Track renewals
    IF NEW.expiration_date IS DISTINCT FROM OLD.expiration_date 
       AND NEW.expiration_date > COALESCE(OLD.expiration_date, now()) THEN
      NEW.last_renewal_date = now();
      NEW.renewal_count = COALESCE(OLD.renewal_count, 0) + 1;
    END IF;
  ELSIF TG_OP = 'INSERT' THEN
    NEW.created_by = auth.uid();
    NEW.updated_by = auth.uid();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for metadata updates
DROP TRIGGER IF EXISTS trigger_update_assignment_metadata ON public.occupant_room_assignments;
CREATE TRIGGER trigger_update_assignment_metadata
  BEFORE INSERT OR UPDATE ON public.occupant_room_assignments
  FOR EACH ROW EXECUTE FUNCTION public.update_assignment_metadata();

-- Create room assignment conflicts view
CREATE OR REPLACE VIEW public.room_assignment_conflicts AS
SELECT 
  r1.id as assignment1_id,
  r1.occupant_id as occupant1_id,
  r1.room_id as room1_id,
  r2.id as assignment2_id,
  r2.occupant_id as occupant2_id,
  r2.room_id as room2_id,
  'double_booking' as conflict_type,
  CASE 
    WHEN r1.room_id = r2.room_id THEN 'same_room'
    WHEN r1.occupant_id = r2.occupant_id AND r1.is_primary = true AND r2.is_primary = true THEN 'multiple_primary'
    ELSE 'other'
  END as conflict_reason
FROM public.occupant_room_assignments r1
JOIN public.occupant_room_assignments r2 ON r1.id < r2.id
WHERE (
  -- Same room, overlapping assignments
  (r1.room_id = r2.room_id AND r1.assignment_type = 'primary_office' AND r2.assignment_type = 'primary_office')
  OR
  -- Same occupant, multiple primary offices
  (r1.occupant_id = r2.occupant_id AND r1.is_primary = true AND r2.is_primary = true)
);

-- Create assignment analytics view
CREATE OR REPLACE VIEW public.room_assignment_analytics AS
SELECT
  DATE_TRUNC('day', assigned_at) as assignment_date,
  COUNT(*) as daily_assignments,
  COUNT(DISTINCT occupant_id) as unique_occupants,
  COUNT(DISTINCT room_id) as unique_rooms,
  COUNT(*) FILTER (WHERE is_primary = true) as primary_assignments,
  COUNT(*) FILTER (WHERE assignment_type = 'primary_office') as office_assignments,
  COUNT(*) FILTER (WHERE assignment_type = 'temporary') as temporary_assignments,
  AVG(CASE WHEN expiration_date IS NOT NULL THEN 
    EXTRACT(epoch FROM (expiration_date - assigned_at)) / 86400 
    ELSE NULL END) as avg_assignment_duration_days
FROM public.occupant_room_assignments
WHERE assigned_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY DATE_TRUNC('day', assigned_at)
ORDER BY assignment_date DESC;