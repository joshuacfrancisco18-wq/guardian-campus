
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'teacher', 'student');

-- Create account status enum
CREATE TYPE public.account_status AS ENUM ('pending', 'active', 'rejected', 'suspended');

-- Create attendance status enum
CREATE TYPE public.attendance_status AS ENUM ('present', 'late', 'absent');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  student_id TEXT,
  section TEXT,
  course TEXT,
  department TEXT,
  status account_status NOT NULL DEFAULT 'pending',
  face_registered BOOLEAN NOT NULL DEFAULT false,
  force_password_change BOOLEAN NOT NULL DEFAULT false,
  otp_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User roles table (separate as per security best practice)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Face embeddings table
CREATE TABLE public.face_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  embedding JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Subjects table
CREATE TABLE public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Schedules table
CREATE TABLE public.schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
  teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  section TEXT NOT NULL,
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  room TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Attendance records table
CREATE TABLE public.attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  schedule_id UUID REFERENCES public.schedules(id) ON DELETE CASCADE NOT NULL,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  time_in TIMESTAMPTZ,
  status attendance_status NOT NULL DEFAULT 'absent',
  verified_by TEXT,
  suspicious BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- OTP logs table
CREATE TABLE public.otp_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  purpose TEXT NOT NULL DEFAULT 'login',
  expires_at TIMESTAMPTZ NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Security logs table
CREATE TABLE public.security_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  description TEXT,
  ip_address TEXT,
  user_agent TEXT,
  suspicious BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Account approval requests table
CREATE TABLE public.approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  requested_role app_role NOT NULL,
  status account_status NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  review_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ
);

-- Face recognition logs
CREATE TABLE public.face_recognition_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  success BOOLEAN NOT NULL DEFAULT false,
  confidence REAL,
  liveness_passed BOOLEAN,
  anti_spoof_passed BOOLEAN,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.face_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.otp_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.face_recognition_logs ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone can insert profile on signup" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Teachers can view student profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'teacher'));

-- RLS Policies for user_roles
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for face_embeddings
CREATE POLICY "Users can manage own face data" ON public.face_embeddings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all face data" ON public.face_embeddings FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for subjects
CREATE POLICY "Authenticated can view subjects" ON public.subjects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage subjects" ON public.subjects FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for schedules
CREATE POLICY "Authenticated can view schedules" ON public.schedules FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage schedules" ON public.schedules FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for attendance_records
CREATE POLICY "Students can view own attendance" ON public.attendance_records FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Teachers can manage attendance" ON public.attendance_records FOR ALL USING (public.has_role(auth.uid(), 'teacher'));
CREATE POLICY "Admins can manage all attendance" ON public.attendance_records FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for otp_logs
CREATE POLICY "Users can view own OTP logs" ON public.otp_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert OTP logs" ON public.otp_logs FOR INSERT WITH CHECK (true);

-- RLS Policies for security_logs
CREATE POLICY "Admins can view security logs" ON public.security_logs FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "System can insert security logs" ON public.security_logs FOR INSERT WITH CHECK (true);

-- RLS Policies for approval_requests
CREATE POLICY "Users can view own requests" ON public.approval_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage approval requests" ON public.approval_requests FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can create own requests" ON public.approval_requests FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for face_recognition_logs
CREATE POLICY "Users can view own face logs" ON public.face_recognition_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all face logs" ON public.face_recognition_logs FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "System can insert face logs" ON public.face_recognition_logs FOR INSERT WITH CHECK (true);

-- Auto-create profile trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_face_embeddings_updated_at BEFORE UPDATE ON public.face_embeddings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
