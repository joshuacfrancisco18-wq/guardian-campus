import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import {
  Users, GraduationCap, BookOpen, Shield, ClipboardCheck,
  Clock, AlertTriangle, UserCheck, TrendingUp
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Stats {
  totalStudents: number;
  totalTeachers: number;
  totalAdmins: number;
  pendingApprovals: number;
  presentToday: number;
  lateToday: number;
  absentToday: number;
}

const StatCard = ({ icon: Icon, label, value, color, delay }: { icon: any; label: string; value: number; color: string; delay: number }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
          </div>
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${color}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

const Dashboard = () => {
  const { roles, profile } = useAuth();
  const isAdmin = roles.includes('admin');
  const [stats, setStats] = useState<Stats>({
    totalStudents: 0, totalTeachers: 0, totalAdmins: 0,
    pendingApprovals: 0, presentToday: 0, lateToday: 0, absentToday: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      if (!isAdmin) return;

      const today = new Date().toISOString().split('T')[0];

      const [students, teachers, admins, pending, present, late, absent] = await Promise.all([
        supabase.from('user_roles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
        supabase.from('user_roles').select('*', { count: 'exact', head: true }).eq('role', 'teacher'),
        supabase.from('user_roles').select('*', { count: 'exact', head: true }).eq('role', 'admin'),
        supabase.from('approval_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('attendance_records').select('*', { count: 'exact', head: true }).eq('date', today).eq('status', 'present'),
        supabase.from('attendance_records').select('*', { count: 'exact', head: true }).eq('date', today).eq('status', 'late'),
        supabase.from('attendance_records').select('*', { count: 'exact', head: true }).eq('date', today).eq('status', 'absent'),
      ]);

      setStats({
        totalStudents: students.count || 0,
        totalTeachers: teachers.count || 0,
        totalAdmins: admins.count || 0,
        pendingApprovals: pending.count || 0,
        presentToday: present.count || 0,
        lateToday: late.count || 0,
        absentToday: absent.count || 0,
      });
    };
    fetchStats();
  }, [isAdmin]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          Welcome back, {profile?.full_name || 'User'}
        </h1>
        <p className="text-muted-foreground">
          {isAdmin ? 'System overview and management' : 'Your attendance and activity overview'}
        </p>
      </div>

      {isAdmin && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={GraduationCap} label="Total Students" value={stats.totalStudents} color="bg-primary" delay={0} />
            <StatCard icon={BookOpen} label="Total Teachers" value={stats.totalTeachers} color="bg-accent" delay={0.05} />
            <StatCard icon={Shield} label="Total Admins" value={stats.totalAdmins} color="gradient-primary" delay={0.1} />
            <StatCard icon={AlertTriangle} label="Pending Approvals" value={stats.pendingApprovals} color="bg-warning" delay={0.15} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard icon={UserCheck} label="Present Today" value={stats.presentToday} color="bg-success" delay={0.2} />
            <StatCard icon={Clock} label="Late Today" value={stats.lateToday} color="bg-warning" delay={0.25} />
            <StatCard icon={Users} label="Absent Today" value={stats.absentToday} color="bg-destructive" delay={0.3} />
          </div>
        </>
      )}

      {!isAdmin && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard icon={UserCheck} label="Present Days" value={0} color="bg-success" delay={0} />
          <StatCard icon={Clock} label="Late Days" value={0} color="bg-warning" delay={0.05} />
          <StatCard icon={AlertTriangle} label="Absent Days" value={0} color="bg-destructive" delay={0.1} />
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">No recent activity to display.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
