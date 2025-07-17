-- Add courtroom capacity fields to court_rooms table
ALTER TABLE court_rooms 
ADD COLUMN IF NOT EXISTS juror_capacity integer DEFAULT 12,
ADD COLUMN IF NOT EXISTS spectator_capacity integer DEFAULT 50,
ADD COLUMN IF NOT EXISTS accessibility_features jsonb DEFAULT '{"wheelchair_accessible": true, "hearing_assistance": false, "visual_aids": false}'::jsonb;

-- Add room size calculation helper function
CREATE OR REPLACE FUNCTION get_room_size_category(room_width integer, room_height integer)
RETURNS text AS $$
BEGIN
  IF room_width IS NULL OR room_height IS NULL THEN
    RETURN 'medium';
  END IF;
  
  -- Calculate area and categorize
  DECLARE area integer := room_width * room_height;
  BEGIN
    IF area < 2000 THEN
      RETURN 'small';
    ELSIF area > 5000 THEN
      RETURN 'large';
    ELSE
      RETURN 'medium';
    END IF;
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add persistent issues detection
CREATE OR REPLACE VIEW room_persistent_issues AS
SELECT 
  room_id,
  COUNT(*) as issue_count,
  COUNT(CASE WHEN status = 'open' THEN 1 END) as open_issues,
  MAX(created_at) as latest_issue_date
FROM issues 
WHERE status IN ('open', 'in_progress')
  AND room_id IS NOT NULL
GROUP BY room_id
HAVING COUNT(*) >= 3; -- 3+ issues makes it "persistent"