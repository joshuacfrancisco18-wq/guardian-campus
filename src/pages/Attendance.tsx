import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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
  const { data: records, isLoading } = useQuery({
    queryKey: ['attendance-records'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attendance_records')
        .select('*, subjects(name, code)')
        .order('date', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Attendance Records</h1>
        <p className="text-muted-foreground text-sm">View all attendance records</p>
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
                  <th className="text-left px-4 py-3 font-medium">Subject</th>
                  <th className="text-left px-4 py-3 font-medium">Time In</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium">Suspicious</th>
                </tr></thead>
                <tbody>
                  {records?.map(r => (
                    <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">{r.date}</td>
                      <td className="px-4 py-3 font-medium">{(r.subjects as any)?.name || '—'}</td>
                      <td className="px-4 py-3 text-muted-foreground">{r.time_in || '—'}</td>
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
