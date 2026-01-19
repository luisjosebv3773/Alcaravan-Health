-- Create nutritional_evaluations table
CREATE TABLE IF NOT EXISTS nutritional_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES profiles(id) NOT NULL,
    nutritionist_id UUID REFERENCES profiles(id) NOT NULL,
    metrics JSONB NOT NULL,
    habits JSONB NOT NULL,
    sleep_stress JSONB NOT NULL,
    diet_habits JSONB NOT NULL,
    physical_activity JSONB NOT NULL,
    medical_history JSONB NOT NULL,
    ai_summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE nutritional_evaluations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Nutritionists can manage evaluations" ON nutritional_evaluations;
CREATE POLICY "Nutritionists can manage evaluations" 
ON nutritional_evaluations 
FOR ALL
USING ( auth.uid() = nutritionist_id )
WITH CHECK ( auth.uid() = nutritionist_id );

DROP POLICY IF EXISTS "Patients can view their evaluations" ON nutritional_evaluations;
CREATE POLICY "Patients can view their evaluations" 
ON nutritional_evaluations FOR SELECT
USING ( auth.uid() = patient_id );
