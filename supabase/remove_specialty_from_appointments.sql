-- Migración: Eliminar campo specialty de appointments
-- Esta columna es redundante ya que la especialidad se obtiene del doctor
-- a través de la tabla relacional doctor_specialties

-- Primero hacemos la columna nullable para evitar errores
ALTER TABLE appointments ALTER COLUMN specialty DROP NOT NULL;

-- Luego eliminamos la columna
ALTER TABLE appointments DROP COLUMN IF EXISTS specialty;
