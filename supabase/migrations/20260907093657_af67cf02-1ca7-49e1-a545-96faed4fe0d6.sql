REVOKE ALL ON FUNCTION public.current_intern_id() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.link_current_intern(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_intern_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.link_current_intern(text) TO authenticated;