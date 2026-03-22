import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ClipboardCheck } from 'lucide-react';

const statusColor = (status: string) => {
  switch (status) {
    case 'present': return 'bg-green-500/10 text-green-600 border-green-200';
    case 'late': return 'bg-yellow-500/10 text-yellow-600 border-yellow-200';
    case 'absent': return 'bg-red-500/10 text-red-600 border-red-200';
    default: return '';
  }
};

const Attendance = () => {
  const { user, roles } = useAuth();
  const isAdmin = roles.includes('admin');
  const isTeacher = roles.includes('teacher');

  const { data: records, isLoading } = useQuery({
    queryKey: ['attendance-records', user?.id, isAdmin, isTeacher],
    queryFn: async () => {
      let query = supabase
        .from('attendance_records')
        .select('*, subjects(name, code), profiles!attendance_records_student_id_fkey(full_name, student_id)')
        .order('date', { ascending: false })
        .limit(100);

      // Students only see own records
      if (!isAdmin && !isTeacher) {
        query = query.eq('student_id', user!.id);
      }

      // Teachers see records for their schedules
      if (isTeacher && !isAdmin) {
        const { data: teacherSchedules } = await supabase
          .from('schedules')
          .select('id')
          .eq('teacher_id', user!.id);
        const scheduleIds = teacherSchedules?.map(s => s.id) || [];
        if (scheduleIds.length > 0) {
          query = query.in('schedule_id', scheduleIds);
        } else {
          return [];
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: studentProfiles } = useQuery({
    queryKey: ['student-profiles-for-attendance', records],
    queryFn: async () => {
      if (!records?.length) return {};
      const ids = [...new Set(records.map(r => r.student_id))];
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, student_id')
        .in('user_id', ids);
      if (error) throw error;
      const map: Record<string, { full_name: string; student_id: string | null }> = {};
      data?.forEach(p => { map[p.user_id] = p; });
      return map;
    },
    enabled: (isAdmin || isTeacher) && !!records?.length,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Attendance Records</h1>
        <p className="text-muted-foreground text-sm">
          {isAdmin ? 'View all attendance records' : isTeacher ? 'View attendance for your classes' : 'View your attendance records'}
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12"><div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>
          ) : records?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <ClipboardCheck className="h-10 w-10 mb-3 opacity-50" />
              <p>No attendance records yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium">Date</th>
                  {(isAdmin || isTeacher) && <th className="text-left px-4 py-3 font-medium">Student</th>}
                  <th className="text-left px-4 py-3 font-medium">Subject</th>
                  <th className="text-left px-4 py-3 font-medium">Time In</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium">Suspicious</th>
                </tr></thead>
                <tbody>
                  {records?.map(r => (
                    <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">{r.date}</td>
                      {(isAdmin || isTeacher) && (
                        <td className="px-4 py-3 font-medium">
                          {studentProfiles?.[r.student_id]?.full_name || '—'}
                        </td>
                      )}
                      <td className="px-4 py-3 font-medium">{(r.subjects as any)?.name || '—'}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {r.time_in ? new Date(r.time_in).toLocaleTimeString() : '—'}
                      </td>
                      <td className="px-4 py-3"><Badge variant="outline" className={`capitalize ${statusColor(r.status)}`}>{r.status}</Badge></td>
                      <td className="px-4 py-3">{r.suspicious ? '⚠️' : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Attendance;
