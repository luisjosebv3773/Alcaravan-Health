-- Update get_doctors function to only show verified professionals
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
  WHERE (p.role = 'doctor' OR p.role = 'nutri' OR p.role = 'nutritionist')
  AND p.is_verified = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
