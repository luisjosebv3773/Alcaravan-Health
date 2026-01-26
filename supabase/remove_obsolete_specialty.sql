-- Migración: Eliminar campo specialty redundante de profiles
-- Esta columna ha sido reemplazada por la tabla relacional doctor_specialties

ALTER TABLE profiles DROP COLUMN IF EXISTS specialty;
