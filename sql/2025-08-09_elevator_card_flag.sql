-- Introduce elevator card concept separate from physical "passkeys"
-- 1) Add is_elevator_card flag on keys
DO $$ BEGIN
  ALTER TABLE public.keys ADD COLUMN IF NOT EXISTS is_elevator_card boolean DEFAULT false;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- 2) Replace stock triggers to operate only on elevator cards (not master passkeys)
CREATE OR REPLACE FUNCTION public.fn_adjust_elevator_card_stock() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF EXISTS (SELECT 1 FROM public.keys k WHERE k.id = NEW.key_id AND k.is_elevator_card) THEN
      UPDATE public.keys SET available_quantity = GREATEST(0, COALESCE(available_quantity,0) - 1)
      WHERE id = NEW.key_id;
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF OLD.returned_at IS NULL AND NEW.returned_at IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.keys k WHERE k.id = NEW.key_id AND k.is_elevator_card
    ) THEN
      UPDATE public.keys SET available_quantity = COALESCE(available_quantity,0) + 1
      WHERE id = NEW.key_id;
    END IF;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- drop old triggers if they existed
DROP TRIGGER IF EXISTS trg_adjust_passkey_stock_ins ON public.key_assignments;
DROP TRIGGER IF EXISTS trg_adjust_passkey_stock_upd ON public.key_assignments;

-- create new triggers pointing to elevator card stock function
DROP TRIGGER IF EXISTS trg_adjust_elevator_card_stock_ins ON public.key_assignments;
CREATE TRIGGER trg_adjust_elevator_card_stock_ins
AFTER INSERT ON public.key_assignments
FOR EACH ROW EXECUTE FUNCTION public.fn_adjust_elevator_card_stock();

DROP TRIGGER IF EXISTS trg_adjust_elevator_card_stock_upd ON public.key_assignments;
CREATE TRIGGER trg_adjust_elevator_card_stock_upd
AFTER UPDATE OF returned_at ON public.key_assignments
FOR EACH ROW EXECUTE FUNCTION public.fn_adjust_elevator_card_stock();

-- 3) Update RPC to validate is_elevator_card and enforce stock > 0
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
  v_is_card boolean;
  v_avail int;
  v_assignment_id uuid;
BEGIN
  SELECT is_elevator_card, COALESCE(available_quantity, 0)
    INTO v_is_card, v_avail
  FROM public.keys
  WHERE id = p_key_id;

  IF NOT COALESCE(v_is_card, false) THEN
    RAISE EXCEPTION 'Selected key is not an elevator card';
  END IF;

  IF v_avail <= 0 THEN
    RAISE EXCEPTION 'No available elevator cards in stock';
  END IF;

  IF p_recipient_type = 'occupant' THEN
    IF p_occupant_id IS NULL THEN
      RAISE EXCEPTION 'occupant_id is required when recipient_type=occupant';
    END IF;
    IF EXISTS (
      SELECT 1 FROM public.key_assignments ka
      WHERE ka.occupant_id = p_occupant_id AND ka.returned_at IS NULL
        AND ka.key_id IN (SELECT id FROM public.keys WHERE is_elevator_card)
    ) THEN
      RAISE EXCEPTION 'This occupant already has an active elevator card';
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

-- 4) Update unique index to target elevator cards
DO $$ BEGIN
  DROP INDEX IF EXISTS uq_active_pass_per_occupant;
  CREATE UNIQUE INDEX uq_active_elevator_card_per_occupant
    ON public.key_assignments(occupant_id)
    WHERE returned_at IS NULL AND occupant_id IS NOT NULL AND key_id IN (
      SELECT id FROM public.keys WHERE is_elevator_card = true
    );
END $$;

-- 5) Update the view to target elevator cards
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
  ka.recipient_type,
  ka.recipient_name,
  ka.recipient_email,
  GREATEST(0, EXTRACT(DAY FROM (NOW() - ka.assigned_at)))::int AS days_since_assigned,
  (NOW()::date - ka.assigned_at::date) > 30 AS is_overdue
FROM public.key_assignments ka
JOIN public.keys k ON k.id = ka.key_id AND k.is_elevator_card = true
LEFT JOIN public.occupants o ON o.id = ka.occupant_id
WHERE ka.returned_at IS NULL;
