-- 1. Fix Appointment Status Check
-- First, drop the constraint if it exists
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_status_check;

-- Add the updated constraint including 'no-show'
ALTER TABLE appointments ADD CONSTRAINT appointments_status_check 
CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no-show'));

-- 2. Make Profiles policies idempotent (No errors even if they already exist)
DO $$
BEGIN
    -- Policy: Public profiles are viewable by everyone
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Public profiles are viewable by everyone' AND tablename = 'profiles'
    ) THEN
        CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING ( true );
    END IF;

    -- Policy: Users can insert their own profile
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert their own profile' AND tablename = 'profiles'
    ) THEN
        CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK ( auth.uid() = id );
    END IF;

    -- Policy: Users can update own profile
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own profile' AND tablename = 'profiles'
    ) THEN
        CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING ( auth.uid() = id );
    END IF;
END $$;

-- 3. Make Appointments manage policies idempotent
DROP POLICY IF EXISTS "Doctors can create appointments" ON appointments;
CREATE POLICY "Doctors can create appointments"
ON appointments FOR INSERT TO authenticated WITH CHECK (auth.uid() = doctor_id);

DROP POLICY IF EXISTS "Doctors can update their appointments" ON appointments;
CREATE POLICY "Doctors can update their appointments"
ON appointments FOR UPDATE TO authenticated USING (auth.uid() = doctor_id) WITH CHECK (auth.uid() = doctor_id);
