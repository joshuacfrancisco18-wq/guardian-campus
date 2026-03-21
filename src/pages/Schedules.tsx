import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const Schedules = () => {
  const { roles, user } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = roles.includes('admin');
  const isTeacher = roles.includes('teacher');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    subject_id: '',
    teacher_id: '',
    day_of_week: '1',
    start_time: '08:00',
    end_time: '09:00',
    section: '',
    room: '',
  });

  const { data: schedules, isLoading } = useQuery({
    queryKey: ['schedules', isTeacher ? user?.id : 'all'],
    queryFn: async () => {
      let query = supabase.from('schedules').select('*, subjects(name, code)').order('day_of_week');
      if (isTeacher && user) {
        query = query.eq('teacher_id', user.id);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const { data: subjects } = useQuery({
    queryKey: ['subjects-list'],
    queryFn: async () => {
      const { data, error } = await supabase.from('subjects').select('id, name, code');
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  const { data: teachers } = useQuery({
    queryKey: ['teachers-list'],
    queryFn: async () => {
      const { data: roles, error: rErr } = await supabase.from('user_roles').select('user_id').eq('role', 'teacher');
      if (rErr) throw rErr;
      if (!roles.length) return [];
      const { data, error } = await supabase.from('profiles').select('user_id, full_name').in('user_id', roles.map(r => r.user_id));
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('schedules').insert({
        subject_id: form.subject_id,
        teacher_id: form.teacher_id,
        day_of_week: parseInt(form.day_of_week),
        start_time: form.start_time,
        end_time: form.end_time,
        section: form.section,
        room: form.room || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      toast.success('Schedule created');
      setOpen(false);
      setForm({ subject_id: '', teacher_id: '', day_of_week: '1', start_time: '08:00', end_time: '09:00', section: '', room: '' });
    },
    onError: () => toast.error('Failed to create schedule'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('schedules').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      toast.success('Schedule deleted');
    },
    onError: () => toast.error('Failed to delete schedule'),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Schedules</h1>
          <p className="text-muted-foreground text-sm">View and manage class schedules</p>
        </div>
        {isAdmin && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2"><Plus className="h-4 w-4" />Add Schedule</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Schedule</DialogTitle></DialogHeader>
              <div className="grid gap-4 py-2">
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Select value={form.subject_id} onValueChange={v => setForm(f => ({ ...f, subject_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                    <SelectContent>
                      {subjects?.map(s => <SelectItem key={s.id} value={s.id}>{s.name} ({s.code})</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Teacher</Label>
                  <Select value={form.teacher_id} onValueChange={v => setForm(f => ({ ...f, teacher_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select teacher" /></SelectTrigger>
                    <SelectContent>
                      {teachers?.map(t => <SelectItem key={t.user_id} value={t.user_id}>{t.full_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Day</Label>
                  <Select value={form.day_of_week} onValueChange={v => setForm(f => ({ ...f, day_of_week: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {dayNames.map((d, i) => <SelectItem key={i} value={String(i)}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Time</Label>
                    <Input type="time" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>End Time</Label>
                    <Input type="time" value={form.end_time} onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Section</Label>
                    <Input placeholder="e.g. BSIT-3A" value={form.section} onChange={e => setForm(f => ({ ...f, section: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Room</Label>
                    <Input placeholder="e.g. Room 301" value={form.room} onChange={e => setForm(f => ({ ...f, room: e.target.value }))} />
                  </div>
                </div>
                <Button
                  onClick={() => createMutation.mutate()}
                  disabled={!form.subject_id || !form.teacher_id || !form.section || createMutation.isPending}
                >
                  {createMutation.isPending ? 'Creating...' : 'Create Schedule'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12"><div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>
          ) : schedules?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Calendar className="h-10 w-10 mb-3 opacity-50" />
              <p>No schedules created yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium">Day</th>
                  <th className="text-left px-4 py-3 font-medium">Subject</th>
                  <th className="text-left px-4 py-3 font-medium">Section</th>
                  <th className="text-left px-4 py-3 font-medium">Time</th>
                  <th className="text-left px-4 py-3 font-medium">Room</th>
                  {isAdmin && <th className="text-right px-4 py-3 font-medium">Actions</th>}
                </tr></thead>
                <tbody>
                  {schedules?.map(s => (
                    <tr key={s.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">{dayNames[s.day_of_week]}</td>
                      <td className="px-4 py-3 font-medium">{(s.subjects as any)?.name || '—'}</td>
                      <td className="px-4 py-3"><Badge variant="outline">{s.section}</Badge></td>
                      <td className="px-4 py-3 text-muted-foreground">{s.start_time} - {s.end_time}</td>
                      <td className="px-4 py-3">{s.room || '—'}</td>
                      {isAdmin && (
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => deleteMutation.mutate(s.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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

export default Schedules;
