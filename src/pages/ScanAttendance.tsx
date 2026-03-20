import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScanFace, CheckCircle, AlertTriangle } from 'lucide-react';
import FaceCapture from '@/components/FaceCapture';
import { toast } from 'sonner';

const ScanAttendance = () => {
  const { user } = useAuth();
  const [selectedSchedule, setSelectedSchedule] = useState<string>('');
  const [scanning, setScanning] = useState(false);
  const [recentScans, setRecentScans] = useState<{ name: string; status: string; time: string }[]>([]);

  const { data: schedules } = useQuery({
    queryKey: ['teacher-schedules', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('schedules')
        .select('*, subjects(name, code)')
        .eq('teacher_id', user!.id)
        .order('day_of_week');
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const handleFaceCapture = async (descriptor: number[]) => {
    if (!selectedSchedule) {
      toast.error('Please select a schedule first');
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('face-match', {
        body: { descriptor },
      });

      if (error || !data?.match) {
        toast.error('Face not recognized');
        setScanning(false);
        return;
      }

      const schedule = schedules?.find(s => s.id === selectedSchedule);
      if (!schedule) return;

      const now = new Date();
      const startTime = schedule.start_time;
      const [h, m] = startTime.split(':').map(Number);
      const scheduleStart = new Date();
      scheduleStart.setHours(h, m, 0, 0);

      const diffMinutes = (now.getTime() - scheduleStart.getTime()) / 60000;
      const status = diffMinutes > 15 ? 'late' : 'present';

      const { error: insertError } = await supabase.from('attendance_records').insert({
        student_id: data.user_id,
        schedule_id: selectedSchedule,
        subject_id: schedule.subject_id,
        status: status as 'present' | 'late',
        time_in: now.toISOString(),
      });

      if (insertError) throw insertError;

      setRecentScans(prev => [
        { name: data.full_name || 'Student', status, time: now.toLocaleTimeString() },
        ...prev.slice(0, 9),
      ]);
      toast.success(`${data.full_name} marked as ${status}`);
    } catch (err) {
      toast.error('Error recording attendance');
    }
    setScanning(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Scan Attendance</h1>
        <p className="text-muted-foreground text-sm">Use face recognition to record student attendance</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <Select value={selectedSchedule} onValueChange={setSelectedSchedule}>
            <SelectTrigger>
              <SelectValue placeholder="Select a class schedule" />
            </SelectTrigger>
            <SelectContent>
              {schedules?.map(s => (
                <SelectItem key={s.id} value={s.id}>
                  {(s.subjects as any)?.name} — {s.section} ({s.start_time})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedSchedule && !scanning && (
            <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => setScanning(true)}>
              <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <ScanFace className="h-12 w-12 mb-3 opacity-50" />
                <p className="font-medium">Tap to start scanning</p>
              </CardContent>
            </Card>
          )}

          {scanning && (
            <FaceCapture onCapture={handleFaceCapture} onCancel={() => setScanning(false)} mode="login" />
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Scans</CardTitle>
          </CardHeader>
          <CardContent>
            {recentScans.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No scans yet</p>
            ) : (
              <div className="space-y-2">
                {recentScans.map((scan, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-lg border p-3">
                    {scan.status === 'present' ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    )}
                    <span className="flex-1 text-sm font-medium">{scan.name}</span>
                    <Badge variant={scan.status === 'present' ? 'default' : 'secondary'}>{scan.status}</Badge>
                    <span className="text-xs text-muted-foreground">{scan.time}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ScanAttendance;
