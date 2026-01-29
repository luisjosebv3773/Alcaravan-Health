-- 1. Crear tipo enumerado para el estado de verificación
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'verification_status_type') THEN
        CREATE TYPE verification_status_type AS ENUM ('none', 'pending', 'approved', 'rejected');
    END IF;
END $$;

-- 2. Añadir columna de estado a profiles (si no existe)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS verification_status verification_status_type DEFAULT 'none';

-- 3. Crear tabla de solicitudes de verificación
CREATE TABLE IF NOT EXISTS public.verification_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    professional_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    documents_url TEXT[],
    mpps_registry TEXT,
    college_number TEXT,
    bio TEXT,
    status verification_status_type DEFAULT 'pending',
    admin_feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Habilitar RLS
ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;

-- 5. Políticas: Usuario puede ver su propia solicitud
DROP POLICY IF EXISTS "Users can view their own verification requests" ON public.verification_requests;
CREATE POLICY "Users can view their own verification requests" 
ON public.verification_requests FOR SELECT 
TO authenticated 
USING (auth.uid() = professional_id);

-- 5b. Política: Usuario puede insertar su propia solicitud
DROP POLICY IF EXISTS "Users can insert their own verification requests" ON public.verification_requests;
CREATE POLICY "Users can insert their own verification requests" 
ON public.verification_requests FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = professional_id);

-- 5c. Política: Usuario puede actualizar su propia solicitud (si está en estado pendiente o rechazada)
DROP POLICY IF EXISTS "Users can update their own verification requests" ON public.verification_requests;
CREATE POLICY "Users can update their own verification requests" 
ON public.verification_requests FOR UPDATE 
TO authenticated 
USING (auth.uid() = professional_id)
WITH CHECK (auth.uid() = professional_id);

-- 6. Políticas: Admin puede ver todas y actualizar
DROP POLICY IF EXISTS "Admins can manage all verification requests" ON public.verification_requests;
CREATE POLICY "Admins can manage all verification requests" 
ON public.verification_requests FOR ALL 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);

-- 7. Trigger para actualizar verification_status en profiles automáticamente
CREATE OR REPLACE FUNCTION fn_sync_verification_profile_status()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.profiles 
    SET 
        verification_status = NEW.status,
        is_verified = (NEW.status = 'approved')
    WHERE id = NEW.professional_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Borrar trigger si ya existe para evitar errores al re-ejecutar
DROP TRIGGER IF EXISTS tr_sync_verification_status ON public.verification_requests;
CREATE TRIGGER tr_sync_verification_status
AFTER INSERT OR UPDATE OF status ON public.verification_requests
FOR EACH ROW EXECUTE FUNCTION fn_sync_verification_profile_status();
