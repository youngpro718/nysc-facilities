-- Create storage bucket for inventory photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('inventory-photos', 'inventory-photos', true);

-- Create storage policies for inventory photos
CREATE POLICY "Allow authenticated users to view inventory photos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'inventory-photos');

CREATE POLICY "Allow authenticated users to upload inventory photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'inventory-photos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to update inventory photos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'inventory-photos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to delete inventory photos" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'inventory-photos' AND auth.uid() IS NOT NULL);