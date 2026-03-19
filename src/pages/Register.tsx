import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { Shield, Mail, Lock, User, Eye, EyeOff, ArrowRight, GraduationCap, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { OTPVerificationModal } from '@/components/OTPVerificationModal';

const Register = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [form, setForm] = useState({
    fullName: '', email: '', password: '', confirmPassword: '',
    role: 'student' as 'student' | 'teacher',
    studentId: '', section: '', course: '', department: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);

  const updateForm = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast({ title: 'Error', description: 'Passwords do not match.', variant: 'destructive' });
      return;
    }
    if (form.password.length < 6) {
      toast({ title: 'Error', description: 'Password must be at least 6 characters.', variant: 'destructive' });
      return;
    }
    // Show OTP verification before creating account
    setShowOtp(true);
  };

  const handleOtpVerified = async () => {
    setShowOtp(false);
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: { full_name: form.fullName },
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) throw error;

      if (data.user) {
        await supabase.from('profiles').update({
          full_name: form.fullName,
          student_id: form.studentId || null,
          section: form.section || null,
          course: form.course || null,
          department: form.department || null,
          status: 'pending',
        }).eq('user_id', data.user.id);

        await supabase.from('user_roles').insert({
          user_id: data.user.id,
          role: form.role,
        });

        await supabase.from('approval_requests').insert({
          user_id: data.user.id,
          requested_role: form.role,
        });
      }

      toast({
        title: 'Registration Submitted!',
        description: 'Your account is pending admin approval. You will be notified once approved.',
      });
      navigate('/login');
    } catch (error: any) {
      toast({ title: 'Registration Failed', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-primary">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-xl font-bold">SecureClass</h1>
        </div>

        <Card className="border-0 shadow-xl">
          <CardContent className="p-6 lg:p-8">
            <h2 className="text-xl font-bold mb-1">Create Account</h2>
            <p className="text-sm text-muted-foreground mb-6">Register for classroom access</p>

            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="John Doe" className="pl-10" value={form.fullName} onChange={e => updateForm('fullName', e.target.value)} required />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input type="email" placeholder="you@institution.edu" className="pl-10" value={form.email} onChange={e => updateForm('email', e.target.value)} required />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={form.role} onValueChange={v => updateForm('role', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student"><span className="flex items-center gap-2"><GraduationCap className="h-4 w-4" />Student</span></SelectItem>
                    <SelectItem value="teacher"><span className="flex items-center gap-2"><BookOpen className="h-4 w-4" />Teacher</span></SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {form.role === 'student' && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2"><Label>Student ID</Label><Input placeholder="STU-001" value={form.studentId} onChange={e => updateForm('studentId', e.target.value)} /></div>
                  <div className="space-y-2"><Label>Section</Label><Input placeholder="A" value={form.section} onChange={e => updateForm('section', e.target.value)} /></div>
                  <div className="space-y-2"><Label>Course</Label><Input placeholder="BSIT" value={form.course} onChange={e => updateForm('course', e.target.value)} /></div>
                  <div className="space-y-2"><Label>Department</Label><Input placeholder="CCS" value={form.department} onChange={e => updateForm('department', e.target.value)} /></div>
                </div>
              )}

              {form.role === 'teacher' && (
                <div className="space-y-2"><Label>Department</Label><Input placeholder="Computer Science" value={form.department} onChange={e => updateForm('department', e.target.value)} /></div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input type={showPassword ? 'text' : 'password'} placeholder="••••••••" className="pl-10" value={form.password} onChange={e => updateForm('password', e.target.value)} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Confirm Password</Label>
                  <Input type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={form.confirmPassword} onChange={e => updateForm('confirmPassword', e.target.value)} required />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-xs text-muted-foreground hover:text-foreground">
                  {showPassword ? <span className="flex items-center gap-1"><EyeOff className="h-3 w-3" />Hide</span> : <span className="flex items-center gap-1"><Eye className="h-3 w-3" />Show</span>} passwords
                </button>
              </div>

              <Button type="submit" className="w-full gradient-primary text-white" disabled={loading}>
                {loading ? 'Creating Account...' : 'Register'}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-4">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-primary hover:underline">Sign in</Link>
            </p>
          </CardContent>
        </Card>
      </motion.div>

      <OTPVerificationModal
        open={showOtp}
        email={form.email}
        purpose="registration"
        onVerified={handleOtpVerified}
        onCancel={() => setShowOtp(false)}
      />
    </div>
  );
};

export default Register;
