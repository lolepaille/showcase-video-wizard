
-- Remove conflicting or legacy policies to ensure no overlaps
DROP POLICY IF EXISTS "Anyone can insert submissions" ON public.submissions;
DROP POLICY IF EXISTS "Public can insert submissions" ON public.submissions;
DROP POLICY IF EXISTS "Anon can insert submissions" ON public.submissions;

-- Create a single, clear insert policy that allows both 'public' and 'anon' roles
CREATE POLICY "Anyone can insert submissions"
ON public.submissions
FOR INSERT
TO public, anon
WITH CHECK (true);
