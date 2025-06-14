
-- Create storage buckets that don't exist yet
-- Check if profile-pictures bucket exists, if not create it
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'profile-pictures') THEN
        INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
        VALUES (
            'profile-pictures', 
            'profile-pictures', 
            true, 
            5242880, 
            ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        );
    END IF;
END $$;

-- Check if videos bucket exists, if not create it  
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'videos') THEN
        INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
        VALUES (
            'videos', 
            'videos', 
            true, 
            104857600, 
            ARRAY['video/webm', 'video/mp4', 'video/quicktime']
        );
    END IF;
END $$;

-- Ensure proper RLS policies for storage objects (allow anon access)
DROP POLICY IF EXISTS "Anyone can view videos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload videos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update videos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete videos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete profile pictures" ON storage.objects;

-- Create new storage policies for anon role
CREATE POLICY "Anon can view videos" 
ON storage.objects FOR SELECT 
TO anon
USING (bucket_id = 'videos');

CREATE POLICY "Anon can upload videos" 
ON storage.objects FOR INSERT 
TO anon
WITH CHECK (bucket_id = 'videos');

CREATE POLICY "Anon can update videos" 
ON storage.objects FOR UPDATE 
TO anon
USING (bucket_id = 'videos');

CREATE POLICY "Anon can delete videos" 
ON storage.objects FOR DELETE 
TO anon
USING (bucket_id = 'videos');

CREATE POLICY "Anon can view profile pictures" 
ON storage.objects FOR SELECT 
TO anon
USING (bucket_id = 'profile-pictures');

CREATE POLICY "Anon can upload profile pictures" 
ON storage.objects FOR INSERT 
TO anon
WITH CHECK (bucket_id = 'profile-pictures');

CREATE POLICY "Anon can update profile pictures" 
ON storage.objects FOR UPDATE 
TO anon
USING (bucket_id = 'profile-pictures');

CREATE POLICY "Anon can delete profile pictures" 
ON storage.objects FOR DELETE 
TO anon
USING (bucket_id = 'profile-pictures');
