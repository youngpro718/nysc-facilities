-- Create court_terms table to store term information
CREATE TABLE IF NOT EXISTS court_terms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  term_number TEXT NOT NULL,
  title TEXT NOT NULL,
  location TEXT,
  date_period TEXT,
  building_id UUID REFERENCES buildings(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create court_assignments table to store judge and room assignments
CREATE TABLE IF NOT EXISTS court_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  term_id UUID NOT NULL REFERENCES court_terms(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  part TEXT NOT NULL,
  part_details TEXT, -- For storing multiple parts like "TAP A, TAPG, GWP1"
  calendar_day TEXT, -- For storing calendar day info (Monday, Tuesday, etc.)
  justice TEXT NOT NULL,
  fax TEXT,
  tel TEXT,
  sergeant TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(term_id, room_id, part)
);

-- Create court_clerks table to store clerk assignments
CREATE TABLE IF NOT EXISTS court_clerks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  term_id UUID NOT NULL REFERENCES court_terms(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create court_staff table for administrative staff
CREATE TABLE IF NOT EXISTS court_staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  term_id UUID NOT NULL REFERENCES court_terms(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add row level security policies
ALTER TABLE court_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE court_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE court_clerks ENABLE ROW LEVEL SECURITY;
ALTER TABLE court_staff ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Court terms are viewable by all authenticated users"
  ON court_terms FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Court terms are insertable by admins"
  ON court_terms FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Court terms are updatable by admins"
  ON court_terms FOR UPDATE
  USING (auth.role() = 'authenticated' AND EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Court terms are deletable by admins"
  ON court_terms FOR DELETE
  USING (auth.role() = 'authenticated' AND EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- Similar policies for other tables
CREATE POLICY "Court assignments are viewable by all authenticated users"
  ON court_assignments FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Court assignments are insertable by admins"
  ON court_assignments FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Court clerks are viewable by all authenticated users"
  ON court_clerks FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Court clerks are insertable by admins"
  ON court_clerks FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Court staff are viewable by all authenticated users"
  ON court_staff FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Court staff are insertable by admins"
  ON court_staff FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- Create functions for transaction management if they don't exist
CREATE OR REPLACE FUNCTION begin_transaction()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- This is a placeholder as Supabase doesn't directly support explicit transactions via API
  -- The actual transaction is handled by the client
  NULL;
END;
$$;

CREATE OR REPLACE FUNCTION commit_transaction()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- This is a placeholder as Supabase doesn't directly support explicit transactions via API
  -- The actual transaction is handled by the client
  NULL;
END;
$$;

CREATE OR REPLACE FUNCTION rollback_transaction()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- This is a placeholder as Supabase doesn't directly support explicit transactions via API
  -- The actual transaction is handled by the client
  NULL;
END;
$$;
