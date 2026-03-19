import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Clock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface ApprovalRequest {
  id: string;
  user_id: string;
  requested_role: string;
  status: string;
  created_at: string;
  profile?: {
    full_name: string;
    email: string;
    student_id: string | null;
    section: string | null;
    course: string | null;
    department: string | null;
  };
}

const Approvals = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    const { data } = await supabase
      .from('approval_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      // Fetch profiles for each request
      const enriched = await Promise.all(data.map(async (req) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, email, student_id, section, course, department')
          .eq('user_id', req.user_id)
          .single();
        return { ...req, profile: profile || undefined };
      }));
      setRequests(enriched);
    }
    setLoading(false);
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleApproval = async (requestId: string, userId: string, approved: boolean) => {
    try {
      await supabase.from('approval_requests').update({
        status: approved ? 'active' : 'rejected',
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString(),
      }).eq('id', requestId);

      await supabase.from('profiles').update({
        status: approved ? 'active' : 'rejected',
      }).eq('user_id', userId);

      toast({
        title: approved ? 'Approved' : 'Rejected',
        description: `Account has been ${approved ? 'approved' : 'rejected'}.`,
      });
      fetchRequests();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Account Approvals</h1>
          <p className="text-muted-foreground">{pendingCount} pending request{pendingCount !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : requests.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            No approval requests yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {requests.map((req, i) => (
            <motion.div key={req.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card>
                <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted shrink-0">
                    <User className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{req.profile?.full_name || 'Unknown'}</p>
                    <p className="text-sm text-muted-foreground">{req.profile?.email}</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <Badge variant="secondary" className="capitalize">{req.requested_role}</Badge>
                      {req.profile?.student_id && <Badge variant="outline">{req.profile.student_id}</Badge>}
                      {req.profile?.course && <Badge variant="outline">{req.profile.course}</Badge>}
                      {req.profile?.department && <Badge variant="outline">{req.profile.department}</Badge>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {req.status === 'pending' ? (
                      <>
                        <Button size="sm" variant="outline" className="text-destructive" onClick={() => handleApproval(req.id, req.user_id, false)}>
                          <XCircle className="h-4 w-4 mr-1" />Reject
                        </Button>
                        <Button size="sm" className="gradient-primary text-white" onClick={() => handleApproval(req.id, req.user_id, true)}>
                          <CheckCircle className="h-4 w-4 mr-1" />Approve
                        </Button>
                      </>
                    ) : (
                      <Badge className={req.status === 'active' ? 'bg-success text-success-foreground' : 'bg-destructive text-destructive-foreground'}>
                        {req.status === 'active' ? 'Approved' : 'Rejected'}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Approvals;
