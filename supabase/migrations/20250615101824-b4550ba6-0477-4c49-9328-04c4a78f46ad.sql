
-- 1. Drop all RLS policies depending on user_id
DROP POLICY IF EXISTS "Authenticated users can insert their own submissions" ON public.submissions;
DROP POLICY IF EXISTS "Users can view their own submissions" ON public.submissions;

-- 2. Now drop the user_id column
ALTER TABLE public.submissions DROP COLUMN IF EXISTS user_id;

-- 3. Add a permissive insert policy for anonymous submissions
DROP POLICY IF EXISTS "Anyone can insert submissions anonymously" ON public.submissions;
DROP POLICY IF EXISTS "Anyone can insert submissions" ON public.submissions;
CREATE POLICY "Anyone can insert submissions"
ON public.submissions
FOR INSERT
TO public, anon
WITH CHECK (true);

-- View and admin policies remain as-is
