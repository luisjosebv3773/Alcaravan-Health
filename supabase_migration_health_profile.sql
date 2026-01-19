-- Create the Current Health Profile table
CREATE TABLE IF NOT EXISTS public.perfil_actual_salud (
    patient_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    weight FLOAT,
    height FLOAT,
    bmi FLOAT,
    whr FLOAT,
    body_fat_pct FLOAT,
    risk_status TEXT,
    last_evaluation_id UUID REFERENCES public.nutritional_evaluations(id) ON DELETE SET NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.perfil_actual_salud ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Nutritionists can see all health profiles"
ON public.perfil_actual_salud FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() 
        AND (profiles.role = 'nutritionist' OR profiles.role = 'nutri')
    )
);

CREATE POLICY "Patients can see their own health profile"
ON public.perfil_actual_salud FOR SELECT
TO authenticated
USING (auth.uid() = patient_id);

-- Function to update the current health profile
CREATE OR REPLACE FUNCTION public.fn_sync_current_health_profile()
RETURNS TRIGGER AS $$
DECLARE
    latest_record RECORD;
    bmi_val FLOAT;
    whr_val FLOAT;
    risk_txt TEXT;
BEGIN
    -- Look for the absolute latest evaluation for this patient
    SELECT * INTO latest_record
    FROM public.nutritional_evaluations
    WHERE patient_id = NEW.patient_id
    ORDER BY created_at DESC
    LIMIT 1;

    -- If there's no record (shouldn't happen on trigger but good for robustness)
    IF latest_record IS NULL THEN
        RETURN NEW;
    END IF;

    -- Calculate BMI and WHR from the latest record metrics
    -- assuming metrics is a JSONB with {weight, height, waist, hip, body_fat, etc}
    IF (latest_record.metrics->>'height')::FLOAT > 0 THEN
        bmi_val := (latest_record.metrics->>'weight')::FLOAT / ((latest_record.metrics->>'height')::FLOAT / 100 * (latest_record.metrics->>'height')::FLOAT / 100);
    ELSE
        bmi_val := 0;
    END IF;

    IF (latest_record.metrics->>'hip')::FLOAT > 0 THEN
        whr_val := (latest_record.metrics->>'waist')::FLOAT / (latest_record.metrics->>'hip')::FLOAT;
    ELSE
        whr_val := 0;
    END IF;

    -- Logic for Risk Status (example based on WHR and BMI)
    IF whr_val > 0.95 OR bmi_val > 30 THEN
        risk_txt := 'Alto';
    ELSIF whr_val > 0.85 OR bmi_val > 25 THEN
        risk_txt := 'Moderado';
    ELSE
        risk_txt := 'Bajo';
    END IF;

    -- Update or Insert the current profile
    INSERT INTO public.perfil_actual_salud (
        patient_id,
        weight,
        height,
        bmi,
        whr,
        body_fat_pct,
        risk_status,
        last_evaluation_id,
        updated_at
    )
    VALUES (
        latest_record.patient_id,
        (latest_record.metrics->>'weight')::FLOAT,
        (latest_record.metrics->>'height')::FLOAT,
        bmi_val,
        whr_val,
        (latest_record.metrics->>'body_fat')::FLOAT,
        risk_txt,
        latest_record.id,
        latest_record.created_at
    )
    ON CONFLICT (patient_id) DO UPDATE SET
        weight = EXCLUDED.weight,
        height = EXCLUDED.height,
        bmi = EXCLUDED.bmi,
        whr = EXCLUDED.whr,
        body_fat_pct = EXCLUDED.body_fat_pct,
        risk_status = EXCLUDED.risk_status,
        last_evaluation_id = EXCLUDED.last_evaluation_id,
        updated_at = EXCLUDED.updated_at;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to keep current health profile in sync
DROP TRIGGER IF EXISTS tr_sync_health_profile ON public.nutritional_evaluations;
CREATE TRIGGER tr_sync_health_profile
AFTER INSERT OR UPDATE ON public.nutritional_evaluations
FOR EACH ROW EXECUTE FUNCTION public.fn_sync_current_health_profile();
