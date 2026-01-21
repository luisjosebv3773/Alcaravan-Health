-- Add verification and credential fields to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS mpps_registry text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS college_number text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS consultation_modality text DEFAULT 'presencial'; -- 'virtual', 'presencial', 'both'
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS documents_url text[]; -- Array of URLs
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS signature_url text; -- URL for seal/signature

-- Create storage bucket for verification documents if it doesn't exist
-- Note: This usually requires using the Storage API or UI, but can sometimes be done via SQL extensions if enabled.
-- We will assume the bucket 'documents' exists or handle it in the frontend.

-- Policy updates might be needed if RLS is strict, but "Users can update own profile" usually covers columns on the row.
