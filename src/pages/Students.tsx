import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { GraduationCap, Search, Plus, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

const Students = () => {
  const { roles } = useAuth();
  const isAdmin = roles.includes('admin');
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [enrollForm, setEnrollForm] = useState({ student_id: '', schedule_id: '' });

  const { data: students, isLoading } = useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      const { data: studentRoles, error: rolesErr } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'student');
      if (rolesErr) throw rolesErr;
      if (!studentRoles.length) return [];

      const ids = studentRoles.map(r => r.user_id);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', ids)
        .eq('status', 'active');
      if (error) throw error;
      return data;
    },
  });

  const { data: schedules } = useQuery({
    queryKey: ['schedules-for-enroll'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('schedules')
        .select('id, section, day_of_week, start_time, subjects(name, code)')
        .order('day_of_week');
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  const { data: enrollments } = useQuery({
    queryKey: ['enrollments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('enrollments')
        .select('*');
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  const enrollMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('enrollments').insert({
        student_id: enrollForm.student_id,
        schedule_id: enrollForm.schedule_id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      toast.success('Student enrolled successfully');
      setEnrollOpen(false);
      setEnrollForm({ student_id: '', schedule_id: '' });
    },
    onError: (err: any) => {
      if (err.message?.includes('duplicate')) {
        toast.error('Student is already enrolled in this schedule');
      } else {
        toast.error('Failed to enroll student');
      }
    },
  });

  const filtered = students?.filter(s =>
    s.full_name.toLowerCase().includes(search.toLowerCase()) ||
    s.student_id?.toLowerCase().includes(search.toLowerCase()) ||
    s.section?.toLowerCase().includes(search.toLowerCase())
  );

  const getEnrollmentCount = (userId: string) =>
    enrollments?.filter(e => e.student_id === userId).length || 0;

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Students</h1>
          <p className="text-muted-foreground text-sm">View enrolled student profiles</p>
        </div>
        {isAdmin && (
          <Dialog open={enrollOpen} onOpenChange={setEnrollOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2"><UserPlus className="h-4 w-4" />Enroll Student</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Enroll Student in Schedule</DialogTitle></DialogHeader>
              <div className="grid gap-4 py-2">
                <div className="space-y-2">
                  <Label>Student</Label>
                  <Select value={enrollForm.student_id} onValueChange={v => setEnrollForm(f => ({ ...f, student_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                    <SelectContent>
                      {students?.map(s => (
                        <SelectItem key={s.user_id} value={s.user_id}>
                          {s.full_name} {s.student_id ? `(${s.student_id})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Schedule (Subject)</Label>
                  <Select value={enrollForm.schedule_id} onValueChange={v => setEnrollForm(f => ({ ...f, schedule_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select schedule" /></SelectTrigger>
                    <SelectContent>
                      {schedules?.map(s => (
                        <SelectItem key={s.id} value={s.id}>
                          {(s.subjects as any)?.name} — {s.section} ({dayNames[s.day_of_week]} {s.start_time})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={() => enrollMutation.mutate()}
                  disabled={!enrollForm.student_id || !enrollForm.schedule_id || enrollMutation.isPending}
                >
                  {enrollMutation.isPending ? 'Enrolling...' : 'Enroll Student'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search students..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12"><div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>
          ) : !filtered?.length ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <GraduationCap className="h-10 w-10 mb-3 opacity-50" />
              <p>No students found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium">Name</th>
                  <th className="text-left px-4 py-3 font-medium">Student ID</th>
                  <th className="text-left px-4 py-3 font-medium">Section</th>
                  <th className="text-left px-4 py-3 font-medium">Course</th>
                  <th className="text-left px-4 py-3 font-medium">Face</th>
                  {isAdmin && <th className="text-left px-4 py-3 font-medium">Enrolled</th>}
                </tr></thead>
                <tbody>
                  {filtered.map(s => (
                    <tr key={s.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium">{s.full_name}</td>
                      <td className="px-4 py-3">{s.student_id || '—'}</td>
                      <td className="px-4 py-3"><Badge variant="outline">{s.section || '—'}</Badge></td>
                      <td className="px-4 py-3">{s.course || '—'}</td>
                      <td className="px-4 py-3">
                        <Badge variant={s.face_registered ? 'default' : 'secondary'}>
                          {s.face_registered ? 'Registered' : 'Not Set'}
                        </Badge>
                      </td>
                      {isAdmin && (
                        <td className="px-4 py-3">
                          <Badge variant="outline">{getEnrollmentCount(s.user_id)} subjects</Badge>
                        </td>
                      )}
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

export default Students;
