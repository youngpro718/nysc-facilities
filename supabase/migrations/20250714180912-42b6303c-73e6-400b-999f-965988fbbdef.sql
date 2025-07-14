-- Enable real-time updates for monitored_items table
ALTER TABLE public.monitored_items REPLICA IDENTITY FULL;

-- Add the table to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.monitored_items;