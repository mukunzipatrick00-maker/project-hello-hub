-- Roles enum
CREATE TYPE public.app_role AS ENUM ('head_master', 'secretary', 'teacher', 'patron', 'matron');

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  department TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- User roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer role checker
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Students
CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_code TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  class_name TEXT NOT NULL,
  department TEXT,
  gender TEXT,
  date_of_birth DATE,
  parent_contact TEXT,
  photo_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Marks
CREATE TABLE public.marks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  term TEXT NOT NULL,
  score NUMERIC(5,2) NOT NULL CHECK (score >= 0),
  max_score NUMERIC(5,2) NOT NULL DEFAULT 100 CHECK (max_score > 0),
  entered_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.marks ENABLE ROW LEVEL SECURITY;

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER students_updated BEFORE UPDATE ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER marks_updated BEFORE UPDATE ON public.marks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role app_role;
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, department)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'department'
  );

  IF NEW.raw_user_meta_data ? 'role' THEN
    BEGIN
      _role := (NEW.raw_user_meta_data->>'role')::app_role;
      INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, _role);
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ RLS POLICIES ============

-- profiles
CREATE POLICY "Authenticated can view profiles" ON public.profiles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- user_roles
CREATE POLICY "Authenticated view roles" ON public.user_roles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Head master manages roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'head_master'))
  WITH CHECK (public.has_role(auth.uid(), 'head_master'));

-- students
CREATE POLICY "Authenticated view students" ON public.students
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin staff insert students" ON public.students
  FOR INSERT TO authenticated WITH CHECK (
    public.has_role(auth.uid(), 'head_master') OR public.has_role(auth.uid(), 'secretary')
  );
CREATE POLICY "Admin staff update students" ON public.students
  FOR UPDATE TO authenticated USING (
    public.has_role(auth.uid(), 'head_master') OR public.has_role(auth.uid(), 'secretary')
  );
CREATE POLICY "Head master deletes students" ON public.students
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'head_master'));

-- marks
CREATE POLICY "Authenticated view marks" ON public.marks
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Teaching staff insert marks" ON public.marks
  FOR INSERT TO authenticated WITH CHECK (
    public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'head_master') OR public.has_role(auth.uid(), 'secretary')
  );
CREATE POLICY "Teaching staff update marks" ON public.marks
  FOR UPDATE TO authenticated USING (
    public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'head_master') OR public.has_role(auth.uid(), 'secretary')
  );
CREATE POLICY "Head master deletes marks" ON public.marks
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'head_master'));