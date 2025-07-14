-- Create storage bucket for term PDFs if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('term-pdfs', 'term-pdfs', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for term-pdfs bucket
CREATE POLICY "Allow authenticated users to upload term PDFs"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'term-pdfs' AND auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to read term PDFs"
ON storage.objects
FOR SELECT
USING (bucket_id = 'term-pdfs' AND auth.role() = 'authenticated');

CREATE POLICY "Allow public access to term PDFs"
ON storage.objects
FOR SELECT
USING (bucket_id = 'term-pdfs');