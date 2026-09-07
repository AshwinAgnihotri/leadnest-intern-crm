CREATE OR REPLACE FUNCTION public.is_admin_or_owner()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND role IN ('admin','owner')
  )
$$;

REVOKE EXECUTE ON FUNCTION public.is_admin_or_owner() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.is_admin_or_owner() TO authenticated;

CREATE POLICY "Admins read all interns" ON public.interns
  FOR SELECT TO authenticated USING (public.is_admin_or_owner());

CREATE POLICY "Admins read all leads" ON public.leads
  FOR SELECT TO authenticated USING (public.is_admin_or_owner());

CREATE POLICY "Admins read all notes" ON public.notes
  FOR SELECT TO authenticated USING (public.is_admin_or_owner());

CREATE POLICY "Admins read all activities" ON public.activities
  FOR SELECT TO authenticated USING (public.is_admin_or_owner());
