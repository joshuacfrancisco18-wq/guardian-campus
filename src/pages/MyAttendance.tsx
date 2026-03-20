import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ClipboardCheck } from 'lucide-react';

const statusColor = { present: 'default', late: 'secondary', absent: 'destructive' } as const;

const MyAttendance = () => {
  const { user } = useAuth();

  const { data: records, isLoading } = useQuery({
    queryKey: ['my-attendance', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attendance_records')
        .select('*, subjects(name, code)')
        .eq('student_id', user!.id)
        .order('date', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Attendance</h1>
        <p className="text-muted-foreground text-sm">View your attendance history</p>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12"><div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>
          ) : !records?.length ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <ClipboardCheck className="h-10 w-10 mb-3 opacity-50" />
              <p>No attendance records yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium">Date</th>
                  <th className="text-left px-4 py-3 font-medium">Subject</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium">Time In</th>
                </tr></thead>
                <tbody>
                  {records.map(r => (
                    <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">{r.date}</td>
                      <td className="px-4 py-3 font-medium">{(r.subjects as any)?.name || '—'}</td>
                      <td className="px-4 py-3">
                        <Badge variant={statusColor[r.status as keyof typeof statusColor] || 'secondary'}>{r.status}</Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{r.time_in ? new Date(r.time_in).toLocaleTimeString() : '—'}</td>
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

export default MyAttendance;
