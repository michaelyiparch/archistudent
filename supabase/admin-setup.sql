-- ============================================================
-- Admin / God Account Setup
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Add is_admin column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;

-- 2. Mark the admin user as admin
-- Replace the UUID below with your admin profile ID if different
UPDATE public.profiles
SET is_admin = true
WHERE user_id = 'd7109318-3bf2-4569-b949-437acfac6d94';

-- 3. Update RLS policies — admins can do anything

-- Projects: admins can update/delete any project
DROP POLICY IF EXISTS "admins_manage_all_projects" ON public.projects;
CREATE POLICY "admins_manage_all_projects"
  ON public.projects FOR ALL
  USING (
    auth.uid() IN (SELECT user_id FROM public.profiles WHERE is_admin = true)
  )
  WITH CHECK (
    auth.uid() IN (SELECT user_id FROM public.profiles WHERE is_admin = true)
  );

-- Reviews: admins can manage any review
DROP POLICY IF EXISTS "admins_manage_all_reviews" ON public.reviews;
CREATE POLICY "admins_manage_all_reviews"
  ON public.reviews FOR ALL
  USING (
    auth.uid() IN (SELECT user_id FROM public.profiles WHERE is_admin = true)
  )
  WITH CHECK (
    auth.uid() IN (SELECT user_id FROM public.profiles WHERE is_admin = true)
  );

-- Comments: admins can manage any comment
DROP POLICY IF EXISTS "admins_manage_all_comments" ON public.comments;
CREATE POLICY "admins_manage_all_comments"
  ON public.comments FOR ALL
  USING (
    auth.uid() IN (SELECT user_id FROM public.profiles WHERE is_admin = true)
  )
  WITH CHECK (
    auth.uid() IN (SELECT user_id FROM public.profiles WHERE is_admin = true)
  );

-- Likes: admins can manage any like
DROP POLICY IF EXISTS "admins_manage_all_likes" ON public.likes;
CREATE POLICY "admins_manage_all_likes"
  ON public.likes FOR ALL
  USING (
    auth.uid() IN (SELECT user_id FROM public.profiles WHERE is_admin = true)
  )
  WITH CHECK (
    auth.uid() IN (SELECT user_id FROM public.profiles WHERE is_admin = true)
  );

-- Project images: admins can manage all
DROP POLICY IF EXISTS "admins_manage_all_images" ON public.project_images;
CREATE POLICY "admins_manage_all_images"
  ON public.project_images FOR ALL
  USING (
    auth.uid() IN (SELECT user_id FROM public.profiles WHERE is_admin = true)
  )
  WITH CHECK (
    auth.uid() IN (SELECT user_id FROM public.profiles WHERE is_admin = true)
  );

-- Profiles: admins can update any profile
DROP POLICY IF EXISTS "admins_update_all_profiles" ON public.profiles;
CREATE POLICY "admins_update_all_profiles"
  ON public.profiles FOR UPDATE
  USING (
    auth.uid() IN (SELECT user_id FROM public.profiles WHERE is_admin = true)
  )
  WITH CHECK (
    auth.uid() IN (SELECT user_id FROM public.profiles WHERE is_admin = true)
  );

-- 4. Verify
SELECT id, full_name, is_admin FROM public.profiles WHERE is_admin = true;
