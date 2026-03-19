
-- Fix permissive INSERT policies by restricting to authenticated users
DROP POLICY "System can insert OTP logs" ON public.otp_logs;
CREATE POLICY "Authenticated can insert OTP logs" ON public.otp_logs FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY "System can insert security logs" ON public.security_logs;
CREATE POLICY "Authenticated can insert security logs" ON public.security_logs FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY "System can insert face logs" ON public.face_recognition_logs;
CREATE POLICY "Authenticated can insert face logs" ON public.face_recognition_logs FOR INSERT TO authenticated WITH CHECK (true);
