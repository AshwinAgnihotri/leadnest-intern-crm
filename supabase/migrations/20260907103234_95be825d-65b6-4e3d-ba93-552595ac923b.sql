REVOKE EXECUTE ON FUNCTION public.link_current_intern(text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.current_intern_id() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.link_current_intern(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_intern_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;