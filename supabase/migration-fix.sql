-- Fix RLS INSERT issue — run this in Supabase SQL Editor
-- Recreates the INSERT policy cleanly

DROP POLICY IF EXISTS "projects_are_insertable_by_authenticated" ON public.projects;

CREATE POLICY "projects_are_insertable_by_authenticated"
  ON public.projects FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = user_id
      AND profiles.user_id = auth.uid()
    )
  );
