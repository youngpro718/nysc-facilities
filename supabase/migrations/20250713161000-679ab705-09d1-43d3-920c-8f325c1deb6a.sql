-- Create storage bucket for term PDF uploads
INSERT INTO storage.buckets (id, name, public) 
VALUES ('term-pdfs', 'term-pdfs', true);

-- Create storage policies for term PDFs
CREATE POLICY "Allow public read access to term PDFs" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'term-pdfs');

CREATE POLICY "Allow authenticated users to upload term PDFs" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'term-pdfs' AND auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to update term PDFs" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'term-pdfs' AND auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to delete term PDFs" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'term-pdfs' AND auth.uid() IS NOT NULL);