-- ==========================================================
-- MIGRACIÓN MAESTRA (ULTRA-ROBUSTA): SOLUCIÓN DEFINITIVA
-- Instrucciones: Ejecuta este script íntegro en el SQL Editor de Supabase
-- ==========================================================

-- 1. PREPARACIÓN: Asegurar que la tabla vieja tenga todas las columnas antes de mover nada
-- Esto evita errores de "columna no existe" al hacer el JOIN
DO $$ 
BEGIN 
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'perfil_actual_salud') THEN
        ALTER TABLE public.perfil_actual_salud ADD COLUMN IF NOT EXISTS blood_type TEXT;
        ALTER TABLE public.perfil_actual_salud ADD COLUMN IF NOT EXISTS allergies TEXT;
        ALTER TABLE public.perfil_actual_salud ADD COLUMN IF NOT EXISTS medical_history TEXT;
        ALTER TABLE public.perfil_actual_salud ADD COLUMN IF NOT EXISTS family_history TEXT;
        ALTER TABLE public.perfil_actual_salud ADD COLUMN IF NOT EXISTS medications TEXT;
        ALTER TABLE public.perfil_actual_salud ADD COLUMN IF NOT EXISTS weight FLOAT;
        ALTER TABLE public.perfil_actual_salud ADD COLUMN IF NOT EXISTS height FLOAT;
        ALTER TABLE public.perfil_actual_salud ADD COLUMN IF NOT EXISTS bmi FLOAT;
        ALTER TABLE public.perfil_actual_salud ADD COLUMN IF NOT EXISTS whr FLOAT;
        ALTER TABLE public.perfil_actual_salud ADD COLUMN IF NOT EXISTS muscle_mass_kg FLOAT;
        ALTER TABLE public.perfil_actual_salud ADD COLUMN IF NOT EXISTS body_fat_pct FLOAT;
        ALTER TABLE public.perfil_actual_salud ADD COLUMN IF NOT EXISTS body_water_pct FLOAT;
        ALTER TABLE public.perfil_actual_salud ADD COLUMN IF NOT EXISTS protein_pct FLOAT;
        ALTER TABLE public.perfil_actual_salud ADD COLUMN IF NOT EXISTS bmr_kcal FLOAT;
        ALTER TABLE public.perfil_actual_salud ADD COLUMN IF NOT EXISTS visceral_fat_level FLOAT;
        ALTER TABLE public.perfil_actual_salud ADD COLUMN IF NOT EXISTS risk_status TEXT;
        ALTER TABLE public.perfil_actual_salud ADD COLUMN IF NOT EXISTS last_evaluation_id UUID;
    END IF;
END $$;

-- 2. CREACIÓN: Nueva tabla con el ORDEN EXACTO y TODAS las columnas
CREATE TABLE IF NOT EXISTS public.perfil_actual_salud_nueva (
    patient_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    blood_type TEXT,
    allergies TEXT,
    medical_history TEXT,
    family_history TEXT,
    medications TEXT,
    weight FLOAT,
    height FLOAT,
    bmi FLOAT,
    whr FLOAT,
    muscle_mass_kg FLOAT,
    body_fat_pct FLOAT,
    body_water_pct FLOAT,
    protein_pct FLOAT,
    bmr_kcal FLOAT,
    visceral_fat_level FLOAT,
    risk_status TEXT,
    last_evaluation_id UUID REFERENCES public.nutritional_evaluations(id) ON DELETE SET NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. MIGRACIÓN: Consolidar datos desde profiles o perfil_actual_salud (donde sea que estén)
DO $$
BEGIN
    -- Intentar mover datos de profiles a la nueva si las columnas existen aún
    EXECUTE 'INSERT INTO public.perfil_actual_salud_nueva (patient_id, blood_type, allergies, medical_history, family_history, medications) 
             SELECT id, blood_type, allergies, medical_history, family_history, medications FROM public.profiles
             ON CONFLICT (patient_id) DO NOTHING';
EXCEPTION WHEN OTHERS THEN 
    -- Si falló es porque ya no están en profiles, lo cual es normal si ya corrió parte del script
    NULL;
END $$;

-- Ahora actualizar con los datos de la tabla de salud (biométricos y clínicos ya migrados)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'perfil_actual_salud') THEN
        UPDATE public.perfil_actual_salud_nueva n
        SET 
            blood_type = COALESCE(o.blood_type, n.blood_type),
            allergies = COALESCE(o.allergies, n.allergies),
            medical_history = COALESCE(o.medical_history, n.medical_history),
            family_history = COALESCE(o.family_history, n.family_history),
            medications = COALESCE(o.medications, n.medications),
            weight = o.weight,
            height = o.height,
            bmi = o.bmi,
            whr = o.whr,
            muscle_mass_kg = o.muscle_mass_kg,
            body_fat_pct = o.body_fat_pct,
            body_water_pct = o.body_water_pct,
            protein_pct = o.protein_pct,
            bmr_kcal = o.bmr_kcal,
            visceral_fat_level = o.visceral_fat_level,
            risk_status = o.risk_status,
            last_evaluation_id = o.last_evaluation_id,
            updated_at = COALESCE(o.updated_at, now())
        FROM public.perfil_actual_salud o
        WHERE n.patient_id = o.patient_id;
    END IF;
