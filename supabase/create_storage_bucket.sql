-- Create the 'documents' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on objects (Usually enabled by default, skipping to avoid permission errors)
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to upload files to the 'documents' bucket
-- They can only upload to a folder named after their own user ID for organization
DROP POLICY IF EXISTS "Authenticated users can upload documents" ON storage.objects;
CREATE POLICY "Authenticated users can upload documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow authenticated users to view/download files in the 'documents' bucket
-- For now, allowing read access to all authenticated users so admins/other doctors can potentially verify?
-- Or strictly restrict to owner? Given getPublicUrl is used, it implies public access via the URL,
-- but the db policy controls direct API access.
DROP POLICY IF EXISTS "Authenticated users can select documents" ON storage.objects;
CREATE POLICY "Authenticated users can select documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'documents');

-- Policy: Allow users to update/delete their own files
DROP POLICY IF EXISTS "Users can update delete own documents" ON storage.objects;
CREATE POLICY "Users can update delete own documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
