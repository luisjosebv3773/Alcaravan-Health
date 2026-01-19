-- SQL para corregir permisos de la tabla de notificaciones
-- Ejecuta esto en el SQL Editor de Supabase para permitir que los pacientes notifiquen a sus doctores

-- 1. Asegurarse de que RLS esté habilitado
ALTER TABLE public.notificaciones ENABLE ROW LEVEL SECURITY;

-- 2. Eliminar políticas existentes si es necesario para evitar conflictos
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notificaciones;
DROP POLICY IF EXISTS "Users can insert notifications for others" ON public.notificaciones;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notificaciones;

-- 3. Crear política para ver sus propias notificaciones (RECEPTOR)
CREATE POLICY "Users can view their own notifications"
ON public.notificaciones
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 4. Crear política para INSERTAR notificaciones
-- Esto permite que el emisor (ej. paciente) cree una entrada para el receptor (ej. doctor)
CREATE POLICY "Users can insert notifications for others"
ON public.notificaciones
FOR INSERT
TO authenticated
WITH CHECK (true); 

-- 5. Crear política para marcar como leída (solo el receptor puede editar)
CREATE POLICY "Users can update their own notifications"
ON public.notificaciones
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Opcional: Si quieres que sea más restrictivo, podrías validar roles
-- pero 'authenticated' + 'CHECK (true)' es lo más común para sistemas de mensajería/notificación simple
