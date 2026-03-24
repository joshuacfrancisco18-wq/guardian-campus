
CREATE POLICY "Users can insert own role on signup"
ON public.user_roles
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND role IN ('student'::app_role, 'teacher'::app_role)
);
