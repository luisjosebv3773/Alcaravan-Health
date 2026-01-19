-- 1. Asegurar campos en profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS fcm_token TEXT;

-- 2. Crear tabla de notificaciones si no existe
CREATE TABLE IF NOT EXISTS public.notificaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    titulo TEXT NOT NULL,
    mensaje TEXT NOT NULL,
    tipo TEXT,
    leida BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Habilitar RLS
ALTER TABLE public.notificaciones ENABLE ROW LEVEL SECURITY;

-- 4. Limpiar políticas anteriores
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notificaciones;
DROP POLICY IF EXISTS "Users can insert notifications" ON public.notificaciones;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notificaciones;

-- 5. Crear políticas
CREATE POLICY "Users can view own notifications" 
ON public.notificaciones FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert notifications" 
ON public.notificaciones FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Users can update own notifications" 
ON public.notificaciones FOR UPDATE 
USING (auth.uid() = user_id);

-- 6. Función para enviar notificación vía Edge Function (Webhook)
-- Nota: Debes reemplazar <PROJECT_REF> con tu ID de proyecto de Supabase
-- CREATE OR REPLACE FUNCTION public.notify_via_fcm()
-- RETURNS TRIGGER AS $$
-- BEGIN
--   PERFORM
--     net.http_post(
--       url := 'https://<PROJECT_REF>.functions.supabase.co/send-fcm',
--       headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'),
--       body := jsonb_build_object('record', row_to_json(NEW))
--     );
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql SECURITY DEFINER;

-- CREATE TRIGGER on_notification_created
--   AFTER INSERT ON public.notificaciones
--   FOR EACH ROW EXECUTE FUNCTION public.notify_via_fcm();
