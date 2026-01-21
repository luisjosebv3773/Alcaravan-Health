-- 1. Ensure all existing specialties in 'profiles' are present in the 'specialties' table
INSERT INTO specialties (name)
SELECT DISTINCT specialty
FROM profiles
WHERE specialty IS NOT NULL AND specialty != ''
ON CONFLICT (name) DO NOTHING;

-- 2. Backfill the doctor_specialties junction table
-- This maps existing doctors to their specialties in the new table
INSERT INTO doctor_specialties (doctor_id, specialty_id)
SELECT p.id, s.id
FROM profiles p
JOIN specialties s ON s.name = p.specialty
WHERE p.specialty IS NOT NULL AND p.specialty != ''
-- Only insert if the link doesn't already exist
AND NOT EXISTS (
    SELECT 1 
    FROM doctor_specialties ds 
    WHERE ds.doctor_id = p.id AND ds.specialty_id = s.id
);

-- 3. Verify the get_doctors function is up to date (re-applying just in case)
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
