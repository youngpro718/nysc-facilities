-- Create the term-pdfs storage bucket for court term PDF uploads
INSERT INTO storage.buckets (id, name, public) 
VALUES ('term-pdfs', 'term-pdfs', true);

-- Create storage policies for term-pdfs bucket
CREATE POLICY "Allow authenticated users to upload term PDFs" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'term-pdfs' AND auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to view term PDFs" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'term-pdfs' AND auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete term PDFs" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'term-pdfs' AND auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update term PDFs" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'term-pdfs' AND auth.role() = 'authenticated');