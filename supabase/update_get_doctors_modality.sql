-- ============================================================
-- ACTUALIZACIÓN DE FUNCIÓN GET_DOCTORS
-- ============================================================
-- Se actualiza la función para incluir el campo consultation_modality
-- necesario para el filtrado dinámico en la solicitud de citas.

-- Nota: Es indispensable eliminar la función previa ya que el tipo de retorno cambia
DROP FUNCTION IF EXISTS get_doctors();

CREATE OR REPLACE FUNCTION get_doctors()
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  specialty TEXT,
  consultation_modality TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.full_name,
    s.name as specialty,
    p.consultation_modality
  FROM profiles p
  JOIN doctor_specialties ds ON p.id = ds.doctor_id
  JOIN specialties s ON ds.specialty_id = s.id
  WHERE (p.role = 'doctor' OR p.role = 'nutri' OR p.role = 'nutritionist');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
