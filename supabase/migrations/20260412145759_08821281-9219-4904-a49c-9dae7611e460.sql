-- Allow students to insert their own attendance records
CREATE POLICY "Students can insert own attendance"
ON public.attendance_records
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = student_id);
