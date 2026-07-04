-- 094: Term-sheet flexibility — shared courtrooms + recent-change highlight
--
-- (1) Drop the hard (term_id, room_id) uniqueness. A courtroom legitimately
--     serves more than one part in a term (e.g. Part A sits Thursdays in
--     Room 733, Part B sits there the rest of the week). The constraint made
--     that impossible; sharing is now allowed and the UI warns-but-permits.
--
-- (2) roster_changed_at marks when a row's people/part/room last changed, so
--     the board can highlight recent moves and let the highlight fade. It is
--     set ONLY on roster edits and new parts — never on reorder (which touches
--     sort_order + updated_at) — so dragging rows doesn't light everything up.
--     Nullable with no default: existing rows and freshly-copied terms start
--     un-highlighted (copy_term_assignments uses an explicit column list that
--     omits this column).

DROP INDEX IF EXISTS public.idx_court_assignments_term_room_unique;

ALTER TABLE public.court_assignments
  ADD COLUMN IF NOT EXISTS roster_changed_at timestamptz;
