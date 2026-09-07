CREATE OR REPLACE FUNCTION public.is_owner()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'owner')
$$;

CREATE POLICY "Admins read all profiles"
ON public.profiles FOR SELECT TO authenticated
USING (public.is_admin_or_owner());

CREATE UNIQUE INDEX IF NOT EXISTS interns_intern_id_key ON public.interns (intern_id);
CREATE UNIQUE INDEX IF NOT EXISTS interns_email_lower_key ON public.interns (lower(email)) WHERE email IS NOT NULL;