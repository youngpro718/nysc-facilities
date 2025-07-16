-- Create storage bucket for inventory photos
INSERT INTO storage.buckets (id, name, public) VALUES ('inventory-photos', 'inventory-photos', true);

-- Create storage policies for inventory photos
CREATE POLICY "Anyone can view inventory photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'inventory-photos');

CREATE POLICY "Authenticated users can upload inventory photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'inventory-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own inventory photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'inventory-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete inventory photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'inventory-photos' AND auth.role() = 'authenticated');

-- Add photo_url column to inventory_items table if it doesn't exist
ALTER TABLE inventory_items 
ADD COLUMN IF NOT EXISTS photo_url TEXT;