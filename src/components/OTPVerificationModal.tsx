import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Mail, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface OTPVerificationModalProps {
  open: boolean;
  email: string;
  purpose?: string;
  onVerified: () => void;
  onCancel: () => void;
}

export const OTPVerificationModal: React.FC<OTPVerificationModalProps> = ({
  open, email, purpose = 'login', onVerified, onCancel,
}) => {
  const { toast } = useToast();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [devOtp, setDevOtp] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setOtp('');
      setCountdown(60);
      setCanResend(false);
      sendOtp();
    }
  }, [open]);

  useEffect(() => {
    if (!open || countdown <= 0) {
      if (countdown <= 0) setCanResend(true);
      return;
    }
    const timer = setInterval(() => setCountdown(c => c - 1), 1000);
    return () => clearInterval(timer);
  }, [open, countdown]);

  const sendOtp = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('send-otp', {
        body: { email, purpose },
      });
      if (error) throw error;
      // Dev mode: show OTP
      if (data?.dev_otp) setDevOtp(data.dev_otp);
    } catch (err: any) {
      toast({ title: 'Error', description: 'Failed to send OTP.', variant: 'destructive' });
    }
  };

  const handleResend = async () => {
    setResending(true);
    setCountdown(60);
    setCanResend(false);
    await sendOtp();
    setResending(false);
    toast({ title: 'OTP Resent', description: 'A new code has been sent to your email.' });
  };

  const handleVerify = async () => {
    if (otp.length !== 6) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-otp', {
        body: { email, otp_code: otp, purpose },
      });
      if (error) throw error;
      if (data?.success) {
        toast({ title: 'Verified!', description: 'OTP verification successful.' });
        onVerified();
      } else {
        toast({ title: 'Invalid OTP', description: data?.error || 'Please try again.', variant: 'destructive' });
        setOtp('');
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Verification failed.', variant: 'destructive' });
      setOtp('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onCancel(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-primary">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <DialogTitle>OTP Verification</DialogTitle>
          </div>
          <DialogDescription>
            Enter the 6-digit code sent to <span className="font-medium text-foreground">{email}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-6 py-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="h-4 w-4" />
            <span>Code expires in <span className="font-mono font-bold text-foreground">{countdown}s</span></span>
          </div>

          {devOtp && (
            <div className="bg-muted rounded-lg px-4 py-2 text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Dev Mode OTP</p>
              <p className="text-2xl font-mono font-bold tracking-[0.3em]">{devOtp}</p>
            </div>
          )}

          <InputOTP maxLength={6} value={otp} onChange={setOtp}>
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>

          <div className="flex flex-col gap-3 w-full">
            <Button
              onClick={handleVerify}
              disabled={otp.length !== 6 || loading}
              className="w-full gradient-primary text-white"
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleResend}
              disabled={!canResend || resending}
              className="text-xs"
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${resending ? 'animate-spin' : ''}`} />
              {canResend ? 'Resend Code' : `Resend in ${countdown}s`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
