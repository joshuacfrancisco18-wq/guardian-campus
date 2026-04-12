import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScanFace, CheckCircle, Clock, XCircle, BookOpen } from 'lucide-react';
import FaceCapture from '@/components/FaceCapture';
import { toast } from 'sonner';

const statusIcon = {
  present: <CheckCircle className="h-4 w-4 text-green-500" />,
  late: <Clock className="h-4 w-4 text-yellow-500" />,
  absent: <XCircle className="h-4 w-4 text-red-500" />,
};

const StudentAttendance = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [scanningScheduleId, setScanningScheduleId] = useState<string | null>(null);

  // Get student's enrolled schedules
  const { data: enrollments, isLoading: loadingEnrollments } = useQuery({
    queryKey: ['student-enrollments', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('enrollments')
        .select('*, schedules(*, subjects(name, code))')
        .eq('student_id', user!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Get today's attendance records
  const today = new Date().toISOString().split('T')[0];
  const { data: todayRecords } = useQuery({
    queryKey: ['student-today-attendance', user?.id, today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('student_id', user!.id)
        .eq('date', today);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const getAttendanceForSchedule = (scheduleId: string) => {
    return todayRecords?.find(r => r.schedule_id === scheduleId);
  };

  const handleFaceCapture = async (descriptor: number[]) => {
    if (!scanningScheduleId) return;

    const enrollment = enrollments?.find(e => (e.schedules as any)?.id === scanningScheduleId);
    const schedule = enrollment?.schedules as any;
    if (!schedule) return;

    try {
      // Verify face matches the logged-in student
      const { data, error } = await supabase.functions.invoke('face-match', {
        body: { descriptor },
      });

      if (error || !data?.success) {
        toast.error('Face not recognized. Please try again.');
        setScanningScheduleId(null);
        return;
      }

      // Verify the matched face belongs to the current user
      if (data.user_id !== user!.id) {
        toast.error('Face does not match your account.');
        setScanningScheduleId(null);
        return;
      }

      // Determine status based on schedule time
      const now = new Date();
      const [h, m] = schedule.start_time.split(':').map(Number);
      const scheduleStart = new Date();
      scheduleStart.setHours(h, m, 0, 0);
      const diffMinutes = (now.getTime() - scheduleStart.getTime()) / 60000;
      const status = diffMinutes > 15 ? 'late' : 'present';

      const { error: insertError } = await supabase.from('attendance_records').insert({
        student_id: user!.id,
        schedule_id: scanningScheduleId,
        subject_id: schedule.subject_id,
        status: status as 'present' | 'late',
        time_in: now.toISOString(),
        verified_by: 'face_recognition',
      });

      if (insertError) throw insertError;

      toast.success(`Attendance marked as ${status}!`);
      queryClient.invalidateQueries({ queryKey: ['student-today-attendance'] });
    } catch (err: any) {
      toast.error(err.message || 'Failed to record attendance');
    } finally {
      setScanningScheduleId(null);
    }
  };

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayDow = new Date().getDay();

  // Filter to today's schedules
  const todaySchedules = enrollments?.filter(e => {
    const schedule = e.schedules as any;
    return schedule?.day_of_week === todayDow;
  }) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mark Attendance</h1>
        <p className="text-muted-foreground text-sm">
          Today is {dayNames[todayDow]} — Scan your face to mark attendance
        </p>
      </div>

      {loadingEnrollments ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : todaySchedules.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <BookOpen className="h-10 w-10 mb-3 opacity-50" />
            <p className="font-medium">No classes scheduled for today</p>
            <p className="text-sm mt-1">Check back on your class days</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {todaySchedules.map(enrollment => {
            const schedule = enrollment.schedules as any;
            const subject = schedule?.subjects as any;
            const existing = getAttendanceForSchedule(schedule.id);
            const isScanning = scanningScheduleId === schedule.id;

            return (
              <Card key={enrollment.id} className={existing ? 'border-green-200 bg-green-50/30 dark:border-green-900 dark:bg-green-950/20' : ''}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{subject?.name || 'Unknown Subject'}</CardTitle>
                    <Badge variant="outline">{subject?.code}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {schedule.start_time} – {schedule.end_time} • {schedule.section}
                    {schedule.room && ` • Room ${schedule.room}`}
                  </p>
                </CardHeader>
                <CardContent>
                  {existing ? (
                    <div className="flex items-center gap-2 text-sm">
                      {statusIcon[existing.status as keyof typeof statusIcon]}
                      <span className="font-medium capitalize">{existing.status}</span>
                      <span className="text-muted-foreground ml-auto">
                        {existing.time_in ? new Date(existing.time_in).toLocaleTimeString() : ''}
                      </span>
                    </div>
                  ) : isScanning ? (
                    <FaceCapture
                      onCapture={handleFaceCapture}
                      onCancel={() => setScanningScheduleId(null)}
                      mode="login"
                    />
                  ) : (
                    <Button
                      onClick={() => setScanningScheduleId(schedule.id)}
                      className="w-full gap-2"
                      variant="outline"
                    >
                      <ScanFace className="h-4 w-4" />
                      Scan Face to Mark Attendance
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* All enrolled subjects overview */}
      {enrollments && enrollments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">All Enrolled Subjects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {enrollments.map(enrollment => {
                const schedule = enrollment.schedules as any;
                const subject = schedule?.subjects as any;
                return (
                  <div key={enrollment.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                    <div>
                      <span className="font-medium">{subject?.name}</span>
                      <span className="text-muted-foreground ml-2">({subject?.code})</span>
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {dayNames[schedule.day_of_week]} {schedule.start_time}–{schedule.end_time}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StudentAttendance;
