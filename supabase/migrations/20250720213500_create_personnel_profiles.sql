-- Create personnel profiles table for court operations
CREATE TABLE IF NOT EXISTS personnel_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Basic Information
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  full_name TEXT GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
  display_name TEXT, -- For custom display names like "M. LEWIS"
  
  -- Role Information
  primary_role TEXT NOT NULL CHECK (primary_role IN ('judge', 'clerk', 'sergeant', 'officer', 'administrator')),
  title TEXT, -- Full title like "Justice", "Court Clerk Specialist", etc.
  department TEXT,
  
  -- Contact Information
  phone TEXT,
  extension TEXT,
  fax TEXT,
  email TEXT,
  
  -- Location Information
  room_number TEXT,
  floor TEXT,
  building TEXT DEFAULT '100 Centre Street',
  
  -- Status and Availability
  is_active BOOLEAN DEFAULT true,
  is_available_for_assignment BOOLEAN DEFAULT true,
  
  -- Additional Information
  notes TEXT,
  specializations TEXT[], -- Array of specializations
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_personnel_profiles_role ON personnel_profiles(primary_role);
CREATE INDEX IF NOT EXISTS idx_personnel_profiles_active ON personnel_profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_personnel_profiles_available ON personnel_profiles(is_available_for_assignment);
CREATE INDEX IF NOT EXISTS idx_personnel_profiles_name ON personnel_profiles(last_name, first_name);
CREATE INDEX IF NOT EXISTS idx_personnel_profiles_display_name ON personnel_profiles(display_name);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_personnel_profiles_updated_at 
    BEFORE UPDATE ON personnel_profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE personnel_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Personnel profiles are viewable by authenticated users" ON personnel_profiles
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Personnel profiles are insertable by authenticated users" ON personnel_profiles
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Personnel profiles are updatable by authenticated users" ON personnel_profiles
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Personnel profiles are deletable by authenticated users" ON personnel_profiles
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create a view for easy querying
CREATE OR REPLACE VIEW personnel_profiles_view AS
SELECT 
  id,
  first_name,
  last_name,
  full_name,
  COALESCE(display_name, full_name) as name,
  primary_role,
  title,
  department,
  phone,
  extension,
  fax,
  email,
  room_number,
  floor,
  building,
  is_active,
  is_available_for_assignment,
  notes,
  specializations,
  created_at,
  updated_at
FROM personnel_profiles
WHERE is_active = true
ORDER BY primary_role, last_name, first_name;

-- Grant permissions on the view
GRANT SELECT ON personnel_profiles_view TO authenticated;
