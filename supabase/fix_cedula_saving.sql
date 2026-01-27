-- ============================================================
-- CORRECCIÓN: Guardado de Cédula y Fecha de Nacimiento
-- ============================================================
-- Este script asegura que la cédula y fecha de nacimiento se guarden
-- correctamente en la tabla profiles al momento del registro.

-- PASO 1: Asegurar que las columnas existan en public.profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cedula TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS birth_date DATE;

-- PASO 2: Actualizar la función handle_new_user para capturar estos campos
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    full_name,
    email,
    role,
    cedula,
    birth_date,
    created_at
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'paciente'),
    NEW.raw_user_meta_data->>'cedula',
    (NEW.raw_user_meta_data->>'birth_date')::DATE,
    NOW()
  );
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- En caso de error, el trigger no debe bloquear el registro de auth.users
    -- pero se registrará en los logs de Supabase
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PASO 3: Asegurar que el trigger esté activo (por si acaso fue desactivado)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'on_auth_user_created'
    ) THEN
        CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW
        EXECUTE FUNCTION public.handle_new_user();
    END IF;
END $$;

-- PASO 4: Crear o actualizar la función de verificación de cédula para el registro
CREATE OR REPLACE FUNCTION public.check_cedula(cedula_input TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles WHERE cedula = cedula_input
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
