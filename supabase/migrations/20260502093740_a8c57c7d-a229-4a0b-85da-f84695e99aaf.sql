
-- Rename concept: points now means points deducted from a 40-point baseline
ALTER TABLE public.discipline_records
  ADD COLUMN IF NOT EXISTS points_deducted numeric NOT NULL DEFAULT 1;

-- Backfill from old "points" column if it had values
UPDATE public.discipline_records
SET points_deducted = COALESCE(points, 1)
WHERE points_deducted IS NULL OR points_deducted = 1;

-- Function to get remaining discipline points for a student (baseline 40)
CREATE OR REPLACE FUNCTION public.student_discipline_remaining(_student_id uuid)
RETURNS numeric
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT GREATEST(0, 40 - COALESCE((
    SELECT SUM(points_deducted) FROM public.discipline_records WHERE student_id = _student_id
  ), 0))
$$;
