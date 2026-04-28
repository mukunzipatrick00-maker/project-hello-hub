-- Subjects table: each subject belongs to a trade and a level
CREATE TABLE public.subjects (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trade_id uuid NOT NULL REFERENCES public.trades(id) ON DELETE CASCADE,
  level text NOT NULL,
  name text NOT NULL,
  code text,
  description text,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (trade_id, level, name)
);

CREATE INDEX idx_subjects_trade_level ON public.subjects(trade_id, level);

ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated view subjects"
ON public.subjects FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admin staff insert subjects"
ON public.subjects FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'head_master'::app_role) OR has_role(auth.uid(), 'secretary'::app_role));

CREATE POLICY "Admin staff update subjects"
ON public.subjects FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'head_master'::app_role) OR has_role(auth.uid(), 'secretary'::app_role));

CREATE POLICY "Head master deletes subjects"
ON public.subjects FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'head_master'::app_role));

CREATE TRIGGER set_subjects_updated_at
BEFORE UPDATE ON public.subjects
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();