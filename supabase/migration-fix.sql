-- Complete fix — explicit drop + recreate all project policies
-- Run in Supabase SQL Editor

-- 1. Drop all existing project policies (explicit names)
DROP POLICY IF EXISTS "projects_are_readable_by_all" ON public.projects;
DROP POLICY IF EXISTS "projects_are_insertable_by_authenticated" ON public.projects;
DROP POLICY IF EXISTS "projects_are_updatable_by_owner" ON public.projects;
DROP POLICY IF EXISTS "projects_are_deletable_by_owner" ON public.projects;
DROP POLICY IF EXISTS "admins_see_all_projects" ON public.projects;
DROP POLICY IF EXISTS "admins_manage_all_projects" ON public.projects;
DROP POLICY IF EXISTS "projects_select" ON public.projects;
DROP POLICY IF EXISTS "projects_insert" ON public.projects;
DROP POLICY IF EXISTS "projects_update" ON public.projects;
DROP POLICY IF EXISTS "projects_delete" ON public.projects;

-- 2. SELECT: public → everyone, private → owner + professionals, admins → all
CREATE POLICY "projects_select" ON public.projects FOR SELECT
  USING (
    visibility = 'public'
    OR auth.uid() IN (SELECT p.user_id FROM public.profiles p WHERE p.id = projects.user_id)
    OR (visibility = 'private' AND auth.uid() IN (SELECT p.user_id FROM public.profiles p WHERE p.role = 'professional'))
    OR auth.uid() IN (SELECT p.user_id FROM public.profiles p WHERE p.is_admin = true)
  );

-- 3. INSERT: any authenticated user for their own profile
CREATE POLICY "projects_insert" ON public.projects FOR INSERT
  WITH CHECK (
    auth.uid() IN (SELECT p.user_id FROM public.profiles p WHERE p.id = projects.user_id)
  );

-- 4. UPDATE: owner or admin
CREATE POLICY "projects_update" ON public.projects FOR UPDATE
  USING (
    auth.uid() IN (SELECT p.user_id FROM public.profiles p WHERE p.id = projects.user_id)
    OR auth.uid() IN (SELECT p.user_id FROM public.profiles p WHERE p.is_admin = true)
  );

-- 5. DELETE: owner or admin
CREATE POLICY "projects_delete" ON public.projects FOR DELETE
  USING (
    auth.uid() IN (SELECT p.user_id FROM public.profiles p WHERE p.id = projects.user_id)
    OR auth.uid() IN (SELECT p.user_id FROM public.profiles p WHERE p.is_admin = true)
  );
