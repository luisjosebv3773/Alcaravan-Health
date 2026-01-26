-- ============================================================
-- DIAGNÓSTICO Y CORRECCIÓN DE TRIGGER DE REGISTRO
-- ============================================================
-- Ejecuta este script para identificar y corregir el problema

-- PASO 1: Ver todos los triggers en la tabla auth.users
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'auth' 
   OR event_object_table IN ('profiles', 'users');

-- PASO 2: Ver las funciones relacionadas con usuarios
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines
WHERE routine_name LIKE '%user%' 
   OR routine_name LIKE '%profile%'
   AND routine_schema = 'public';

-- PASO 3: Verificar la estructura actual de la tabla profiles
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;
