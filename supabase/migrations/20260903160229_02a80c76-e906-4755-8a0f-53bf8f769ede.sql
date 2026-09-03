CREATE SEQUENCE IF NOT EXISTS public.intern_id_seq;

CREATE TABLE public.interns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  intern_id text NOT NULL UNIQUE DEFAULT ('I' || lpad(nextval('public.intern_id_seq')::text, 3, '0')),
  name text NOT NULL,
  email text,
  phone text,
  department text,
  status text NOT NULL DEFAULT 'Active',
  join_date date NOT NULL DEFAULT current_date,
  current_login_status text NOT NULL DEFAULT 'Offline',
  current_login_time timestamptz,
  last_login timestamptz,
  last_logout timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.interns TO anon, authenticated;
GRANT ALL ON public.interns TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.intern_id_seq TO anon, authenticated, service_role;

ALTER TABLE public.interns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Demo CRM: anyone can read interns" ON public.interns FOR SELECT USING (true);
CREATE POLICY "Demo CRM: anyone can add interns" ON public.interns FOR INSERT WITH CHECK (true);
CREATE POLICY "Demo CRM: anyone can update interns" ON public.interns FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Demo CRM: anyone can delete interns" ON public.interns FOR DELETE USING (true);

CREATE OR REPLACE FUNCTION public.set_intern_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER interns_set_updated_at BEFORE UPDATE ON public.interns
FOR EACH ROW EXECUTE FUNCTION public.set_intern_updated_at();

INSERT INTO public.interns (name, email, phone, department, status, join_date, current_login_status, last_login, last_logout) VALUES
('Intern 01','intern01@pixelai.example','+91 98100 00001','Business Development','Active','2026-06-01','Online', now() - interval '2 hours', now() - interval '1 day'),
('Intern 02','intern02@pixelai.example','+91 98100 00002','Business Development','Active','2026-06-01','Offline', now() - interval '1 day', now() - interval '22 hours'),
('Intern 03','intern03@pixelai.example','+91 98100 00003','Sales','Active','2026-06-08','Online', now() - interval '3 hours', now() - interval '2 days'),
('Intern 04','intern04@pixelai.example','+91 98100 00004','Sales','Active','2026-06-08','Offline', now() - interval '2 days', now() - interval '2 days'),
('Intern 05','intern05@pixelai.example','+91 98100 00005','Marketing','Active','2026-06-15','Offline', now() - interval '3 days', now() - interval '3 days'),
('Intern 06','intern06@pixelai.example','+91 98100 00006','Marketing','Active','2026-06-15','Online', now() - interval '1 hour', now() - interval '1 day'),
('Intern 07','intern07@pixelai.example','+91 98100 00007','Research','Active','2026-07-01','Offline', now() - interval '5 days', now() - interval '5 days'),
('Intern 08','intern08@pixelai.example','+91 98100 00008','Research','Active','2026-07-01','Offline', now() - interval '6 days', now() - interval '6 days'),
('Intern 09','intern09@pixelai.example','+91 98100 00009','Customer Success','Active','2026-07-20','Online', now() - interval '30 minutes', now() - interval '1 day'),
('Intern 10','intern10@pixelai.example','+91 98100 00010','Customer Success','Active','2026-07-20','Offline', now() - interval '4 days', now() - interval '4 days');

UPDATE public.interns SET current_login_time = now() - interval '2 hours' WHERE current_login_status = 'Online';

ALTER TABLE public.leads ADD COLUMN intern_id uuid REFERENCES public.interns(id) ON DELETE SET NULL;

UPDATE public.leads l
SET assigned_intern = 'Intern 0' || right(l.assigned_intern, 1)
WHERE l.assigned_intern ~ '^Intern [1-9]$';

UPDATE public.leads l
SET intern_id = i.id
FROM public.interns i
WHERE i.name = l.assigned_intern;