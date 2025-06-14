
-- Drop the conflicting admin policy that's causing issues with public inserts
DROP POLICY IF EXISTS "Admin can manage all submissions" ON public.submissions;

-- Create separate admin policies that don't interfere with public inserts
CREATE POLICY "Admin can select all submissions" 
ON public.submissions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE username = current_setting('request.jwt.claims', true)::json->>'username'
  )
);

CREATE POLICY "Admin can update all submissions" 
ON public.submissions 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE username = current_setting('request.jwt.claims', true)::json->>'username'
  )
);

CREATE POLICY "Admin can delete all submissions" 
ON public.submissions 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE username = current_setting('request.jwt.claims', true)::json->>'username'
  )
);
