-- Link students to auth users
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS user_id uuid UNIQUE;

CREATE INDEX IF NOT EXISTS idx_students_user_id ON public.students(user_id);

-- Allow Secretary to also manage user_roles
DROP POLICY IF EXISTS "Head master manages roles" ON public.user_roles;

CREATE POLICY "Admin staff manage roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'head_master'::app_role) OR public.has_role(auth.uid(), 'secretary'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'head_master'::app_role) OR public.has_role(auth.uid(), 'secretary'::app_role));

-- Restrict students to only see their own student record
DROP POLICY IF EXISTS "Authenticated view students" ON public.students;

CREATE POLICY "Staff view all students, students view self"
ON public.students
FOR SELECT
TO authenticated
USING (
  NOT public.has_role(auth.uid(), 'student'::app_role)
  OR user_id = auth.uid()
);

-- Restrict students to only see their own marks
DROP POLICY IF EXISTS "Authenticated view marks" ON public.marks;

CREATE POLICY "Staff view all marks, students view own"
ON public.marks
FOR SELECT
TO authenticated
USING (
  NOT public.has_role(auth.uid(), 'student'::app_role)
  OR student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
);