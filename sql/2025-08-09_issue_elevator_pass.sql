-- Add recipient fields to key_assignments for non-occupant recipients
DO $$ BEGIN
  ALTER TABLE public.key_assignments
    ADD COLUMN IF NOT EXISTS recipient_type text CHECK (recipient_type IN ('occupant','officer','office','group')),
    ADD COLUMN IF NOT EXISTS recipient_name text,
    ADD COLUMN IF NOT EXISTS recipient_email text,
    ADD COLUMN IF NOT EXISTS expected_return_at timestamptz;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- Ensure ONLY one active elevator pass per occupant (does not restrict non-occupant recipients)
DO $$ BEGIN
  CREATE UNIQUE INDEX IF NOT EXISTS uq_active_pass_per_occupant
  ON public.key_assignments(occupant_id)
  WHERE returned_at IS NULL AND occupant_id IS NOT NULL AND key_id IN (
    SELECT id FROM public.keys WHERE is_passkey = true
  );
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Trigger: adjust keys.available_quantity for passkeys on assign/return
CREATE OR REPLACE FUNCTION public.fn_adjust_passkey_stock() RETURNS trigger AS $$
BEGIN
  -- On insert of assignment (assign)
  IF TG_OP = 'INSERT' THEN
    IF EXISTS (SELECT 1 FROM public.keys k WHERE k.id = NEW.key_id AND k.is_passkey) THEN
      UPDATE public.keys SET available_quantity = GREATEST(0, COALESCE(available_quantity,0) - 1)
      WHERE id = NEW.key_id;
    END IF;
    RETURN NEW;
  END IF;

  -- On update: when returned_at is set from null to not null, increment
  IF TG_OP = 'UPDATE' THEN
    IF OLD.returned_at IS NULL AND NEW.returned_at IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.keys k WHERE k.id = NEW.key_id AND k.is_passkey
    ) THEN
      UPDATE public.keys SET available_quantity = COALESCE(available_quantity,0) + 1
      WHERE id = NEW.key_id;
    END IF;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_adjust_passkey_stock_ins ON public.key_assignments;
CREATE TRIGGER trg_adjust_passkey_stock_ins
AFTER INSERT ON public.key_assignments
FOR EACH ROW EXECUTE FUNCTION public.fn_adjust_passkey_stock();

DROP TRIGGER IF EXISTS trg_adjust_passkey_stock_upd ON public.key_assignments;
CREATE TRIGGER trg_adjust_passkey_stock_upd
AFTER UPDATE OF returned_at ON public.key_assignments
FOR EACH ROW EXECUTE FUNCTION public.fn_adjust_passkey_stock();

-- RPC: issue an elevator pass
CREATE OR REPLACE FUNCTION public.fn_issue_elevator_pass(
  p_key_id uuid,
  p_recipient_type text, -- 'occupant' | 'officer' | 'office' | 'group'
  p_occupant_id uuid,    -- required when recipient_type='occupant'
  p_recipient_name text, -- required for non-occupant
  p_recipient_email text, -- optional
  p_expected_return_at timestamptz, -- optional
  p_reason text, -- optional
  p_notes text   -- optional
) RETURNS uuid AS $$
DECLARE
  v_is_pass boolean;
  v_assignment_id uuid;
BEGIN
  -- Validate key is a pass
  SELECT is_passkey INTO v_is_pass FROM public.keys WHERE id = p_key_id;
  IF NOT COALESCE(v_is_pass, false) THEN
    RAISE EXCEPTION 'Selected key is not an elevator pass';
  END IF;

  -- Validate recipient
  IF p_recipient_type = 'occupant' THEN
    IF p_occupant_id IS NULL THEN
      RAISE EXCEPTION 'occupant_id is required when recipient_type=occupant';
    END IF;
    -- Enforce at most one active pass for this occupant via unique index; pre-check for UX
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

  -- Insert assignment
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

  -- Audit log (assigned)
  INSERT INTO public.key_audit_logs(key_id, assignment_id, action_type, details)
  VALUES (
    p_key_id,
    v_assignment_id,
    'assigned',
    jsonb_build_object(
      'reason', NULLIF(p_reason,''),
      'notes', NULLIF(p_notes,''),
      'issued_by', 'admin' -- front-end should set current admin in details if needed
    )
  );

  RETURN v_assignment_id;
END;$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
