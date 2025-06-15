
-- Add user_id column to submissions (and backfill for future)
ALTER TABLE public.submissions
  ADD COLUMN user_id uuid REFERENCES auth.users(id);

-- For now, make user_id nullable for compatibility (but require it soon for all future inserts)
-- New INSERT policy: Only allow authenticated users to insert where user_id = their user id
DROP POLICY IF EXISTS "Anyone can insert submissions" ON public.submissions;
CREATE POLICY "Authenticated users can insert their own submissions"
  ON public.submissions
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Policy: Authenticated users can select their own submissions (regardless of publication)
CREATE POLICY "Users can view their own submissions"
  ON public.submissions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy: Allows anyone (public/anon) to view published submissions
DROP POLICY IF EXISTS "Anyone can view published submissions" ON public.submissions;
CREATE POLICY "Anyone can view published submissions"
  ON public.submissions
  FOR SELECT
  TO public, anon
  USING (is_published = true);

-- Service_role can still do everything
DROP POLICY IF EXISTS "Service role full access" ON public.submissions;
CREATE POLICY "Service role full access"
  ON public.submissions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

