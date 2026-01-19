-- Create consultations table to store clinical data
CREATE TABLE IF NOT EXISTS consultations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID REFERENCES appointments(id) NOT NULL UNIQUE,
    doctor_id UUID REFERENCES profiles(id) NOT NULL,
    patient_id UUID REFERENCES profiles(id) NOT NULL,
    reason TEXT,
    current_illness TEXT,
    vital_signs JSONB,
    diagnosis TEXT,
    diagnosis_type TEXT, -- 'presuntivo', 'definitivo'
    internal_notes TEXT,
    prescription JSONB,
    exams_requested JSONB,
    medical_rest JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies for consultations
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;

-- Doctors can view and insert/update consultations they created
DROP POLICY IF EXISTS "Doctors can manage their consultations" ON consultations;
CREATE POLICY "Doctors can manage their consultations" 
ON consultations 
USING ( auth.uid() = doctor_id )
WITH CHECK ( auth.uid() = doctor_id );

-- Patients can view their own consultations
DROP POLICY IF EXISTS "Patients can view their consultations" ON consultations;
CREATE POLICY "Patients can view their consultations" 
ON consultations FOR SELECT
USING ( auth.uid() = patient_id );
