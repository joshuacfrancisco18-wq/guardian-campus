INSERT INTO public.user_roles (user_id, role)
SELECT p.user_id, 'student'::app_role
FROM profiles p
LEFT JOIN user_roles ur ON p.user_id = ur.user_id
WHERE ur.id IS NULL
  AND p.user_id NOT IN (SELECT user_id FROM user_roles)
ON CONFLICT (user_id, role) DO NOTHING;