-- Allow Super Admins to insert notifications for any user
CREATE POLICY "Super Admins can insert notifications"
ON public.notifications
FOR INSERT
WITH CHECK (
  (SELECT is_super_admin FROM public.profiles WHERE id = auth.uid()) = TRUE
);
