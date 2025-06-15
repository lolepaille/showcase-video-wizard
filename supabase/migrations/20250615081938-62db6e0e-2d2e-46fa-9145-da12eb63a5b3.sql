
-- Drop the enum if it exists (precaution, in case it's orphaned)
DROP TYPE IF EXISTS cluster_type CASCADE;

-- Create the enum for Cluster
CREATE TYPE cluster_type AS ENUM (
  'Future Tech',
  'Built Environment & Sustainability',
  'Creative Industries',
  'Business & Enterprise',
  'Social Care & Health'
);

-- Drop the submissions table if it exists
DROP TABLE IF EXISTS public.submissions CASCADE;

-- Create the submissions table
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

-- Enable Row Level Security (RLS)
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- Allow anonymous and public users to insert
CREATE POLICY "Anyone can insert submissions"
  ON public.submissions
  FOR INSERT
  TO public, anon
  WITH CHECK (true);

-- Only allow viewing published submissions
CREATE POLICY "Anyone can view published submissions"
  ON public.submissions
  FOR SELECT
  TO public, anon
  USING (is_published = true);

-- Allow service_role to do everything (admin & automation)
CREATE POLICY "Service role full access"
  ON public.submissions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

