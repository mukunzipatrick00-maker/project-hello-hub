-- Add parent_phone for WhatsApp messaging (E.164)
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS parent_phone TEXT;

-- Classes table
CREATE TABLE IF NOT EXISTS public.classes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  level TEXT,
  description TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated view classes"
ON public.classes FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin staff insert classes"
ON public.classes FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'head_master'::app_role) OR has_role(auth.uid(), 'secretary'::app_role));

CREATE POLICY "Admin staff update classes"
ON public.classes FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'head_master'::app_role) OR has_role(auth.uid(), 'secretary'::app_role));

CREATE POLICY "Head master deletes classes"
ON public.classes FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'head_master'::app_role));

CREATE TRIGGER classes_updated_at
BEFORE UPDATE ON public.classes
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Parent messages log
CREATE TABLE IF NOT EXISTS public.parent_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  to_phone TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  provider_sid TEXT,
  error TEXT,
  sent_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.parent_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff view parent messages"
ON public.parent_messages FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'head_master'::app_role)
  OR has_role(auth.uid(), 'secretary'::app_role)
  OR has_role(auth.uid(), 'teacher'::app_role)
  OR has_role(auth.uid(), 'animation_patron'::app_role)
  OR has_role(auth.uid(), 'matron'::app_role)
);

CREATE POLICY "Admin staff insert parent messages"
ON public.parent_messages FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'head_master'::app_role) OR has_role(auth.uid(), 'secretary'::app_role));