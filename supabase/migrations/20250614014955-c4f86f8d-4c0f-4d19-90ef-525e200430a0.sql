
-- Drop the existing INSERT policy that's causing issues
DROP POLICY IF EXISTS "Anyone can create submissions" ON public.submissions;

-- Create a new INSERT policy that allows anyone to create submissions
CREATE POLICY "Anyone can create submissions" 
ON public.submissions 
FOR INSERT 
WITH CHECK (true);

-- Also update the table to change first_name to full_name
ALTER TABLE public.submissions RENAME COLUMN first_name TO full_name;

-- Update the admin_users table to allow manual entry functionality
-- Add a policy for admin access to submissions
CREATE POLICY "Admin can manage all submissions" 
ON public.submissions 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE username = current_setting('request.jwt.claims', true)::json->>'username'
  )
);
