-- Adds a manual operational status to court_rooms to distinguish Open vs Occupied when no assignment exists
-- safe to run multiple times due to IF NOT EXISTS guards
DO $$
BEGIN
  -- Add column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'court_rooms'
      AND column_name = 'operational_status'
  ) THEN
    ALTER TABLE public.court_rooms
      ADD COLUMN operational_status TEXT CHECK (operational_status IN ('open', 'occupied'));
  END IF;
END $$;

-- Optional: create a helpful comment
COMMENT ON COLUMN public.court_rooms.operational_status IS 'Manual operational state: open | occupied; used when no assignment is present';
