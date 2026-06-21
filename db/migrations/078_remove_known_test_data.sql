-- Remove known audit/test records from production-facing lists.

DELETE FROM public.lockbox_slots
WHERE lockbox_id IN (
  SELECT id FROM public.lockboxes WHERE lower(trim(name)) = 'larry''s lockbox'
);

DELETE FROM public.lockboxes
WHERE lower(trim(name)) = 'larry''s lockbox';

UPDATE public.profiles
SET
  is_suspended = true,
  is_approved = false,
  verification_status = 'rejected',
  updated_at = now()
WHERE lower(email) IN ('testaide@gmail.com', 'testaid@gmail.com');

UPDATE public.court_admin_staff
SET name = trim(regexp_replace(name, '\s*\*+\s*$', ''))
WHERE name ~ '\*+\s*$';

UPDATE public.court_admin_staff
SET room = '17th Floor'
WHERE lower(trim(room)) IN ('17th fl', '17th fl.');
