-- ============================================================
-- MIGRACIÓN CRÍTICA: Corrección de Error de Registro
-- ============================================================
-- Este script debe ejecutarse en Supabase SQL Editor para corregir
-- el error "Database error saving new user" en producción

-- PASO 1: Hacer nullable la columna specialty en profiles (si existe)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'specialty'
    ) THEN
        ALTER TABLE profiles ALTER COLUMN specialty DROP NOT NULL;
    END IF;
END $$;

-- PASO 2: Hacer nullable la columna specialty en appointments (si existe)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'appointments' AND column_name = 'specialty'
    ) THEN
        ALTER TABLE appointments ALTER COLUMN specialty DROP NOT NULL;
    END IF;
END $$;

-- PASO 3: Eliminar la columna specialty de profiles
ALTER TABLE profiles DROP COLUMN IF EXISTS specialty;

-- PASO 4: Eliminar la columna specialty de appointments
ALTER TABLE appointments DROP COLUMN IF EXISTS specialty;

-- PASO 5: Verificar que no haya triggers rotos
-- Si existe un trigger que inserta en profiles, asegurarse que no incluya specialty
-- Puedes verificar los triggers con:
-- SELECT * FROM information_schema.triggers WHERE event_object_table = 'profiles';

-- NOTA: Si tienes un trigger handle_new_user o similar, asegúrate de que 
-- NO intente insertar el campo specialty. Si es necesario, recréalo sin ese campo.
