-- Create storage bucket for inventory photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'inventory-photos', 
  'inventory-photos', 
  true, 
  5242880, -- 5MB limit
  '{"image/jpeg", "image/jpg", "image/png", "image/webp"}'
);

-- Create RLS policies for inventory photos
CREATE POLICY "Allow authenticated users to view inventory photos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'inventory-photos');

CREATE POLICY "Allow authenticated users to upload inventory photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'inventory-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update inventory photos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'inventory-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete inventory photos" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'inventory-photos' AND auth.role() = 'authenticated');

-- Add photo_url column to inventory_items table
ALTER TABLE inventory_items 
ADD COLUMN photo_url TEXT;

-- Update the inventory_items table comment
COMMENT ON COLUMN inventory_items.photo_url IS 'URL to the item photo stored in Supabase storage';