-- Normalize the known misspelling without changing legitimate custom titles.
UPDATE public.profiles
SET title = 'Facilities Liaison',
    updated_at = now()
WHERE lower(trim(title)) = 'facilites liaison';
