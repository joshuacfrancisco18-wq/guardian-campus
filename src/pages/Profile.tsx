import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Camera } from 'lucide-react';
import FaceCapture from '@/components/FaceCapture';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const Profile = () => {
  const { user, profile, roles } = useAuth();
  const [showFace, setShowFace] = useState(false);
  const initials = profile?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';

  const handleFaceRegister = async (descriptor: number[]) => {
    try {
      const { error: embedErr } = await supabase.from('face_embeddings').upsert({
        user_id: user!.id,
        embedding: descriptor,
      }, { onConflict: 'user_id' });

      if (embedErr) throw embedErr;

      await supabase.from('profiles').update({ face_registered: true }).eq('user_id', user!.id);
      toast.success('Face data updated');
      setShowFace(false);
    } catch {
      toast.error('Failed to save face data');
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Profile</h1>
        <p className="text-muted-foreground text-sm">View and manage your account</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 mb-6">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-lg bg-primary/10 text-primary">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-lg font-semibold">{profile?.full_name}</h2>
              <p className="text-sm text-muted-foreground">{profile?.email}</p>
              <Badge className="mt-1 capitalize">{roles[0] || 'student'}</Badge>
            </div>
          </div>

          <div className="grid gap-3 text-sm">
            {profile?.student_id && <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Student ID</span><span>{profile.student_id}</span></div>}
            {profile?.course && <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Course</span><span>{profile.course}</span></div>}
            {profile?.section && <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Section</span><span>{profile.section}</span></div>}
            {profile?.department && <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Department</span><span>{profile.department}</span></div>}
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Face Recognition</span>
              <Badge variant={profile?.face_registered ? 'default' : 'secondary'}>{profile?.face_registered ? 'Registered' : 'Not Set'}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Face Recognition</CardTitle>
        </CardHeader>
        <CardContent>
          {showFace ? (
            <FaceCapture onCapture={handleFaceRegister} onCancel={() => setShowFace(false)} mode="register" />
          ) : (
            <Button onClick={() => setShowFace(true)} variant="outline" className="gap-2">
              <Camera className="h-4 w-4" />
              {profile?.face_registered ? 'Re-register Face' : 'Register Face'}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
