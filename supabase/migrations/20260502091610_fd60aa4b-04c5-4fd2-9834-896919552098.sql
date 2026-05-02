
CREATE TABLE public.discipline_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  points NUMERIC NOT NULL DEFAULT 1,
  notes TEXT,
  recorded_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.discipline_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated view discipline"
ON public.discipline_records FOR SELECT TO authenticated USING (true);

CREATE POLICY "Discipline staff insert discipline"
ON public.discipline_records FOR INSERT TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'animation_patron'::app_role)
  OR has_role(auth.uid(), 'matron'::app_role)
  OR has_role(auth.uid(), 'head_master'::app_role)
  OR has_role(auth.uid(), 'secretary'::app_role)
);

CREATE POLICY "Discipline staff update discipline"
ON public.discipline_records FOR UPDATE TO authenticated
USING (
  has_role(auth.uid(), 'animation_patron'::app_role)
  OR has_role(auth.uid(), 'matron'::app_role)
  OR has_role(auth.uid(), 'head_master'::app_role)
);

CREATE POLICY "Discipline staff delete discipline"
ON public.discipline_records FOR DELETE TO authenticated
USING (
  has_role(auth.uid(), 'animation_patron'::app_role)
  OR has_role(auth.uid(), 'matron'::app_role)
  OR has_role(auth.uid(), 'head_master'::app_role)
);

CREATE TRIGGER trg_discipline_updated_at
BEFORE UPDATE ON public.discipline_records
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


CREATE TABLE public.student_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  details TEXT,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'approved',
  granted_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.student_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated view permissions"
ON public.student_permissions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Discipline staff insert permissions"
ON public.student_permissions FOR INSERT TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'animation_patron'::app_role)
  OR has_role(auth.uid(), 'matron'::app_role)
  OR has_role(auth.uid(), 'head_master'::app_role)
  OR has_role(auth.uid(), 'secretary'::app_role)
);

CREATE POLICY "Discipline staff update permissions"
ON public.student_permissions FOR UPDATE TO authenticated
USING (
  has_role(auth.uid(), 'animation_patron'::app_role)
  OR has_role(auth.uid(), 'matron'::app_role)
  OR has_role(auth.uid(), 'head_master'::app_role)
  OR has_role(auth.uid(), 'secretary'::app_role)
);

CREATE POLICY "Discipline staff delete permissions"
ON public.student_permissions FOR DELETE TO authenticated
USING (
  has_role(auth.uid(), 'animation_patron'::app_role)
  OR has_role(auth.uid(), 'matron'::app_role)
  OR has_role(auth.uid(), 'head_master'::app_role)
);

CREATE TRIGGER trg_permissions_updated_at
BEFORE UPDATE ON public.student_permissions
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
