-- Create specialties table if it doesn't exist
CREATE TABLE IF NOT EXISTS specialties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on specialties (viewable by everyone)
ALTER TABLE specialties ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Specialties are viewable by everyone" ON specialties;
CREATE POLICY "Specialties are viewable by everyone" ON specialties FOR SELECT USING (true);

-- Create junction table for Many-to-Many relationship
CREATE TABLE IF NOT EXISTS doctor_specialties (
  doctor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  specialty_id UUID REFERENCES specialties(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (doctor_id, specialty_id)
);

-- Enable RLS on junction table
ALTER TABLE doctor_specialties ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Doctor specialties viewable by everyone" ON doctor_specialties;
CREATE POLICY "Doctor specialties viewable by everyone" ON doctor_specialties FOR SELECT USING (true);
DROP POLICY IF EXISTS "Doctors can insert their own specialties" ON doctor_specialties;
CREATE POLICY "Doctors can insert their own specialties" ON doctor_specialties FOR INSERT WITH CHECK (auth.uid() = doctor_id);

-- Seed some standard specialties
INSERT INTO specialties (name) VALUES 
('Medicina General'), 
('Nutrición'), 
('Cardiología'), 
('Pediatría'), 
('Ginecología'), 
('Dermatología'), 
('Psicología'),
('Traumatología'),
('Oftalmología')
ON CONFLICT (name) DO NOTHING;

-- Update get_doctors function to return flattened list (one row per doctor-specialty pair)
-- This allows the frontend to easily filter doctors by specialty
CREATE OR REPLACE FUNCTION get_doctors()
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  specialty TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.full_name,
    s.name as specialty
  FROM profiles p
  JOIN doctor_specialties ds ON p.id = ds.doctor_id
  JOIN specialties s ON ds.specialty_id = s.id
  WHERE (p.role = 'doctor' OR p.role = 'nutri' OR p.role = 'nutritionist');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
