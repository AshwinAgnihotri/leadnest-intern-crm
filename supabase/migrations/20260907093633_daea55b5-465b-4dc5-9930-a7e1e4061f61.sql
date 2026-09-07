-- 1. Link interns to auth accounts
ALTER TABLE public.interns ADD COLUMN IF NOT EXISTS user_id uuid UNIQUE;

-- 2. Helper: intern row of the currently logged-in user
CREATE OR REPLACE FUNCTION public.current_intern_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.interns WHERE user_id = auth.uid() LIMIT 1
$$;

GRANT EXECUTE ON FUNCTION public.current_intern_id() TO authenticated;

-- 3. Helper: link (or create) the intern record for the logged-in user
CREATE OR REPLACE FUNCTION public.link_current_intern(p_name text DEFAULT NULL)
RETURNS public.interns
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  v_row public.interns;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_row FROM public.interns WHERE user_id = v_uid LIMIT 1;
  IF FOUND THEN
    RETURN v_row;
  END IF;

  UPDATE public.interns
     SET user_id = v_uid
   WHERE user_id IS NULL
     AND lower(coalesce(email, '')) = v_email
     AND v_email <> ''
   RETURNING * INTO v_row;

  IF FOUND THEN
    RETURN v_row;
  END IF;

  INSERT INTO public.interns (name, email, user_id, status)
  VALUES (coalesce(nullif(trim(p_name), ''), split_part(v_email, '@', 1), 'Intern'), nullif(v_email, ''), v_uid, 'Active')
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.link_current_intern(text) TO authenticated;

-- 4. Drop demo-open policies
DROP POLICY IF EXISTS "Demo CRM: anyone can read interns" ON public.interns;
DROP POLICY IF EXISTS "Demo CRM: anyone can add interns" ON public.interns;
DROP POLICY IF EXISTS "Demo CRM: anyone can update interns" ON public.interns;
DROP POLICY IF EXISTS "Demo CRM: anyone can delete interns" ON public.interns;

DROP POLICY IF EXISTS "Demo CRM: anyone can read leads" ON public.leads;
DROP POLICY IF EXISTS "Demo CRM: anyone can add leads" ON public.leads;
DROP POLICY IF EXISTS "Demo CRM: anyone can update leads" ON public.leads;
DROP POLICY IF EXISTS "Demo CRM: anyone can delete leads" ON public.leads;

DROP POLICY IF EXISTS "Demo CRM: anyone can read notes" ON public.notes;
DROP POLICY IF EXISTS "Demo CRM: anyone can add notes" ON public.notes;
DROP POLICY IF EXISTS "Demo CRM: anyone can update notes" ON public.notes;
DROP POLICY IF EXISTS "Demo CRM: anyone can delete notes" ON public.notes;

DROP POLICY IF EXISTS "Demo CRM: anyone can read activities" ON public.activities;
DROP POLICY IF EXISTS "Demo CRM: anyone can add activities" ON public.activities;
DROP POLICY IF EXISTS "Demo CRM: anyone can update activities" ON public.activities;
DROP POLICY IF EXISTS "Demo CRM: anyone can delete activities" ON public.activities;

DROP POLICY IF EXISTS "Demo CRM: anyone can read notifications" ON public.notifications;
DROP POLICY IF EXISTS "Demo CRM: anyone can add notifications" ON public.notifications;
DROP POLICY IF EXISTS "Demo CRM: anyone can update notifications" ON public.notifications;
DROP POLICY IF EXISTS "Demo CRM: anyone can delete notifications" ON public.notifications;

-- 5. Remove anonymous access
REVOKE ALL ON public.interns FROM anon;
REVOKE ALL ON public.leads FROM anon;
REVOKE ALL ON public.notes FROM anon;
REVOKE ALL ON public.activities FROM anon;
REVOKE ALL ON public.notifications FROM anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.interns TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.activities TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.interns TO service_role;
GRANT ALL ON public.leads TO service_role;
GRANT ALL ON public.notes TO service_role;
GRANT ALL ON public.activities TO service_role;
GRANT ALL ON public.notifications TO service_role;

-- 6. Own-record-only policies
CREATE POLICY "Interns see only themselves" ON public.interns
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Interns update only themselves" ON public.interns
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Interns read own leads" ON public.leads
  FOR SELECT TO authenticated USING (intern_id = public.current_intern_id());
CREATE POLICY "Interns add own leads" ON public.leads
  FOR INSERT TO authenticated WITH CHECK (intern_id = public.current_intern_id());
CREATE POLICY "Interns update own leads" ON public.leads
  FOR UPDATE TO authenticated USING (intern_id = public.current_intern_id())
  WITH CHECK (intern_id = public.current_intern_id());
CREATE POLICY "Interns delete own leads" ON public.leads
  FOR DELETE TO authenticated USING (intern_id = public.current_intern_id());

CREATE POLICY "Interns read notes on own leads" ON public.notes
  FOR SELECT TO authenticated
  USING (lead_id IN (SELECT id FROM public.leads WHERE intern_id = public.current_intern_id()));
CREATE POLICY "Interns add notes on own leads" ON public.notes
  FOR INSERT TO authenticated
  WITH CHECK (
    intern_id = public.current_intern_id()
    AND lead_id IN (SELECT id FROM public.leads WHERE intern_id = public.current_intern_id())
  );
CREATE POLICY "Interns update own notes" ON public.notes
  FOR UPDATE TO authenticated USING (intern_id = public.current_intern_id())
  WITH CHECK (intern_id = public.current_intern_id());
CREATE POLICY "Interns delete own notes" ON public.notes
  FOR DELETE TO authenticated USING (intern_id = public.current_intern_id());

CREATE POLICY "Interns read own activities" ON public.activities
  FOR SELECT TO authenticated USING (intern_id = public.current_intern_id());
CREATE POLICY "Interns add own activities" ON public.activities
  FOR INSERT TO authenticated WITH CHECK (intern_id = public.current_intern_id());
CREATE POLICY "Interns delete own activities" ON public.activities
  FOR DELETE TO authenticated USING (intern_id = public.current_intern_id());

CREATE POLICY "Interns read own notifications" ON public.notifications
  FOR SELECT TO authenticated USING (user_or_intern_id = public.current_intern_id());
CREATE POLICY "Interns add own notifications" ON public.notifications
  FOR INSERT TO authenticated WITH CHECK (user_or_intern_id = public.current_intern_id());
CREATE POLICY "Interns update own notifications" ON public.notifications
  FOR UPDATE TO authenticated USING (user_or_intern_id = public.current_intern_id())
  WITH CHECK (user_or_intern_id = public.current_intern_id());
CREATE POLICY "Interns delete own notifications" ON public.notifications
  FOR DELETE TO authenticated USING (user_or_intern_id = public.current_intern_id());