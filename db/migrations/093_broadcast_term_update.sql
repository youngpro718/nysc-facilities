-- 093: broadcast term-sheet updates to every user
--
-- Why: the term sheet is maintained by a small set of editors (admin /
-- court_liaison — RLS already enforces this), but when they publish a change
-- nobody else finds out except by re-opening the page. This RPC fans one
-- notification out to every profile so "a key person updates the term and it
-- goes out to everyone". SECURITY DEFINER because users can only insert their
-- own user_notifications rows under RLS; the role check inside mirrors the
-- term-sheet edit gate.

BEGIN;

CREATE OR REPLACE FUNCTION public.broadcast_term_update(p_title text, p_message text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
      AND role::text IN ('admin', 'system_admin', 'court_liaison')
  ) THEN
    RAISE EXCEPTION 'Not authorized to broadcast term updates';
  END IF;

  INSERT INTO user_notifications (user_id, type, title, message, urgency, action_url)
  SELECT
    p.id,
    'new_assignment',
    COALESCE(NULLIF(trim(p_title), ''), 'Term sheet updated'),
    COALESCE(
      NULLIF(trim(p_message), ''),
      'Court assignments have changed. Open the term sheet for the latest.'
    ),
    'medium',
    '/term-sheet'
  FROM profiles p
  WHERE p.id <> auth.uid(); -- the editor already knows

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.broadcast_term_update(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.broadcast_term_update(text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.broadcast_term_update(text, text) TO authenticated;

COMMIT;
