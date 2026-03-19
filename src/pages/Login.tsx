import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { Shield, Mail, Lock, Eye, EyeOff, ArrowRight, ScanFace } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      // Check profile status
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('status')
          .eq('user_id', user.id)
          .single();
        
        if (profile?.status === 'pending') {
          await supabase.auth.signOut();
          toast({ title: 'Account Pending', description: 'Your account is awaiting admin approval.', variant: 'destructive' });
          return;
        }
        if (profile?.status === 'rejected') {
          await supabase.auth.signOut();
          toast({ title: 'Account Rejected', description: 'Your registration was rejected. Contact admin.', variant: 'destructive' });
          return;
        }
      }

      toast({ title: 'Welcome back!', description: 'Login successful.' });
      navigate('/dashboard');
    } catch (error: any) {
      toast({ title: 'Login Failed', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left - Branding */}
      <div className="hidden lg:flex lg:w-1/2 gradient-primary relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 opacity-10">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="absolute rounded-full bg-white" style={{
              width: Math.random() * 300 + 50, height: Math.random() * 300 + 50,
              left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.3,
            }} />
          ))}
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-white max-w-md"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <Shield className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">SecureClass</h1>
              <p className="text-xs text-white/70 uppercase tracking-widest">AI Attendance System</p>
            </div>
          </div>
          <h2 className="text-4xl font-bold leading-tight mb-4">
            Secure Classroom<br />Management
          </h2>
          <p className="text-white/80 leading-relaxed">
            AI-powered face recognition attendance with multi-factor authentication and real-time monitoring.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-4">
            {[
              { label: 'Face ID', value: 'AI Scan' },
              { label: 'Security', value: 'Multi-Factor' },
              { label: 'Tracking', value: 'Real-time' },
            ].map(item => (
              <div key={item.label} className="rounded-lg bg-white/10 backdrop-blur-sm p-3 text-center">
                <div className="text-sm font-bold">{item.value}</div>
                <div className="text-[10px] text-white/60">{item.label}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-background">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="mb-8 lg:hidden flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-primary">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-xl font-bold">SecureClass</h1>
          </div>

          <h2 className="text-2xl font-bold mb-1">Welcome back</h2>
          <p className="text-muted-foreground mb-6">Sign in to your account to continue</p>

          <Tabs defaultValue="email" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="email" className="gap-2"><Mail className="h-4 w-4" />Email</TabsTrigger>
              <TabsTrigger value="face" className="gap-2"><ScanFace className="h-4 w-4" />Face ID</TabsTrigger>
            </TabsList>

            <TabsContent value="email">
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <form onSubmit={handleEmailLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="you@institution.edu"
                          className="pl-10"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          className="pl-10 pr-10"
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <Button type="submit" className="w-full gradient-primary text-white" disabled={loading}>
                      {loading ? 'Signing in...' : 'Sign In'}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="face">
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6 flex flex-col items-center gap-4">
                  <div className="w-48 h-48 rounded-full border-4 border-dashed border-primary/30 flex items-center justify-center bg-muted">
                    <ScanFace className="h-16 w-16 text-primary/40" />
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    Face recognition login will be available after you register your face data.
                  </p>
                  <Button variant="outline" disabled className="w-full">
                    Coming Soon
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="font-medium text-primary hover:underline">
              Register here
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
