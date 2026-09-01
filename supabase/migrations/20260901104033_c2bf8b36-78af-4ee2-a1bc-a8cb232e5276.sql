CREATE SEQUENCE IF NOT EXISTS public.lead_id_seq;

CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id text NOT NULL UNIQUE DEFAULT ('L' || lpad(nextval('public.lead_id_seq')::text, 3, '0')),
  company_name text NOT NULL,
  contact_person text NOT NULL,
  email text,
  phone text,
  website text,
  linkedin text,
  location text,
  industry text,
  lead_source text,
  lead_quality text NOT NULL DEFAULT 'Cold',
  status text NOT NULL DEFAULT 'New',
  assigned_intern text,
  created_date timestamptz NOT NULL DEFAULT now(),
  last_updated timestamptz NOT NULL DEFAULT now(),
  last_contacted date,
  next_follow_up date
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;
GRANT ALL ON public.leads TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.lead_id_seq TO anon, authenticated;
GRANT ALL ON SEQUENCE public.lead_id_seq TO service_role;

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Demo CRM: anyone can read leads" ON public.leads FOR SELECT USING (true);
CREATE POLICY "Demo CRM: anyone can add leads" ON public.leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Demo CRM: anyone can update leads" ON public.leads FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Demo CRM: anyone can delete leads" ON public.leads FOR DELETE USING (true);

CREATE OR REPLACE FUNCTION public.set_lead_last_updated()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER leads_set_last_updated BEFORE UPDATE ON public.leads
FOR EACH ROW EXECUTE FUNCTION public.set_lead_last_updated();

INSERT INTO public.leads (company_name, contact_person, email, phone, website, linkedin, location, industry, lead_source, lead_quality, status, assigned_intern, last_contacted, next_follow_up) VALUES
('TechNova Solutions','Aarav Mehta','aarav@technova.example','+91 98200 11223','https://technova.example','https://linkedin.com/company/technova','Mumbai, India','Software','LinkedIn','Hot','Contacted','Intern 1', CURRENT_DATE - 3, CURRENT_DATE),
('BrightEdge Systems','Nina Kapoor','nina@brightedge.example','+91 98111 44556','https://brightedge.example','https://linkedin.com/company/brightedge','Bengaluru, India','Manufacturing','Referral','Warm','Follow-up','Intern 2', CURRENT_DATE - 7, CURRENT_DATE + 2),
('CloudMatrix','Daniel Reyes','daniel@cloudmatrix.example','+1 415 555 0132','https://cloudmatrix.example','https://linkedin.com/company/cloudmatrix','San Francisco, USA','Cloud Services','Website','Hot','Qualified','Intern 3', CURRENT_DATE - 1, CURRENT_DATE + 5),
('DataSphere','Priya Nair','priya@datasphere.example','+91 99400 77881','https://datasphere.example','https://linkedin.com/company/datasphere','Chennai, India','Analytics','Event','Cold','New','Intern 4', NULL, CURRENT_DATE + 10),
('NextGen Labs','Ethan Brooks','ethan@nextgenlabs.example','+44 20 7946 0102','https://nextgenlabs.example','https://linkedin.com/company/nextgenlabs','London, UK','Biotech','Email','Warm','Contacted','Intern 1', CURRENT_DATE - 5, CURRENT_DATE - 1),
('InnovateHub','Sara Lindqvist','sara@innovatehub.example','+46 8 123 4567','https://innovatehub.example','https://linkedin.com/company/innovatehub','Stockholm, Sweden','Consulting','Social Media','Cold','New','Intern 2', NULL, NULL),
('SmartScale Technologies','Rahul Verma','rahul@smartscale.example','+91 97300 22110','https://smartscale.example','https://linkedin.com/company/smartscale','Pune, India','SaaS','LinkedIn','Hot','Converted','Intern 3', CURRENT_DATE - 10, NULL),
('VisionStack','Maya Osei','maya@visionstack.example','+1 212 555 0178','https://visionstack.example','https://linkedin.com/company/visionstack','New York, USA','Media','Phone','Warm','Follow-up','Intern 4', CURRENT_DATE - 4, CURRENT_DATE),
('AlphaSoft','Tom Fischer','tom@alphasoft.example','+49 30 123456','https://alphasoft.example','https://linkedin.com/company/alphasoft','Berlin, Germany','Software','Referral','Cold','Lost','Intern 1', CURRENT_DATE - 20, NULL),
('FutureCore','Ishita Rao','ishita@futurecore.example','+91 90000 33445','https://futurecore.example','https://linkedin.com/company/futurecore','Hyderabad, India','Fintech','Website','Hot','Follow-up','Intern 2', CURRENT_DATE - 2, CURRENT_DATE - 3);