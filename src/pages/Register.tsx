import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Mail, Lock, User, Eye, EyeOff, ArrowRight, GraduationCap, BookOpen, Camera, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { OTPVerificationModal } from '@/components/OTPVerificationModal';
import FaceCapture from '@/components/FaceCapture';

type Step = 'details' | 'face' | 'complete';

const Register = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState<Step>('details');
  const [form, setForm] = useState({
    fullName: '', email: '', password: '', confirmPassword: '',
    role: 'student' as 'student' | 'teacher',
    studentId: '', section: '', course: '', department: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [faceDescriptor, setFaceDescriptor] = useState<number[] | null>(null);

  const updateForm = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast({ title: 'Error', description: 'Passwords do not match.', variant: 'destructive' });
      return;
    }
    if (form.password.length < 6) {
      toast({ title: 'Error', description: 'Password must be at least 6 characters.', variant: 'destructive' });
      return;
    }
    setStep('face');
  };

  const handleFaceCapture = (descriptor: number[]) => {
    setFaceDescriptor(descriptor);
    // After face capture, trigger OTP
    setShowOtp(true);
  };

  const handleSkipFace = () => {
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
          face_registered: !!faceDescriptor,
        }).eq('user_id', data.user.id);

        await supabase.from('user_roles').insert({
          user_id: data.user.id,
          role: form.role,
        });

        await supabase.from('approval_requests').insert({
          user_id: data.user.id,
          requested_role: form.role,
        });

        // Save face embedding if captured
        if (faceDescriptor) {
          await supabase.from('face_embeddings').insert({
            user_id: data.user.id,
            embedding: faceDescriptor,
          });
        }
      }

      setStep('complete');
      toast({
        title: 'Registration Submitted!',
        description: 'Your account is pending admin approval.',
      });
      setTimeout(() => navigate('/login'), 3000);
    } catch (error: any) {
      toast({ title: 'Registration Failed', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg">
        <div className="flex items-center gap-3 mb-6 justify-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-primary">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-xl font-bold">SecureClass</h1>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {['Details', 'Face Capture', 'Complete'].map((label, i) => {
            const stepIndex = i;
            const currentIndex = step === 'details' ? 0 : step === 'face' ? 1 : 2;
            return (
              <React.Fragment key={label}>
                {i > 0 && <div className={`h-px w-8 ${stepIndex <= currentIndex ? 'bg-primary' : 'bg-border'}`} />}
                <div className={`flex items-center gap-1.5 text-xs font-medium ${stepIndex <= currentIndex ? 'text-primary' : 'text-muted-foreground'}`}>
                  <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    stepIndex < currentIndex ? 'gradient-primary text-white' :
                    stepIndex === currentIndex ? 'border-2 border-primary text-primary' :
                    'border border-border text-muted-foreground'
                  }`}>
                    {stepIndex < currentIndex ? <CheckCircle className="h-3.5 w-3.5" /> : i + 1}
                  </div>
                  <span className="hidden sm:inline">{label}</span>
                </div>
              </React.Fragment>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Details */}
          {step === 'details' && (
            <motion.div key="details" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <Card className="border-0 shadow-xl">
                <CardContent className="p-6 lg:p-8">
                  <h2 className="text-xl font-bold mb-1">Create Account</h2>
                  <p className="text-sm text-muted-foreground mb-6">Enter your details to register</p>

                  <form onSubmit={handleDetailsSubmit} className="space-y-4">
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
                        <Label>Confirm</Label>
                        <Input type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={form.confirmPassword} onChange={e => updateForm('confirmPassword', e.target.value)} required />
                      </div>
                    </div>

                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                      {showPassword ? <><EyeOff className="h-3 w-3" />Hide</> : <><Eye className="h-3 w-3" />Show</>} passwords
                    </button>

                    <Button type="submit" className="w-full gradient-primary text-white">
                      Next: Face Capture <ArrowRight className="h-4 w-4" />
                    </Button>
                  </form>

                  <p className="text-center text-sm text-muted-foreground mt-4">
                    Already have an account? <Link to="/login" className="font-medium text-primary hover:underline">Sign in</Link>
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 2: Face Capture */}
          {step === 'face' && (
            <motion.div key="face" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <div className="space-y-4">
                <div className="text-center mb-2">
                  <h2 className="text-xl font-bold">Capture Your Face</h2>
                  <p className="text-sm text-muted-foreground">Complete liveness checks to register your face data</p>
                </div>

                <FaceCapture
                  onCapture={handleFaceCapture}
                  onCancel={() => setStep('details')}
                  mode="register"
                />

                <Button variant="ghost" onClick={handleSkipFace} className="w-full text-muted-foreground">
                  Skip for now (you can register face later)
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Complete */}
          {step === 'complete' && (
            <motion.div key="complete" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <Card className="border-0 shadow-xl">
                <CardContent className="p-8 text-center space-y-4">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
                    <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                  </motion.div>
                  <h2 className="text-xl font-bold">Registration Complete!</h2>
                  <p className="text-sm text-muted-foreground">
                    Your account has been submitted for admin approval. You'll be redirected to the login page shortly.
                  </p>
                  <div className="flex gap-2 justify-center text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      {faceDescriptor ? <CheckCircle className="h-3 w-3 text-green-500" /> : <Camera className="h-3 w-3" />}
                      Face {faceDescriptor ? 'Registered' : 'Skipped'}
                    </span>
                  </div>
                  <Button onClick={() => navigate('/login')} variant="outline" className="mt-4">
                    Go to Login
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
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
