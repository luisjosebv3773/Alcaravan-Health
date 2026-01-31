-- ==========================================
-- NORMALIZACIÓN DE CONSULTAS MÉDICAS + MIGRACIÓN DE DATOS
-- Fecha: 30 Enero 2026
-- Descripción: 
-- 1. Crea columnas planas para signos vitales.
-- 2. Crea tabla de recetas.
-- 3. MIGRA AUTOMÁTICAMENTE los datos JSON viejos a las nuevas columnas.
-- ==========================================

-- 1. Modificar tabla consultations (Signos Vitales)
ALTER TABLE consultations 
ADD COLUMN IF NOT EXISTS weight_kg numeric(5,2),
ADD COLUMN IF NOT EXISTS height_cm numeric(5,2),
ADD COLUMN IF NOT EXISTS bp_systolic integer,
ADD COLUMN IF NOT EXISTS bp_diastolic integer,
ADD COLUMN IF NOT EXISTS heart_rate integer,
ADD COLUMN IF NOT EXISTS respiratory_rate integer,
ADD COLUMN IF NOT EXISTS temp_c numeric(3,1),
ADD COLUMN IF NOT EXISTS oxygen_sat integer;

-- 2. MIGRACIÓN DE DATOS (Signos Vitales)
-- Extraemos del JSON 'vital_signs' y casteamos a tipos correctos.
-- Nota: Usamos NULLIF para manejar strings vacíos que podrían causar error al castear.

UPDATE consultations
SET 
    -- Tensión (formato "120/80")
    bp_systolic = CASE 
        WHEN vital_signs->>'ta' LIKE '%/%' THEN SPLIT_PART(vital_signs->>'ta', '/', 1)::integer 
        ELSE NULL 
    END,
    bp_diastolic = CASE 
        WHEN vital_signs->>'ta' LIKE '%/%' THEN SPLIT_PART(vital_signs->>'ta', '/', 2)::integer 
        ELSE NULL 
    END,
    
    -- Frecuencia Cardiaca
    heart_rate = NULLIF(REGEXP_REPLACE(vital_signs->>'fc', '[^0-9]', '', 'g'), '')::integer,
    
    -- Temperatura (Reemplazamos coma por punto para decimales)
    temp_c = NULLIF(REPLACE(vital_signs->>'temp', ',', '.'), '')::numeric,
    
    -- Saturación
    oxygen_sat = NULLIF(REGEXP_REPLACE(vital_signs->>'spo2', '[^0-9]', '', 'g'), '')::integer

WHERE vital_signs IS NOT NULL 
  AND (weight_kg IS NULL AND bp_systolic IS NULL); -- Solo migrar si no se ha migrado ya

-- 3. Crear tabla de Recetas (Prescriptions)
CREATE TABLE IF NOT EXISTS prescriptions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    consultation_id uuid REFERENCES consultations(id) ON DELETE CASCADE NOT NULL,
    medication_name text NOT NULL,
    dosage text, 
    frequency text,
    duration text, 
    notes text,
    created_at timestamptz DEFAULT now()
);

-- 4. Índices y Seguridad para Recetas
CREATE INDEX IF NOT EXISTS idx_prescriptions_consultation ON prescriptions(consultation_id);
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;

-- Política: Visualización
DROP POLICY IF EXISTS "Users can view prescriptions related to their consultations" ON prescriptions;
CREATE POLICY "Users can view prescriptions related to their consultations"
ON prescriptions FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM consultations c
        WHERE c.id = prescriptions.consultation_id
        AND (c.doctor_id = auth.uid() OR c.patient_id = auth.uid())
    )
);

-- Política: Creación (Doctores)
DROP POLICY IF EXISTS "Doctors can insert prescriptions" ON prescriptions;
CREATE POLICY "Doctors can insert prescriptions"
ON prescriptions FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM consultations c
        WHERE c.id = prescriptions.consultation_id
        AND c.doctor_id = auth.uid()
    )
);

-- Política: Eliminación (Doctores)
DROP POLICY IF EXISTS "Doctors can delete prescriptions" ON prescriptions;
CREATE POLICY "Doctors can delete prescriptions"
ON prescriptions FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM consultations c
        WHERE c.id = prescriptions.consultation_id
        AND c.doctor_id = auth.uid()
    )
);
