-- Enforce stock block in fn_issue_elevator_pass and extend elevator_pass_assignments view

-- 1) Update RPC to block issuance when stock is zero
CREATE OR REPLACE FUNCTION public.fn_issue_elevator_pass(
  p_key_id uuid,
  p_recipient_type text,
  p_occupant_id uuid,
  p_recipient_name text,
  p_recipient_email text,
  p_expected_return_at timestamptz,
  p_reason text,
  p_notes text
) RETURNS uuid AS $$
DECLARE
  v_is_pass boolean;
  v_avail int;
  v_assignment_id uuid;
BEGIN
  SELECT is_passkey, COALESCE(available_quantity, 0)
    INTO v_is_pass, v_avail
  FROM public.keys
  WHERE id = p_key_id;

  IF NOT COALESCE(v_is_pass, false) THEN
    RAISE EXCEPTION 'Selected key is not an elevator pass';
  END IF;

  IF v_avail <= 0 THEN
    RAISE EXCEPTION 'No available elevator passes in stock';
  END IF;

  IF p_recipient_type = 'occupant' THEN
    IF p_occupant_id IS NULL THEN
      RAISE EXCEPTION 'occupant_id is required when recipient_type=occupant';
    END IF;
    IF EXISTS (
      SELECT 1 FROM public.key_assignments ka
      WHERE ka.occupant_id = p_occupant_id AND ka.returned_at IS NULL
        AND ka.key_id IN (SELECT id FROM public.keys WHERE is_passkey)
    ) THEN
      RAISE EXCEPTION 'This occupant already has an active elevator pass';
    END IF;
  ELSE
    IF COALESCE(p_recipient_name,'') = '' THEN
      RAISE EXCEPTION 'recipient_name is required for non-occupant recipients';
    END IF;
  END IF;

  INSERT INTO public.key_assignments(
    key_id, occupant_id, assigned_at, status, is_spare,
    recipient_type, recipient_name, recipient_email, expected_return_at, spare_key_reason
  ) VALUES (
    p_key_id,
    CASE WHEN p_recipient_type='occupant' THEN p_occupant_id ELSE NULL END,
    NOW(),
    'assigned',
    false,
    p_recipient_type,
    CASE WHEN p_recipient_type='occupant' THEN NULL ELSE p_recipient_name END,
    CASE WHEN p_recipient_type='occupant' THEN NULL ELSE NULLIF(p_recipient_email,'') END,
    p_expected_return_at,
    NULLIF(p_reason,'')
  ) RETURNING id INTO v_assignment_id;

  INSERT INTO public.key_audit_logs(key_id, assignment_id, action_type, details)
  VALUES (
    p_key_id,
    v_assignment_id,
    'assigned',
    jsonb_build_object(
      'reason', NULLIF(p_reason,''),
      'notes', NULLIF(p_notes,''),
      'issued_by', 'admin'
    )
  );

  RETURN v_assignment_id;
END;$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2) Extend view to include non-occupant recipients
CREATE OR REPLACE VIEW public.elevator_pass_assignments AS
SELECT
  ka.id AS assignment_id,
  ka.key_id,
  ka.occupant_id,
  ka.assigned_at,
  ka.returned_at,
  ka.status,
  ka.return_reason,
  ka.is_spare,
  ka.spare_key_reason,
  k.name AS key_name,
  o.first_name,
  o.last_name,
  o.department,
  o.email,
  -- new recipient fields
  ka.recipient_type,
  ka.recipient_name,
  ka.recipient_email,
  -- computed
  GREATEST(0, EXTRACT(DAY FROM (NOW() - ka.assigned_at)))::int AS days_since_assigned,
  (NOW()::date - ka.assigned_at::date) > 30 AS is_overdue
FROM public.key_assignments ka
JOIN public.keys k ON k.id = ka.key_id AND k.is_passkey = true
LEFT JOIN public.occupants o ON o.id = ka.occupant_id
WHERE ka.returned_at IS NULL;
