-- Fix missing columns without recreating existing types

-- Add missing columns to maintenance_requests
ALTER TABLE public.maintenance_requests 
ADD COLUMN IF NOT EXISTS scheduled_date timestamptz;

-- Add missing columns to keys table
ALTER TABLE public.keys 
ADD COLUMN IF NOT EXISTS active_assignments integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS lost_count integer DEFAULT 0;

-- Add new status values to existing enum
ALTER TYPE key_order_status ADD VALUE IF NOT EXISTS 'ordered';
ALTER TYPE key_order_status ADD VALUE IF NOT EXISTS 'partially_received';
ALTER TYPE key_order_status ADD VALUE IF NOT EXISTS 'received';
ALTER TYPE key_order_status ADD VALUE IF NOT EXISTS 'delivered';

-- Update key_orders with missing recipient info from profiles
UPDATE public.key_orders ko
SET 
  recipient_name = COALESCE(p.first_name || ' ' || p.last_name, p.email),
  recipient_department = COALESCE(p.department, 'Unknown')
FROM public.profiles p
WHERE ko.user_id = p.id 
  AND (ko.recipient_name IS NULL OR ko.recipient_name = '');

-- Update key_orders with key info from keys table
UPDATE public.key_orders ko
SET 
  key_name = COALESCE(k.name, 'Unknown Key'),
  key_type = COALESCE(k.type::text, 'standard')
FROM public.keys k
WHERE ko.key_id = k.id 
  AND (ko.key_name IS NULL OR ko.key_name = '');

-- Create emergency admin for current session user
-- Replace this email with your actual email
-- SELECT public.create_emergency_admin('your-email@example.com');