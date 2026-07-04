-- ============================================================
-- ArchiStudent — 1-to-1 Review Requests & File Attachments
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Review Requests table ---------------------------------
CREATE TABLE IF NOT EXISTS public.review_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  architect_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  message TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'completed', 'declined')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_review_requests_student ON public.review_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_review_requests_architect ON public.review_requests(architect_id);
CREATE INDEX IF NOT EXISTS idx_review_requests_status ON public.review_requests(status);

-- 2. Review Files table ------------------------------------
CREATE TABLE IF NOT EXISTS public.review_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT,
  file_type TEXT NOT NULL CHECK (file_type IN ('application/pdf', 'image/png')),
  file_size BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_review_files_review_id ON public.review_files(review_id);

-- 3. Storage bucket for review files -----------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('review-files', 'review-files', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "review_files_public_read"
  ON storage.objects FOR SELECT USING (bucket_id = 'review-files');

CREATE POLICY "review_files_auth_insert"
  ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'review-files' AND auth.role() = 'authenticated');

CREATE POLICY "review_files_owner_delete"
  ON storage.objects FOR DELETE USING (bucket_id = 'review-files' AND auth.uid() = owner);

-- 4. RLS — review_requests ---------------------------------
ALTER TABLE public.review_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "requests_readable_by_participants" ON public.review_requests;
CREATE POLICY "requests_readable_by_participants" ON public.review_requests FOR SELECT
  USING (auth.uid() IN (SELECT user_id FROM public.profiles WHERE id IN (student_id, architect_id)));

DROP POLICY IF EXISTS "requests_insertable_by_students" ON public.review_requests;
CREATE POLICY "requests_insertable_by_students" ON public.review_requests FOR INSERT
  WITH CHECK (auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = student_id AND role = 'student'));

DROP POLICY IF EXISTS "requests_updatable_by_architect" ON public.review_requests;
CREATE POLICY "requests_updatable_by_architect" ON public.review_requests FOR UPDATE
  USING (auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = architect_id));

-- 5. RLS — review_files ------------------------------------
ALTER TABLE public.review_files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "review_files_readable_by_all" ON public.review_files;
CREATE POLICY "review_files_readable_by_all" ON public.review_files FOR SELECT USING (true);

DROP POLICY IF EXISTS "review_files_insertable_by_reviewer" ON public.review_files;
CREATE POLICY "review_files_insertable_by_reviewer" ON public.review_files FOR INSERT
  WITH CHECK (auth.uid() IN (SELECT user_id FROM public.profiles WHERE id IN (
    SELECT reviewer_id FROM public.reviews WHERE id = review_id
  )));

-- 6. Admin policies ----------------------------------------
DROP POLICY IF EXISTS "admins_manage_requests" ON public.review_requests;
CREATE POLICY "admins_manage_requests" ON public.review_requests FOR ALL
  USING (auth.uid() IN (SELECT user_id FROM public.profiles WHERE is_admin = true));

DROP POLICY IF EXISTS "admins_manage_review_files" ON public.review_files;
CREATE POLICY "admins_manage_review_files" ON public.review_files FOR ALL
  USING (auth.uid() IN (SELECT user_id FROM public.profiles WHERE is_admin = true));

-- 7. Auto-update timestamp for review_requests -------------
CREATE OR REPLACE FUNCTION public.update_request_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_request_updated ON public.review_requests;
CREATE TRIGGER on_request_updated
  BEFORE UPDATE ON public.review_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_request_timestamp();
