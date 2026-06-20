-- Quick-win data cleanup pass: fix the "Facilites" department typo (already
-- corrected at the title level in migration 072) and normalize a dozen
-- inventory item names with missing spaces, doubled spaces, or stray
-- lowercase casing that surfaced during the full-app audit.

UPDATE public.profiles
SET department = 'Facilities', updated_at = now()
WHERE lower(trim(department)) = 'facilites';

UPDATE public.inventory_items SET name = '2-Hole Paper Puncher', updated_at = now()
WHERE name = '2-Hole PaperPuncher';

UPDATE public.inventory_items SET name = '8 1/2 x 11 Reinforced Binder Multicolor Tabs', updated_at = now()
WHERE name = '8 1/2 x 11 Reinforced Binder  Muliticolor Tabs';

UPDATE public.inventory_items SET name = 'Adjourn Slips', updated_at = now()
WHERE name = 'adjourn slips';

UPDATE public.inventory_items SET name = 'Desk', updated_at = now()
WHERE name = 'desk';

UPDATE public.inventory_items SET name = 'Manilla Pocket File Jackets (Legal)', updated_at = now()
WHERE name = 'Manilla Pocket File Jackets  (Legal)';

UPDATE public.inventory_items SET name = 'Manilla Pocket File Jackets (Letter)', updated_at = now()
WHERE name = 'Manilla  Pocket File Jackets (Letter)';

UPDATE public.inventory_items SET name = 'Permanent Markers Fine (Black)', updated_at = now()
WHERE name = 'Permanent Markers  Fine (Black)';

UPDATE public.inventory_items SET name = 'Permanent Markers Fine (Red)', updated_at = now()
WHERE name = 'Permanent Markers  Fine (Red)';

UPDATE public.inventory_items SET name = 'Permanent Markers Flair (Blue)', updated_at = now()
WHERE name = 'Permanent Markers  Flair (Blue)';

UPDATE public.inventory_items SET name = 'Permanent Markers Flair (Red)', updated_at = now()
WHERE name = 'Permanent Markers  Flair (Red)';

UPDATE public.inventory_items SET name = 'Register Rolls', updated_at = now()
WHERE name = 'register rolls';

UPDATE public.inventory_items SET name = 'Table', updated_at = now()
WHERE name = 'table';
