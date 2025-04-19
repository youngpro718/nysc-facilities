
-- Create the storage bucket for term sheets if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('term-sheets', 'term-sheets', true)
ON CONFLICT (id) DO NOTHING;

-- Set up public access policy for the term-sheets bucket
INSERT INTO storage.policies (name, definition, bucket_id)
VALUES (
  'Public Term Sheets Access',
  '(bucket_id = ''term-sheets''::text)',
  'term-sheets'
)
ON CONFLICT (name, bucket_id) DO NOTHING;
