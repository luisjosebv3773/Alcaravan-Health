-- ============================================================
-- CORRECCIÓN DEL TRIGGER DE REGISTRO DE USUARIOS
-- ============================================================
-- Este script recrea el trigger correcto para manejar nuevos usuarios

-- PASO 0: Actualizar la restricción de roles para permitir 'admin'
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('paciente', 'doctor', 'nutri', 'nutritionist', 'admin'));

-- PASO 1: Eliminar el trigger existente si hay alguno
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- PASO 2: Eliminar la función existente
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- PASO 3: Crear la función correcta (SIN el campo specialty)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    full_name,
    email,
    role,
    created_at
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'paciente'), -- Roles: paciente, doctor, nutri, admin
    NOW()
  );
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PASO 4: Recrear el trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- PASO 5: Verificar que el trigger se creó correctamente
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
