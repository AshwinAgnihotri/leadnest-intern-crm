CREATE SEQUENCE IF NOT EXISTS public.note_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.activity_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.notification_id_seq;

CREATE TABLE public.notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id text NOT NULL DEFAULT ('N' || lpad(nextval('note_id_seq')::text, 4, '0')),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  created_by text,
  intern_id uuid REFERENCES public.interns(id) ON DELETE SET NULL,
  note_text text NOT NULL,
  created_date date NOT NULL DEFAULT CURRENT_DATE,
  created_time time NOT NULL DEFAULT CURRENT_TIME,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notes TO anon, authenticated;
GRANT ALL ON public.notes TO service_role;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Demo CRM: anyone can read notes" ON public.notes FOR SELECT USING (true);
CREATE POLICY "Demo CRM: anyone can add notes" ON public.notes FOR INSERT WITH CHECK (true);
CREATE POLICY "Demo CRM: anyone can update notes" ON public.notes FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Demo CRM: anyone can delete notes" ON public.notes FOR DELETE USING (true);

CREATE OR REPLACE FUNCTION public.set_note_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
CREATE TRIGGER notes_set_updated_at BEFORE UPDATE ON public.notes
FOR EACH ROW EXECUTE FUNCTION public.set_note_updated_at();

CREATE TABLE public.activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id text NOT NULL DEFAULT ('A' || lpad(nextval('activity_id_seq')::text, 4, '0')),
  intern_id uuid REFERENCES public.interns(id) ON DELETE SET NULL,
  intern_name text,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  lead_name text,
  action text NOT NULL,
  description text,
  created_date date NOT NULL DEFAULT CURRENT_DATE,
  created_time time NOT NULL DEFAULT CURRENT_TIME,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.activities TO anon, authenticated;
GRANT ALL ON public.activities TO service_role;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Demo CRM: anyone can read activities" ON public.activities FOR SELECT USING (true);
CREATE POLICY "Demo CRM: anyone can add activities" ON public.activities FOR INSERT WITH CHECK (true);
CREATE POLICY "Demo CRM: anyone can update activities" ON public.activities FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Demo CRM: anyone can delete activities" ON public.activities FOR DELETE USING (true);

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id text NOT NULL DEFAULT ('NT' || lpad(nextval('notification_id_seq')::text, 4, '0')),
  user_or_intern_id uuid REFERENCES public.interns(id) ON DELETE CASCADE,
  intern_name text,
  lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text,
  type text NOT NULL DEFAULT 'General',
  is_read boolean NOT NULL DEFAULT false,
  dedupe_key text UNIQUE,
  created_date date NOT NULL DEFAULT CURRENT_DATE,
  created_time time NOT NULL DEFAULT CURRENT_TIME,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO anon, authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Demo CRM: anyone can read notifications" ON public.notifications FOR SELECT USING (true);
CREATE POLICY "Demo CRM: anyone can add notifications" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Demo CRM: anyone can update notifications" ON public.notifications FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Demo CRM: anyone can delete notifications" ON public.notifications FOR DELETE USING (true);

CREATE INDEX notes_lead_idx ON public.notes(lead_id);
CREATE INDEX activities_created_idx ON public.activities(created_date DESC, created_time DESC);
CREATE INDEX notifications_read_idx ON public.notifications(is_read);