-- Add exam_results column to consultations table
ALTER TABLE consultations 
ADD COLUMN IF NOT EXISTS exam_results JSONB;
