import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { GraduationCap, Search } from 'lucide-react';
import { useState } from 'react';

const Students = () => {
  const [search, setSearch] = useState('');

  const { data: students, isLoading } = useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      const { data: roles, error: rolesErr } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'student');
      if (rolesErr) throw rolesErr;
      if (!roles.length) return [];

      const ids = roles.map(r => r.user_id);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', ids)
        .eq('status', 'active');
      if (error) throw error;
      return data;
    },
  });

  const filtered = students?.filter(s =>
    s.full_name.toLowerCase().includes(search.toLowerCase()) ||
    s.student_id?.toLowerCase().includes(search.toLowerCase()) ||
    s.section?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Students</h1>
        <p className="text-muted-foreground text-sm">View enrolled student profiles</p>
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
