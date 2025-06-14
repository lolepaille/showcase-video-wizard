
-- First, let's completely rebuild the RLS policies for submissions table
-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Anyone can view published submissions" ON public.submissions;
DROP POLICY IF EXISTS "Anyone can create submissions" ON public.submissions;
DROP POLICY IF EXISTS "Admin can select all submissions" ON public.submissions;
DROP POLICY IF EXISTS "Admin can update all submissions" ON public.submissions;
DROP POLICY IF EXISTS "Admin can delete all submissions" ON public.submissions;

-- Temporarily disable RLS to test if that's the issue
ALTER TABLE public.submissions DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- Create a simple, explicit INSERT policy for anyone
CREATE POLICY "Public can insert submissions" 
ON public.submissions 
FOR INSERT 
TO public
WITH CHECK (true);

-- Create SELECT policy for published submissions
CREATE POLICY "Public can view published submissions" 
ON public.submissions 
FOR SELECT 
TO public
USING (is_published = true);

-- Create admin policies using service role (for edge functions)
CREATE POLICY "Service role can manage all submissions" 
ON public.submissions 
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);
