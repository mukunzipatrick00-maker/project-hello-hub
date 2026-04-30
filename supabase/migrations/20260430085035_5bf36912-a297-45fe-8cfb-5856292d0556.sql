-- Teacher-subject assignments
CREATE TABLE public.teacher_subjects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID NOT NULL,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  assigned_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (teacher_id, class_id, subject_id)
);

ALTER TABLE public.teacher_subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated view teacher_subjects"
ON public.teacher_subjects FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Admin staff insert teacher_subjects"
ON public.teacher_subjects FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'head_master'::app_role) OR has_role(auth.uid(), 'secretary'::app_role));

CREATE POLICY "Admin staff update teacher_subjects"
ON public.teacher_subjects FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'head_master'::app_role) OR has_role(auth.uid(), 'secretary'::app_role));

CREATE POLICY "Admin staff delete teacher_subjects"
ON public.teacher_subjects FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'head_master'::app_role) OR has_role(auth.uid(), 'secretary'::app_role));

CREATE TRIGGER update_teacher_subjects_updated_at
BEFORE UPDATE ON public.teacher_subjects
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();