
-- Drop the existing submissions table completely (this will also drop all policies)
DROP TABLE IF EXISTS public.submissions CASCADE;

-- Drop the enum type if it exists
DROP TYPE IF EXISTS cluster_type CASCADE;

-- Recreate the enum for clusters
CREATE TYPE cluster_type AS ENUM (
  'Future Tech', 
  'Built Environment & Sustainability', 
  'Creative Industries', 
  'Business & Enterprise', 
  'Social Care & Health'
);

-- Recreate the submissions table
CREATE TABLE public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  title TEXT,
  cluster cluster_type NOT NULL,
  profile_picture_url TEXT,
  video_url TEXT,
  notes JSONB,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on submissions
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- Create INSERT policy for anonymous and public users
CREATE POLICY "Anyone can insert submissions"
ON public.submissions
FOR INSERT
TO public, anon
WITH CHECK (true);

-- Create SELECT policy for published submissions
CREATE POLICY "Anyone can view published submissions"
ON public.submissions
FOR SELECT
TO public, anon
USING (is_published = true);

-- Create full access policy for service role (for admin functions)
CREATE POLICY "Service role full access"
ON public.submissions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
