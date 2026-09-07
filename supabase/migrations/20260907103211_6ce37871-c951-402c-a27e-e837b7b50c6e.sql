DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('intern','admin','owner');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text,
  email text,
  role public.app_role NOT NULL DEFAULT 'intern',
  intern_id uuid REFERENCES public.interns(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own profile" ON public.profiles;
CREATE POLICY "Users read own profile" ON public.profiles
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid() AND role = (SELECT p.role FROM public.profiles p WHERE p.user_id = auth.uid()));

CREATE OR REPLACE FUNCTION public.set_profile_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS profiles_set_updated_at ON public.profiles;
CREATE TRIGGER profiles_set_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_profile_updated_at();

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.link_current_intern(p_name text DEFAULT NULL::text)
RETURNS public.interns LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  v_row public.interns;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_row FROM public.interns WHERE user_id = v_uid LIMIT 1;

  IF NOT FOUND THEN
    UPDATE public.interns
       SET user_id = v_uid
     WHERE user_id IS NULL
       AND lower(coalesce(email, '')) = v_email
       AND v_email <> ''
     RETURNING * INTO v_row;
  END IF;

  IF NOT FOUND THEN
    INSERT INTO public.interns (name, email, user_id, status)
    VALUES (coalesce(nullif(trim(p_name), ''), split_part(v_email, '@', 1), 'Intern'), nullif(v_email, ''), v_uid, 'Active')
    RETURNING * INTO v_row;
  END IF;

  INSERT INTO public.profiles (user_id, name, email, intern_id)
  VALUES (v_uid, coalesce(nullif(trim(p_name), ''), v_row.name), nullif(v_email, ''), v_row.id)
  ON CONFLICT (user_id) DO UPDATE
    SET intern_id = EXCLUDED.intern_id,
        email = coalesce(EXCLUDED.email, public.profiles.email),
        name = coalesce(public.profiles.name, EXCLUDED.name);

  RETURN v_row;
END;
$$;