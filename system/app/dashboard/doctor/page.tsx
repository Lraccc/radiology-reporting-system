'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/lib/supabase';
import { Eye, FileText, Clock, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

type Case = {
  id: string;
  case_number: string;
  patient_name: string;
  patient_id: string;
  study_type: string;
  status: string;
  created_at: string;
  uploaded_by: string;
  tech_name?: string;
  has_report?: boolean;
};

export default function DoctorDashboard() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [cases, setCases] = useState<Case[]>([]);
  const [loadingCases, setLoadingCases] = useState(true);

  useEffect(() => {
    if (!loading && (!user || profile?.role !== 'doctor')) {
      router.push('/dashboard');
    }
  }, [user, profile, loading, router]);

  useEffect(() => {
    if (user && profile?.role === 'doctor') {
      fetchCases();
    }
  }, [user, profile]);

  const fetchCases = async () => {
    try {
      setLoadingCases(true);
      const { data: casesData, error: casesError } = await supabase
        .from('cases')
        .select(`
          *,
          profiles!cases_uploaded_by_fkey(full_name)
        `)
        .eq('assigned_to', user?.id)
        .order('created_at', { ascending: false });

      if (casesError) throw casesError;

      const caseIds = casesData?.map(c => c.id) || [];

      let reportsData: any[] = [];
      if (caseIds.length > 0) {
        const { data, error: reportsError } = await supabase
          .from('reports')
          .select('case_id')
          .in('case_id', caseIds);

        if (reportsError) throw reportsError;
        reportsData = data || [];
      }

      const formattedCases = casesData?.map((c: any) => ({
        ...c,
        tech_name: c.profiles?.full_name,
        has_report: reportsData.some(r => r.case_id === c.id),
      })) || [];

      setCases(formattedCases);
    } catch (error: any) {
      toast.error('Failed to fetch cases');
    } finally {
      setLoadingCases(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'outline'> = {
      pending: 'secondary',
      in_progress: 'default',
      completed: 'outline',
    };
    return <Badge variant={variants[status] || 'default'}>{status.replace('_', ' ')}</Badge>;
  };

  const pendingCases = cases.filter(c => c.status === 'pending');
  const inProgressCases = cases.filter(c => c.status === 'in_progress');
  const completedCases = cases.filter(c => c.status === 'completed');

  if (loading || !profile) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">My Cases</h2>
          <p className="text-slate-600 mt-1">Review cases and create diagnostic reports</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingCases.length}</div>
              <p className="text-xs text-muted-foreground">Awaiting review</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <FileText className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inProgressCases.length}</div>
              <p className="text-xs text-muted-foreground">Currently working on</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedCases.length}</div>
              <p className="text-xs text-muted-foreground">Reports submitted</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Assigned Cases</CardTitle>
            <CardDescription>Cases assigned to you for review</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" className="w-full">
              <TabsList>
                <TabsTrigger value="all">All Cases</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="in_progress">In Progress</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
              </TabsList>
              <TabsContent value="all">
                <CasesTable cases={cases} router={router} loading={loadingCases} getStatusBadge={getStatusBadge} />
              </TabsContent>
              <TabsContent value="pending">
                <CasesTable cases={pendingCases} router={router} loading={loadingCases} getStatusBadge={getStatusBadge} />
              </TabsContent>
              <TabsContent value="in_progress">
                <CasesTable cases={inProgressCases} router={router} loading={loadingCases} getStatusBadge={getStatusBadge} />
              </TabsContent>
              <TabsContent value="completed">
                <CasesTable cases={completedCases} router={router} loading={loadingCases} getStatusBadge={getStatusBadge} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

function CasesTable({
  cases,
  router,
  loading,
  getStatusBadge
}: {
  cases: Case[];
  router: any;
  loading: boolean;
  getStatusBadge: (status: string) => JSX.Element;
}) {
  if (loading) {
    return <div className="text-center py-8 text-slate-500">Loading cases...</div>;
  }

  if (cases.length === 0) {
    return <div className="text-center py-8 text-slate-500">No cases found.</div>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Case Number</TableHead>
          <TableHead>Patient Name</TableHead>
          <TableHead>Study Type</TableHead>
          <TableHead>Uploaded By</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Report</TableHead>
          <TableHead>Created</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {cases.map((c) => (
          <TableRow key={c.id}>
            <TableCell className="font-medium">{c.case_number}</TableCell>
            <TableCell>{c.patient_name}</TableCell>
            <TableCell>{c.study_type}</TableCell>
            <TableCell>{c.tech_name}</TableCell>
            <TableCell>{getStatusBadge(c.status)}</TableCell>
            <TableCell>
              {c.has_report ? (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <FileText className="h-3 w-3 mr-1" />
                  Has Report
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-slate-50 text-slate-600">
                  No Report
                </Badge>
              )}
            </TableCell>
            <TableCell>{new Date(c.created_at).toLocaleDateString()}</TableCell>
            <TableCell>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/dashboard/cases/${c.id}`)}
              >
                <Eye className="h-4 w-4 mr-1" />
                View
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
