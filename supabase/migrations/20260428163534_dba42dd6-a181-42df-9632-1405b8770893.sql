
CREATE TABLE IF NOT EXISTS public.school_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_code text NOT NULL,
  singleton boolean NOT NULL DEFAULT true UNIQUE,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.school_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated view school settings"
ON public.school_settings FOR SELECT TO authenticated USING (true);

CREATE POLICY "Head master inserts school settings"
ON public.school_settings FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'head_master'::app_role));

CREATE POLICY "Head master updates school settings"
ON public.school_settings FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'head_master'::app_role));

CREATE TRIGGER school_settings_updated_at
BEFORE UPDATE ON public.school_settings
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.school_settings (school_code) VALUES ('1177223')
ON CONFLICT DO NOTHING;

-- Public RPC to verify a school code at signup time (no auth required)
CREATE OR REPLACE FUNCTION public.verify_school_code(_code text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.school_settings WHERE school_code = _code);
$$;

GRANT EXECUTE ON FUNCTION public.verify_school_code(text) TO anon, authenticated;

-- Public RPC to verify a student code exists in the students table
CREATE OR REPLACE FUNCTION public.verify_student_code(_code text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.students WHERE student_code = _code);
$$;

GRANT EXECUTE ON FUNCTION public.verify_student_code(text) TO anon, authenticated;
