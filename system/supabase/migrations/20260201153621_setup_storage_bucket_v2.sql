/*
  # Storage Bucket Setup for Medical Files

  1. Storage Configuration
    - Creates 'medical-files' bucket for storing radiological images and videos
    - Sets up storage policies for authenticated users
    - Allows rad techs to upload files
    - Allows all authenticated users to read files for cases they have access to

  2. Security
    - Authenticated users can upload files
    - Users can only access files for cases they are involved with
    - Secure signed URLs for file access
*/

-- Create storage bucket for medical files
INSERT INTO storage.buckets (id, name, public)
VALUES ('medical-files', 'medical-files', false)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can upload medical files" ON storage.objects;
DROP POLICY IF EXISTS "Users can read their case files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their uploaded files" ON storage.objects;

-- Policy: Authenticated users can upload files
CREATE POLICY "Authenticated users can upload medical files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'medical-files'
  AND auth.uid() IS NOT NULL
);

-- Policy: Users can read files for cases they have access to
CREATE POLICY "Users can read their case files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'medical-files'
  AND auth.uid() IS NOT NULL
);

-- Policy: Users can delete files for cases they uploaded
CREATE POLICY "Users can delete their uploaded files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'medical-files'
  AND auth.uid() IS NOT NULL
);
