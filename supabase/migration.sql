-- ============================================================
-- ArchiStudent Platform — Database Schema
-- Run this in Supabase SQL Editor to set up the database
-- ============================================================

-- Enums ------------------------------------------------
CREATE TYPE user_role AS ENUM ('student', 'professional');
CREATE TYPE project_category AS ENUM ('residential', 'commercial', 'institutional', 'landscape', 'urban', 'interior', 'other');
CREATE TYPE project_stage AS ENUM ('concept', 'schematic', 'design_development', 'final');

-- Profiles table ----------------------------------------
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'student',
  full_name TEXT NOT NULL DEFAULT '',
  university_or_firm TEXT,
  bio TEXT,
  avatar_url TEXT,
  verified_professional BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Projects table ----------------------------------------
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category project_category NOT NULL DEFAULT 'other',
  stage project_stage NOT NULL DEFAULT 'concept',
  cover_image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Project images table ----------------------------------
CREATE TABLE public.project_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  caption TEXT,
  sort_order INT NOT NULL DEFAULT 0
);

-- Reviews table -----------------------------------------
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  concept_rating INT NOT NULL CHECK (concept_rating BETWEEN 1 AND 5),
  execution_rating INT NOT NULL CHECK (execution_rating BETWEEN 1 AND 5),
  presentation_rating INT NOT NULL CHECK (presentation_rating BETWEEN 1 AND 5),
  overall_rating INT NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
  comment TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id, reviewer_id)
);

-- Likes table -------------------------------------------
CREATE TABLE public.likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id, user_id)
);

-- Comments table ----------------------------------------
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes -----------------------------------------------
CREATE INDEX idx_projects_user_id ON public.projects(user_id);
CREATE INDEX idx_projects_created_at ON public.projects(created_at DESC);
CREATE INDEX idx_project_images_project_id ON public.project_images(project_id);
CREATE INDEX idx_reviews_project_id ON public.reviews(project_id);
CREATE INDEX idx_reviews_reviewer_id ON public.reviews(reviewer_id);
CREATE INDEX idx_likes_project_id ON public.likes(project_id);
CREATE INDEX idx_likes_user_id ON public.likes(user_id);
CREATE INDEX idx_comments_project_id ON public.comments(project_id);
CREATE INDEX idx_profiles_role ON public.profiles(role);

-- Helper: auto-create profile on signup -----------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    NEW.raw_user_meta_data ->> 'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Helper: update project updated_at ---------------------
CREATE OR REPLACE FUNCTION public.update_project_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER on_project_updated
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_project_timestamp();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- profiles: everyone can read, owner can update ---------
CREATE POLICY "profiles_are_readable_by_all"
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "profiles_are_updatable_by_owner"
  ON public.profiles FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- projects: everyone can read, owner can write -----------
CREATE POLICY "projects_are_readable_by_all"
  ON public.projects FOR SELECT USING (true);

CREATE POLICY "projects_are_insertable_by_authenticated"
  ON public.projects FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid()
  ));

CREATE POLICY "projects_are_updatable_by_owner"
  ON public.projects FOR UPDATE USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = projects.user_id
    AND profiles.user_id = auth.uid()
  ));

CREATE POLICY "projects_are_deletable_by_owner"
  ON public.projects FOR DELETE USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = projects.user_id
    AND profiles.user_id = auth.uid()
  ));

-- project_images: same as projects ----------------------
CREATE POLICY "images_are_readable_by_all"
  ON public.project_images FOR SELECT USING (true);

CREATE POLICY "images_are_insertable_by_project_owner"
  ON public.project_images FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT p.user_id FROM public.profiles p
      JOIN public.projects pr ON pr.user_id = p.id
      WHERE pr.id = project_id
    )
  );

CREATE POLICY "images_are_deletable_by_project_owner"
  ON public.project_images FOR DELETE USING (
    auth.uid() IN (
      SELECT p.user_id FROM public.profiles p
      JOIN public.projects pr ON pr.user_id = p.id
      WHERE pr.id = project_id
    )
  );

-- reviews: everyone can read, professionals can write ----
CREATE POLICY "reviews_are_readable_by_all"
  ON public.reviews FOR SELECT USING (true);

CREATE POLICY "reviews_are_insertable_by_professionals"
  ON public.reviews FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM public.profiles
      WHERE id = reviewer_id AND role = 'professional'
    )
  );

CREATE POLICY "reviews_are_updatable_by_reviewer"
  ON public.reviews FOR UPDATE USING (
    auth.uid() IN (
      SELECT user_id FROM public.profiles WHERE id = reviewer_id
    )
  );

-- likes: everyone can read, authenticated can write ------
CREATE POLICY "likes_are_readable_by_all"
  ON public.likes FOR SELECT USING (true);

CREATE POLICY "likes_are_insertable_by_authenticated"
  ON public.likes FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid())
  );

CREATE POLICY "likes_are_deletable_by_owner"
  ON public.likes FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid())
  );

-- comments: everyone can read, authenticated can write ---
CREATE POLICY "comments_are_readable_by_all"
  ON public.comments FOR SELECT USING (true);

CREATE POLICY "comments_are_insertable_by_authenticated"
  ON public.comments FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid())
  );

CREATE POLICY "comments_are_deletable_by_owner"
  ON public.comments FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid())
  );

-- ============================================================
-- STORAGE BUCKET SETUP
-- ============================================================
-- Run these separately in SQL Editor:
--
-- INSERT INTO storage.buckets (id, name, public) VALUES ('project-images', 'project-images', true);
--
-- CREATE POLICY "images_public_read"
--   ON storage.objects FOR SELECT USING (bucket_id = 'project-images');
--
-- CREATE POLICY "images_auth_insert"
--   ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'project-images' AND auth.role() = 'authenticated');
--
-- CREATE POLICY "images_owner_delete"
--   ON storage.objects FOR DELETE USING (bucket_id = 'project-images' AND auth.uid() = owner);
