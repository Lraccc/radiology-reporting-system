'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase';
import { Upload, Eye, FileImage, FileVideo, Plus } from 'lucide-react';
import { toast } from 'sonner';

type Case = {
  id: string;
  case_number: string;
  patient_name: string;
  patient_id: string;
  study_type: string;
  status: string;
  created_at: string;
  assigned_to: string;
  doctor_name?: string;
};

type Doctor = {
  id: string;
  full_name: string;
  email: string;
};

export default function RadTechDashboard() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [cases, setCases] = useState<Case[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loadingCases, setLoadingCases] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [newCase, setNewCase] = useState({
    patient_name: '',
    patient_id: '',
    study_type: '',
    assigned_to: '',
  });
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!loading && (!user || profile?.role !== 'rad_tech')) {
      router.push('/dashboard');
    }
  }, [user, profile, loading, router]);

  useEffect(() => {
    if (user && profile?.role === 'rad_tech') {
      fetchCases();
      fetchDoctors();
    }
  }, [user, profile]);

  const fetchDoctors = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('role', 'doctor')
        .order('full_name');

      if (error) throw error;
      setDoctors(data || []);
    } catch (error: any) {
      toast.error('Failed to fetch doctors');
    }
  };

  const fetchCases = async () => {
    try {
      setLoadingCases(true);
      const { data, error } = await supabase
        .from('cases')
        .select(`
          *,
          profiles!cases_assigned_to_fkey(full_name)
        `)
        .eq('uploaded_by', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedCases = data?.map((c: any) => ({
        ...c,
        doctor_name: c.profiles?.full_name,
      })) || [];

      setCases(formattedCases);
    } catch (error: any) {
      toast.error('Failed to fetch cases');
    } finally {
      setLoadingCases(false);
    }
  };

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newCase.patient_name || !newCase.patient_id || !newCase.study_type || !newCase.assigned_to) {
      toast.error('Please fill in all fields');
      return;
    }

    if (files.length === 0) {
      toast.error('Please select at least one file');
      return;
    }

    setUploading(true);

    try {
      const caseNumber = `CASE-${Date.now()}`;

      const { data: caseData, error: caseError } = await supabase
        .from('cases')
        .insert({
          case_number: caseNumber,
          patient_name: newCase.patient_name,
          patient_id: newCase.patient_id,
          study_type: newCase.study_type,
          uploaded_by: user?.id,
          assigned_to: newCase.assigned_to,
        })
        .select()
        .single();

      if (caseError) throw caseError;

      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${caseData.id}/${Date.now()}.${fileExt}`;
        const filePath = `medical-files/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('medical-files')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const fileType = file.type.startsWith('video/') ? 'video' : 'image';

        const { error: mediaError } = await supabase
          .from('media_files')
          .insert({
            case_id: caseData.id,
            file_name: file.name,
            file_path: filePath,
            file_type: fileType,
            file_size: file.size,
          });

        if (mediaError) throw mediaError;
      }

      toast.success('Case created successfully!');
      setIsDialogOpen(false);
      setNewCase({ patient_name: '', patient_id: '', study_type: '', assigned_to: '' });
      setFiles([]);
      fetchCases();
    } catch (error: any) {
      console.error('Error creating case:', error);
      toast.error(error.message || 'Failed to create case');
    } finally {
      setUploading(false);
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

  if (loading || !profile) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">My Cases</h2>
            <p className="text-slate-600 mt-1">Upload and manage radiological cases</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Case
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Case</DialogTitle>
                <DialogDescription>
                  Upload medical images or videos and assign to a doctor
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateCase} className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="patient_name">Patient Name</Label>
                    <Input
                      id="patient_name"
                      value={newCase.patient_name}
                      onChange={(e) => setNewCase({ ...newCase, patient_name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="patient_id">Patient ID</Label>
                    <Input
                      id="patient_id"
                      value={newCase.patient_id}
                      onChange={(e) => setNewCase({ ...newCase, patient_id: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="study_type">Study Type</Label>
                  <Select value={newCase.study_type} onValueChange={(value) => setNewCase({ ...newCase, study_type: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select study type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="X-Ray">X-Ray</SelectItem>
                      <SelectItem value="CT Scan">CT Scan</SelectItem>
                      <SelectItem value="MRI">MRI</SelectItem>
                      <SelectItem value="Ultrasound">Ultrasound</SelectItem>
                      <SelectItem value="Mammography">Mammography</SelectItem>
                      <SelectItem value="PET Scan">PET Scan</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assigned_to">Assign to Doctor</Label>
                  <Select value={newCase.assigned_to} onValueChange={(value) => setNewCase({ ...newCase, assigned_to: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select doctor" />
                    </SelectTrigger>
                    <SelectContent>
                      {doctors.map((doctor) => (
                        <SelectItem key={doctor.id} value={doctor.id}>
                          {doctor.full_name} ({doctor.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="files">Upload Files (Images/Videos)</Label>
                  <Input
                    id="files"
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={(e) => setFiles(Array.from(e.target.files || []))}
                    required
                  />
                  {files.length > 0 && (
                    <div className="text-sm text-slate-600 mt-2">
                      {files.length} file(s) selected
                    </div>
                  )}
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={uploading}>
                    {uploading ? 'Creating...' : 'Create Case'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Cases</CardTitle>
            <CardDescription>View all cases you have uploaded</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingCases ? (
              <div className="text-center py-8 text-slate-500">Loading cases...</div>
            ) : cases.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                No cases yet. Create your first case to get started.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Case Number</TableHead>
                    <TableHead>Patient Name</TableHead>
                    <TableHead>Study Type</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Status</TableHead>
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
                      <TableCell>{c.doctor_name}</TableCell>
                      <TableCell>{getStatusBadge(c.status)}</TableCell>
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
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
