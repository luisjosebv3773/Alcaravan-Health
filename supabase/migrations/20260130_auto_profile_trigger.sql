-- ==========================================
-- AUTOMATIZACIÓN DE PERFILES (TRIGGER)
-- Fecha: 30 Enero 2026
-- Descripción: Crea automáticamente un perfil público cada vez que un usuario se registra.
-- ==========================================

-- 1. Función Maestra de Creación de Perfil
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    full_name, 
    role, 
    cedula, 
    birth_date,
    created_at,
    updated_at
  )
  VALUES (
    new.id,
    new.email,
    -- Extraer datos desde los metadatos enviados por el frontend (supabase.auth.signUp)
    new.raw_user_meta_data->>'full_name',
    -- Default 'paciente' si no viene rol, o si intentan inyectar algo raro (opcionalmente podrías validar aquí)
    COALESCE(new.raw_user_meta_data->>'role', 'paciente'),
    new.raw_user_meta_data->>'cedula',
    -- Casting seguro de fecha (si viene nula, queda nula)
    (new.raw_user_meta_data->>'birth_date')::date,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING; -- Si por alguna razón extraña ya existe, no fallar.
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Conectar el Trigger a la tabla auth.users
-- Primero borramos si existe para evitar duplicados al reinstalar
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ==========================================
-- EXPLICACIÓN PARA EL DESARROLLADOR:
-- Ahora, en tu Frontend (Register.tsx), cuando llamas a:
-- supabase.auth.signUp({
--    options: { data: { full_name: 'Juan', role: 'doctor', ... } }
-- })
-- Este trigger interceptará esos datos y llenará la tabla 'profiles' automáticamente.
-- ==========================================