END $$;

-- 4. FINALIZACIÓN: Intercambiar tablas y limpiar
DROP TABLE IF EXISTS public.perfil_actual_salud CASCADE;
ALTER TABLE public.perfil_actual_salud_nueva RENAME TO perfil_actual_salud;

-- Limpiar columnas sobrantes en profiles si aún existen
ALTER TABLE public.profiles DROP COLUMN IF EXISTS blood_type;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS allergies;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS medical_history;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS family_history;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS medications;

-- 5. SEGURIDAD Y AUTOMATIZACIÓN (RLS)
ALTER TABLE public.perfil_actual_salud ENABLE ROW LEVEL SECURITY;

-- Política: Nutricionistas, Doctores y Nutris pueden hacer TODO (SELECT, INSERT, UPDATE)
DROP POLICY IF EXISTS "Professionals can manage health profiles" ON public.perfil_actual_salud;
CREATE POLICY "Professionals can manage health profiles" ON public.perfil_actual_salud 
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() 
        AND (profiles.role IN ('nutritionist', 'nutri', 'doctor'))
    )
);

-- Política: Pacientes pueden ver y actualizar su propio perfil
DROP POLICY IF EXISTS "Patients can manage their own health profile" ON public.perfil_actual_salud;
CREATE POLICY "Patients can manage their own health profile" ON public.perfil_actual_salud 
FOR ALL TO authenticated
USING (auth.uid() = patient_id)
WITH CHECK (auth.uid() = patient_id);

-- Sincronización automática de métricas
CREATE OR REPLACE FUNCTION public.fn_sync_current_health_profile()
RETURNS TRIGGER AS $$
DECLARE
    latest_record RECORD;
    bmi_val FLOAT;
    whr_val FLOAT;
    risk_txt TEXT;
BEGIN
    SELECT * INTO latest_record FROM public.nutritional_evaluations WHERE patient_id = NEW.patient_id ORDER BY created_at DESC LIMIT 1;
    IF latest_record IS NULL THEN RETURN NEW; END IF;
    IF (latest_record.metrics->>'height')::FLOAT > 0 THEN bmi_val := (latest_record.metrics->>'weight')::FLOAT / ((latest_record.metrics->>'height')::FLOAT / 100 * (latest_record.metrics->>'height')::FLOAT / 100); ELSE bmi_val := 0; END IF;
    IF (latest_record.metrics->>'hip')::FLOAT > 0 THEN whr_val := (latest_record.metrics->>'waist')::FLOAT / (latest_record.metrics->>'hip')::FLOAT; ELSE whr_val := 0; END IF;
    IF whr_val > 0.95 OR bmi_val > 30 THEN risk_txt := 'Alto'; ELSIF whr_val > 0.85 OR bmi_val > 25 THEN risk_txt := 'Moderado'; ELSE risk_txt := 'Bajo'; END IF;
    INSERT INTO public.perfil_actual_salud (patient_id, weight, height, bmi, whr, muscle_mass_kg, body_fat_pct, body_water_pct, protein_pct, bmr_kcal, visceral_fat_level, risk_status, last_evaluation_id, updated_at)
    VALUES (latest_record.patient_id, (latest_record.metrics->>'weight')::FLOAT, (latest_record.metrics->>'height')::FLOAT, bmi_val, whr_val, (latest_record.metrics->>'muscle_mass')::FLOAT, (latest_record.metrics->>'body_fat')::FLOAT, (latest_record.metrics->>'body_water')::FLOAT, (latest_record.metrics->>'protein')::FLOAT, (latest_record.metrics->>'bmr')::FLOAT, (latest_record.metrics->>'visceral_fat')::FLOAT, risk_txt, latest_record.id, latest_record.created_at)
    ON CONFLICT (patient_id) DO UPDATE SET weight = EXCLUDED.weight, height = EXCLUDED.height, bmi = EXCLUDED.bmi, whr = EXCLUDED.whr, muscle_mass_kg = EXCLUDED.muscle_mass_kg, body_fat_pct = EXCLUDED.body_fat_pct, body_water_pct = EXCLUDED.body_water_pct, protein_pct = EXCLUDED.protein_pct, bmr_kcal = EXCLUDED.bmr_kcal, visceral_fat_level = EXCLUDED.visceral_fat_level, risk_status = EXCLUDED.risk_status, last_evaluation_id = EXCLUDED.last_evaluation_id, updated_at = EXCLUDED.updated_at;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_sync_health_profile ON public.nutritional_evaluations;
CREATE TRIGGER tr_sync_health_profile AFTER INSERT OR UPDATE ON public.nutritional_evaluations FOR EACH ROW EXECUTE FUNCTION public.fn_sync_current_health_profile();
