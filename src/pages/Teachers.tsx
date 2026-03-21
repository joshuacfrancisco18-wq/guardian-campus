import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GraduationCap, Search, UserX, UserCheck } from 'lucide-react';
import { toast } from 'sonner';

const Teachers = () => {
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const { data: teacherProfiles, isLoading } = useQuery({
    queryKey: ['admin-teachers'],
    queryFn: async () => {
      const { data: roles, error: rErr } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'teacher');
      if (rErr) throw rErr;
      if (!roles.length) return [];
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', roles.map(r => r.user_id));
      if (error) throw error;
      return data;
    },
  });

  const { data: schedules } = useQuery({
    queryKey: ['teacher-schedules-count'],
    queryFn: async () => {
      const { data, error } = await supabase.from('schedules').select('teacher_id, id');
      if (error) throw error;
      return data;
    },
  });

  const toggleStatus = useMutation({
    mutationFn: async ({ userId, newStatus }: { userId: string; newStatus: string }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus as any })
        .eq('user_id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-teachers'] });
      toast.success('Teacher status updated');
    },
    onError: () => toast.error('Failed to update status'),
  });

  const getScheduleCount = (userId: string) =>
    schedules?.filter(s => s.teacher_id === userId).length || 0;

  const filtered = teacherProfiles?.filter(p =>
    p.full_name.toLowerCase().includes(search.toLowerCase()) ||
    p.email.toLowerCase().includes(search.toLowerCase()) ||
    (p.department || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Teachers</h1>
          <p className="text-muted-foreground text-sm">Manage teacher accounts and assignments</p>
        </div>
        <Badge variant="outline" className="gap-1">
          <GraduationCap className="h-3 w-3" />{teacherProfiles?.length || 0} teachers
        </Badge>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search teachers..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : filtered?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <GraduationCap className="h-10 w-10 mb-3 opacity-50" />
              <p>No teachers found</p>
              <p className="text-xs mt-1">Teachers will appear here after registration and approval</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left px-4 py-3 font-medium">Name</th>
                    <th className="text-left px-4 py-3 font-medium">Email</th>
                    <th className="text-left px-4 py-3 font-medium">Department</th>
                    <th className="text-left px-4 py-3 font-medium">Schedules</th>
                    <th className="text-left px-4 py-3 font-medium">Status</th>
                    <th className="text-left px-4 py-3 font-medium">Face</th>
                    <th className="text-right px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered?.map(teacher => (
                    <tr key={teacher.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium">{teacher.full_name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{teacher.email}</td>
                      <td className="px-4 py-3">{teacher.department || '—'}</td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary">{getScheduleCount(teacher.user_id)} classes</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={`capitalize ${
                          teacher.status === 'active' ? 'bg-green-500/10 text-green-600 border-green-200' :
                          teacher.status === 'suspended' ? 'bg-red-500/10 text-red-600 border-red-200' :
                          'bg-yellow-500/10 text-yellow-600 border-yellow-200'
                        }`}>
                          {teacher.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">{teacher.face_registered ? '✅' : '❌'}</td>
                      <td className="px-4 py-3 text-right">
                        {teacher.status === 'active' ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => toggleStatus.mutate({ userId: teacher.user_id, newStatus: 'suspended' })}
                          >
                            <UserX className="h-4 w-4 mr-1" /> Suspend
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-green-600 hover:text-green-600"
                            onClick={() => toggleStatus.mutate({ userId: teacher.user_id, newStatus: 'active' })}
                          >
                            <UserCheck className="h-4 w-4 mr-1" /> Activate
                          </Button>
                        )}
                      </td>
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

export default Teachers;
