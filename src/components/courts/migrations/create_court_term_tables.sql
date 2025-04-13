-- Court term scheduling database schema

-- Step 1: Create court terms table
CREATE TABLE IF NOT EXISTS court_terms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    term_number TEXT NOT NULL,
    term_name TEXT NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    location TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Step 2: Create court parts table
CREATE TABLE IF NOT EXISTS court_parts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    part_code TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Create term assignments table
CREATE TABLE IF NOT EXISTS term_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    term_id UUID REFERENCES court_terms(id) ON DELETE CASCADE,
    part_id UUID REFERENCES court_parts(id),
    room_id UUID REFERENCES rooms(id),
    justice_name TEXT NOT NULL,
    fax TEXT,
    phone TEXT,
    tel_extension TEXT,
    sergeant_name TEXT,
    clerk_names TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Create term personnel table
CREATE TABLE IF NOT EXISTS term_personnel (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    term_id UUID REFERENCES court_terms(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    extension TEXT,
    room TEXT,
    floor TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 5: Modify relocations table to reference terms
ALTER TABLE room_relocations ADD COLUMN IF NOT EXISTS term_id UUID REFERENCES court_terms(id);
ALTER TABLE room_relocations ADD COLUMN IF NOT EXISTS respect_term_assignments BOOLEAN DEFAULT true;

-- Step 6: Create index for performance
CREATE INDEX IF NOT EXISTS idx_term_assignments_term_id ON term_assignments(term_id);
CREATE INDEX IF NOT EXISTS idx_term_personnel_term_id ON term_personnel(term_id);
CREATE INDEX IF NOT EXISTS idx_term_dates ON court_terms(start_date, end_date);

-- Step 7: Set up RLS policies
ALTER TABLE court_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE court_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE term_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE term_personnel ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Allow read for authenticated users" 
ON court_terms FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Allow insert for authenticated users" 
ON court_terms FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Allow update for authenticated users" 
ON court_terms FOR UPDATE 
TO authenticated 
USING (true);

-- Similar policies for other tables
CREATE POLICY "Allow read for authenticated users" 
ON court_parts FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Allow insert for authenticated users" 
ON court_parts FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Allow read for authenticated users" 
ON term_assignments FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Allow insert for authenticated users" 
ON term_assignments FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Allow update for authenticated users" 
ON term_assignments FOR UPDATE 
TO authenticated 
USING (true);

CREATE POLICY "Allow read for authenticated users" 
ON term_personnel FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Allow insert for authenticated users" 
ON term_personnel FOR INSERT 
TO authenticated 
WITH CHECK (true);
