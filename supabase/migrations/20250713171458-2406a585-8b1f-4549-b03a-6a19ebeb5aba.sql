-- Create storage bucket for PDF uploads if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('term-pdfs', 'term-pdfs', true, 52428800, ARRAY['application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for the term-pdfs bucket
CREATE POLICY IF NOT EXISTS "Anyone can view term PDFs" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'term-pdfs');

CREATE POLICY IF NOT EXISTS "Anyone can upload term PDFs" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'term-pdfs');

CREATE POLICY IF NOT EXISTS "Anyone can update term PDFs" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'term-pdfs');

CREATE POLICY IF NOT EXISTS "Anyone can delete term PDFs" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'term-pdfs');