
-- Create enum for clusters
CREATE TYPE cluster_type AS ENUM (
  'Future Tech', 
  'Built Environment & Sustainability', 
  'Creative Industries', 
  'Business & Enterprise', 
  'Social Care & Health'
);

-- Create storage bucket for videos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('videos', 'videos', true);

-- Create storage bucket for profile pictures
INSERT INTO storage.buckets (id, name, public) 
VALUES ('profile-pictures', 'profile-pictures', true);

-- Create submissions table
CREATE TABLE public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
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

-- Create admin users table for authentication
CREATE TABLE public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert admin user (password: letmein)
INSERT INTO public.admin_users (username, password_hash) 
VALUES ('Lawrence', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi');

-- Enable RLS on submissions
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- Enable RLS on admin_users
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Allow public read access to published submissions
CREATE POLICY "Anyone can view published submissions" 
ON public.submissions FOR SELECT 
USING (is_published = true);

-- Allow public insert for new submissions
CREATE POLICY "Anyone can create submissions" 
ON public.submissions FOR INSERT 
WITH CHECK (true);

-- Admin users policy - only accessible via edge functions
CREATE POLICY "Admin access only via functions" 
ON public.admin_users FOR ALL 
USING (false);

-- Storage policies for videos
CREATE POLICY "Anyone can view videos" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'videos');

CREATE POLICY "Anyone can upload videos" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'videos');

CREATE POLICY "Anyone can update videos" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'videos');

CREATE POLICY "Anyone can delete videos" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'videos');

-- Storage policies for profile pictures
CREATE POLICY "Anyone can view profile pictures" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'profile-pictures');

CREATE POLICY "Anyone can upload profile pictures" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'profile-pictures');

CREATE POLICY "Anyone can update profile pictures" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'profile-pictures');

CREATE POLICY "Anyone can delete profile pictures" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'profile-pictures');
