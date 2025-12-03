-- 1. Update Foreign Key to reference profiles instead of auth.users
-- This allows PostgREST to perform the join profiles:reporter_id
ALTER TABLE public.store_reports
DROP CONSTRAINT IF EXISTS store_reports_reporter_id_fkey;

ALTER TABLE public.store_reports
ADD CONSTRAINT store_reports_reporter_id_fkey
FOREIGN KEY (reporter_id)
REFERENCES public.profiles(id)
ON DELETE SET NULL;

-- 2. Add RLS Policy for Super Admins to VIEW reports
CREATE POLICY "Super Admins can view reports"
ON public.store_reports
FOR SELECT
USING (
  (SELECT is_super_admin FROM profiles WHERE id = auth.uid()) = TRUE
);

-- 3. Ensure Super Admins can also DELETE/RESOLVE reports
CREATE POLICY "Super Admins can delete reports"
ON public.store_reports
FOR DELETE
USING (
  (SELECT is_super_admin FROM profiles WHERE id = auth.uid()) = TRUE
);
