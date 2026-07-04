-- Ensure admin can update any profile (promote/demote)
-- Run in Supabase SQL Editor

-- Check if admin update policy exists, create if not
DROP POLICY IF EXISTS "admins_update_all_profiles" ON public.profiles;

CREATE POLICY "admins_update_all_profiles"
  ON public.profiles FOR UPDATE
  USING (auth.uid() IN (SELECT user_id FROM public.profiles WHERE is_admin = true))
  WITH CHECK (auth.uid() IN (SELECT user_id FROM public.profiles WHERE is_admin = true));

-- Also ensure the admin account actually has is_admin = true
UPDATE public.profiles SET is_admin = true
WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'admin@archistudent.com');
