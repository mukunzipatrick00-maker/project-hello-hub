-- Create trades table for TVET school
CREATE TABLE public.trades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  code TEXT,
  description TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated view trades"
ON public.trades FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin staff insert trades"
ON public.trades FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'head_master'::app_role) OR has_role(auth.uid(), 'secretary'::app_role));

CREATE POLICY "Admin staff update trades"
ON public.trades FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'head_master'::app_role) OR has_role(auth.uid(), 'secretary'::app_role));

CREATE POLICY "Head master deletes trades"
ON public.trades FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'head_master'::app_role));

CREATE TRIGGER trades_set_updated_at
BEFORE UPDATE ON public.trades
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Add trade reference to classes
ALTER TABLE public.classes ADD COLUMN trade_id UUID REFERENCES public.trades(id) ON DELETE SET NULL;

-- Seed default TVET trades
INSERT INTO public.trades (name, code) VALUES
  ('Computer System and Architecture', 'CSA'),
  ('Networking and Internet Technology', 'NIT'),
  ('Software Development', 'SOD'),
  ('Tourism', 'TOU'),
  ('Building Construction', 'BDC'),
  ('Multimedia', 'MMP'),
  ('Food and Beverage', 'FBO')
ON CONFLICT (name) DO NOTHING;