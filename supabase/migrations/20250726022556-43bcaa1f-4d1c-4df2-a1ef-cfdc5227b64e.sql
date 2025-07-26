-- Fix missing columns and schema issues

-- Add missing columns to maintenance_requests
ALTER TABLE public.maintenance_requests 
ADD COLUMN IF NOT EXISTS scheduled_date timestamptz;

-- Add missing columns to keys table
ALTER TABLE public.keys 
ADD COLUMN IF NOT EXISTS active_assignments integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS lost_count integer DEFAULT 0;

-- Fix key_orders status enum to include all needed values
CREATE TYPE key_order_status AS ENUM (
  'pending_fulfillment',
  'in_progress', 
  'ready_for_pickup',
  'completed',
  'cancelled',
  'ordered',
  'partially_received',
  'received',
  'delivered'
);

-- Add new status column with proper enum
ALTER TABLE public.key_orders 
ADD COLUMN IF NOT EXISTS new_status key_order_status DEFAULT 'pending_fulfillment';

-- Copy existing status values to new column
UPDATE public.key_orders 
SET new_status = CASE 
  WHEN status = 'canceled' THEN 'cancelled'::key_order_status
  ELSE status::key_order_status
END;

-- Drop old status column and rename new one
ALTER TABLE public.key_orders DROP COLUMN IF EXISTS status;
ALTER TABLE public.key_orders RENAME COLUMN new_status TO status;

-- Create personnel_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.personnel_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text,
  last_name text,
  display_name text NOT NULL,
  primary_role text NOT NULL DEFAULT 'officer',
  title text,
  department text,
  phone text,
  extension text,
  fax text,
  email text,
  room_number text,
  floor text,
  building text,
  is_active boolean DEFAULT true,
  is_available_for_assignment boolean DEFAULT true,
  notes text,
  specializations text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on personnel_profiles
ALTER TABLE public.personnel_profiles ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Users can view personnel profiles" 
ON public.personnel_profiles 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can manage personnel profiles" 
ON public.personnel_profiles 
FOR ALL 
USING (auth.uid() IS NOT NULL) 
WITH CHECK (auth.uid() IS NOT NULL);

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