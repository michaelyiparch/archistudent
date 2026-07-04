-- ============================================================
-- Project Visibility — public / private (architects-only pool)
-- Run in Supabase SQL Editor
-- ============================================================

-- 1. Add column to projects
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'private'));

-- 2. Update RLS — public visible to all, private visible to owner + any professional
DROP POLICY IF EXISTS "projects_are_readable_by_all" ON public.projects;
CREATE POLICY "projects_are_readable_by_all" ON public.projects FOR SELECT
  USING (
    visibility = 'public'
    OR auth.uid() IN (
      SELECT user_id FROM public.profiles WHERE id = user_id
    )
    OR (
      visibility = 'private'
      AND auth.uid() IN (
        SELECT user_id FROM public.profiles WHERE role = 'professional'
      )
    )
  );

-- 3. Admins can see all
DROP POLICY IF EXISTS "admins_see_all_projects" ON public.projects;
CREATE POLICY "admins_see_all_projects" ON public.projects FOR SELECT
  USING (auth.uid() IN (SELECT user_id FROM public.profiles WHERE is_admin = true));
