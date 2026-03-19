import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Settings, Shield, Mail, ScanFace } from 'lucide-react';

const SettingsPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm">System configuration and preferences</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Shield className="h-4 w-4" />Security Settings</CardTitle>
            <CardDescription>Configure authentication and security options</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between"><span>OTP Verification</span><Badge variant="outline" className="bg-green-500/10 text-green-600">Enabled</Badge></div>
            <div className="flex items-center justify-between"><span>Face Recognition</span><Badge variant="outline" className="bg-green-500/10 text-green-600">Enabled</Badge></div>
            <div className="flex items-center justify-between"><span>Anti-Spoofing</span><Badge variant="outline" className="bg-green-500/10 text-green-600">Active</Badge></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Mail className="h-4 w-4" />Email Configuration</CardTitle>
            <CardDescription>OTP email delivery settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between"><span>Sender Email</span><span className="text-muted-foreground">kellinalfonso01@gmail.com</span></div>
            <div className="flex items-center justify-between"><span>OTP Expiry</span><Badge variant="outline">60 seconds</Badge></div>
            <div className="flex items-center justify-between"><span>SMTP Status</span><Badge variant="outline" className="bg-yellow-500/10 text-yellow-600">Dev Mode</Badge></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><ScanFace className="h-4 w-4" />Face Recognition</CardTitle>
            <CardDescription>AI model and detection settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between"><span>Model</span><Badge variant="outline">TinyFaceDetector</Badge></div>
            <div className="flex items-center justify-between"><span>Match Threshold</span><span className="text-muted-foreground">0.6</span></div>
            <div className="flex items-center justify-between"><span>Liveness Detection</span><Badge variant="outline" className="bg-green-500/10 text-green-600">Blink + Head</Badge></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Settings className="h-4 w-4" />System Info</CardTitle>
            <CardDescription>Platform information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between"><span>Version</span><span className="text-muted-foreground">1.0.0</span></div>
            <div className="flex items-center justify-between"><span>Platform</span><Badge variant="outline">SecureClass AI</Badge></div>
            <div className="flex items-center justify-between"><span>Backend</span><Badge variant="outline" className="bg-green-500/10 text-green-600">Connected</Badge></div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SettingsPage;
