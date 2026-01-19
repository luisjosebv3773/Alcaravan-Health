-- Enable RLS on appointments table just in case (usually already on)
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Policy to allow Doctors to create (INSERT) appointments assigned to themselves
-- This enables the "Programar Cita" functionality for doctors
CREATE POLICY "Doctors can create appointments"
ON appointments
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = doctor_id);

-- Policy to allow Doctors to update appointments assigned to themselves
-- Useful for changing status, rescheduling, etc.
CREATE POLICY "Doctors can update their appointments"
ON appointments
FOR UPDATE
TO authenticated
USING (auth.uid() = doctor_id)
WITH CHECK (auth.uid() = doctor_id);
