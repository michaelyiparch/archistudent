-- Complete fix — ensures ALL project policies exist
-- Run in Supabase SQL Editor

-- 1. Drop all existing project policies
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'projects'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.projects', pol.policyname);
  END LOOP;
END $$;

-- 2. Recreate all policies

-- SELECT: public projects → everyone, private → owner + professionals, admins → all
CREATE POLICY "projects_select" ON public.projects FOR SELECT
  USING (
    visibility = 'public'
    OR (auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = user_id))
    OR (visibility = 'private' AND auth.uid() IN (SELECT user_id FROM public.profiles WHERE role = 'professional'))
    OR (auth.uid() IN (SELECT user_id FROM public.profiles WHERE is_admin = true))
  );

-- INSERT: any authenticated user can insert for their own profile
CREATE POLICY "projects_insert" ON public.projects FOR INSERT
  WITH CHECK (
    auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = user_id)
  );

-- UPDATE: owner or admin can update
CREATE POLICY "projects_update" ON public.projects FOR UPDATE
  USING (
    auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = user_id)
    OR auth.uid() IN (SELECT user_id FROM public.profiles WHERE is_admin = true)
  );

-- DELETE: owner or admin can delete
CREATE POLICY "projects_delete" ON public.projects FOR DELETE
  USING (
    auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = user_id)
    OR auth.uid() IN (SELECT user_id FROM public.profiles WHERE is_admin = true)
  );
