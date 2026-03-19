
-- Create a function to mark OTP as verified (bypasses RLS since otp_logs has no UPDATE policy)
CREATE OR REPLACE FUNCTION public.mark_otp_verified(otp_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.otp_logs SET verified = true WHERE id = otp_id;
END;
$$;

-- Allow anon to insert OTP logs (for registration before auth)
CREATE POLICY "Anon can insert OTP logs" ON public.otp_logs
FOR INSERT TO anon WITH CHECK (true);

-- Allow anon to select OTP logs by email (for verification)
CREATE POLICY "Anon can verify OTP by email" ON public.otp_logs
FOR SELECT TO anon USING (true);
