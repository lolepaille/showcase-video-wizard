
-- Fix RLS policies to target the correct roles
-- Drop existing policies that target 'public' role
DROP POLICY IF EXISTS "Public can insert submissions" ON public.submissions;
DROP POLICY IF EXISTS "Public can view published submissions" ON public.submissions;

-- Create new policies targeting 'anon' role (which is what Supabase client uses)
CREATE POLICY "Anon can insert submissions" 
ON public.submissions 
FOR INSERT 
TO anon
WITH CHECK (true);

-- Create SELECT policy for anon role to view published submissions
CREATE POLICY "Anon can view published submissions" 
ON public.submissions 
FOR SELECT 
TO anon
USING (is_published = true);

-- Also allow authenticated users to insert and view
CREATE POLICY "Authenticated can insert submissions" 
ON public.submissions 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated can view published submissions" 
ON public.submissions 
FOR SELECT 
TO authenticated
USING (is_published = true);
