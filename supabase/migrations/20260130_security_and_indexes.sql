-- ==========================================
-- MIGRACIÓN DE SEGURIDAD Y RENDIMIENTO
-- Fecha: 30 Enero 2026
-- Descripción: Índices faltantes y Políticas RLS
-- ==========================================

-- 1. LIMPIEZA PREVIA (Para evitar conflictos)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Doctors see their appointments" ON appointments;
DROP POLICY IF EXISTS "Patients see their appointments" ON appointments;
DROP POLICY IF EXISTS "Users can insert appointments" ON appointments;

-- 2. ÍNDICES DE RENDIMIENTO
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_date ON appointments(doctor_id, appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_notificaciones_user_unread ON notificaciones(user_id) WHERE leida = false;
CREATE INDEX IF NOT EXISTS idx_profiles_cedula ON profiles(cedula);

-- 3. APLICAR POLÍTICAS RLS ROBUSTAS

-- PROFILES
CREATE POLICY "Public profiles are viewable by everyone" 
ON profiles FOR SELECT 
USING ( true );

CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
USING ( auth.uid() = id );

-- APPOINTMENTS
CREATE POLICY "Doctors see their appointments" 
ON appointments FOR SELECT 
USING ( auth.uid() = doctor_id );

CREATE POLICY "Patients see their appointments" 
ON appointments FOR SELECT 
USING ( auth.uid() = patient_id );

CREATE POLICY "Users can insert appointments" 
ON appointments FOR INSERT 
WITH CHECK ( 
    auth.uid() = patient_id OR 
    auth.uid() = doctor_id
);
