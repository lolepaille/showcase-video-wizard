
-- Step 1: Drop all existing RLS policies on public.submissions for a clean slate
DROP POLICY IF EXISTS "Anyone can view published submissions" ON public.submissions;
DROP POLICY IF EXISTS "Anyone can create submissions" ON public.submissions;
DROP POLICY IF EXISTS "Admin can select all submissions" ON public.submissions;
DROP POLICY IF EXISTS "Admin can update all submissions" ON public.submissions;
DROP POLICY IF EXISTS "Admin can delete all submissions" ON public.submissions;
DROP POLICY IF EXISTS "Public can insert submissions" ON public.submissions;
DROP POLICY IF EXISTS "Public can view published submissions" ON public.submissions;
DROP POLICY IF EXISTS "Service role can manage all submissions" ON public.submissions;
DROP POLICY IF EXISTS "Anon can insert submissions" ON public.submissions;
DROP POLICY IF EXISTS "Anon can view published submissions" ON public.submissions;
DROP POLICY IF EXISTS "Authenticated can insert submissions" ON public.submissions;
DROP POLICY IF EXISTS "Authenticated can view published submissions" ON public.submissions;

-- Step 2: Ensure RLS is enabled
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- Step 3: Recreate explicit RLS policies for clean functionality

-- Allow anyone (including anon) to insert submissions
CREATE POLICY "Anyone can insert submissions"
ON public.submissions
FOR INSERT
TO public, anon
WITH CHECK (true);

-- Anyone can view published submissions
CREATE POLICY "Anyone can select published submissions"
ON public.submissions
FOR SELECT
TO public, anon
USING (is_published = true);

-- Service role full control for edge functions
CREATE POLICY "Service role full control"
ON public.submissions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Separate admin policies for select, update, delete
CREATE POLICY "Admin can select all submissions"
ON public.submissions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE username = current_setting('request.jwt.claims', true)::json->>'username'
  )
);

CREATE POLICY "Admin can update all submissions"
ON public.submissions
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE username = current_setting('request.jwt.claims', true)::json->>'username'
  )
);

CREATE POLICY "Admin can delete all submissions"
ON public.submissions
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE username = current_setting('request.jwt.claims', true)::json->>'username'
  )
);

-- Step 4: (Optional) TEMP debugging: allow everyone to select all rows (remove after validation)
-- CREATE POLICY "TEMP debug: anyone can select all" ON public.submissions FOR SELECT USING (true);

-- Step 5: (Optional) Verify permissions, then REMOVE the debug policy above.

