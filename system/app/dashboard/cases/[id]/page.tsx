'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter, useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Save, FileImage, FileVideo, Download } from 'lucide-react';
import { toast } from 'sonner';

type CaseDetails = {
  id: string;
  case_number: string;
  patient_name: string;
  patient_id: string;
  study_type: string;
  status: string;
  created_at: string;
  uploaded_by: string;
  assigned_to: string;
  tech_name?: string;
  doctor_name?: string;
};

type MediaFile = {
  id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  uploaded_at: string;
  url?: string;
};

type Report = {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
};

export default function CaseDetailPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const caseId = params?.id as string;

  const [caseDetails, setCaseDetails] = useState<CaseDetails | null>(null);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [report, setReport] = useState<Report | null>(null);
  const [reportContent, setReportContent] = useState('');
  const [caseStatus, setCaseStatus] = useState('');
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<MediaFile | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && caseId) {
      fetchCaseDetails();
    }
  }, [user, caseId]);

  const fetchCaseDetails = async () => {
    try {
      setLoadingData(true);

      const { data: caseData, error: caseError } = await supabase
        .from('cases')
        .select(`
          *,
          tech:profiles!cases_uploaded_by_fkey(full_name),
          doctor:profiles!cases_assigned_to_fkey(full_name)
        `)
        .eq('id', caseId)
        .maybeSingle();

      if (caseError) throw caseError;
      if (!caseData) {
        toast.error('Case not found');
        router.push('/dashboard');
        return;
      }

      const formattedCase: CaseDetails = {
        ...caseData,
        tech_name: caseData.tech?.full_name,
        doctor_name: caseData.doctor?.full_name,
      };

      setCaseDetails(formattedCase);
      setCaseStatus(formattedCase.status);

      const { data: mediaData, error: mediaError } = await supabase
        .from('media_files')
        .select('*')
        .eq('case_id', caseId)
        .order('uploaded_at');

      if (mediaError) throw mediaError;

      const mediaWithUrls = await Promise.all(
        (mediaData || []).map(async (file) => {
          const { data } = await supabase.storage
            .from('medical-files')
            .createSignedUrl(file.file_path, 3600);

          return {
            ...file,
            url: data?.signedUrl,
          };
        })
      );

      setMediaFiles(mediaWithUrls);
      if (mediaWithUrls.length > 0) {
        setSelectedMedia(mediaWithUrls[0]);
      }

      const { data: reportData, error: reportError } = await supabase
        .from('reports')
        .select('*')
        .eq('case_id', caseId)
        .maybeSingle();

      if (reportError && reportError.code !== 'PGRST116') throw reportError;

      if (reportData) {
        setReport(reportData);
        setReportContent(reportData.content);
      }
    } catch (error: any) {
      console.error('Error fetching case details:', error);
      toast.error('Failed to load case details');
    } finally {
      setLoadingData(false);
    }
  };

  const handleSaveReport = async () => {
    if (!reportContent.trim()) {
      toast.error('Report cannot be empty');
      return;
    }

    setSaving(true);
    try {
      if (report) {
        const { error } = await supabase
          .from('reports')
          .update({ content: reportContent })
          .eq('id', report.id);

        if (error) throw error;
        toast.success('Report updated successfully');
      } else {
        const { error } = await supabase
          .from('reports')
          .insert({
            case_id: caseId,
            content: reportContent,
            created_by: user?.id,
          });

        if (error) throw error;
        toast.success('Report created successfully');
      }

      await fetchCaseDetails();
    } catch (error: any) {
      console.error('Error saving report:', error);
      toast.error('Failed to save report');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (caseStatus === caseDetails?.status) return;

    try {
      const { error } = await supabase
        .from('cases')
        .update({ status: caseStatus })
        .eq('id', caseId);

      if (error) throw error;
      toast.success('Case status updated');
      fetchCaseDetails();
    } catch (error: any) {
      toast.error('Failed to update status');
    }
  };

  const downloadFile = async (file: MediaFile) => {
    if (!file.url) return;

    try {
      const response = await fetch(file.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.file_name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Download started');
    } catch (error) {
      toast.error('Failed to download file');
    }
  };

  if (loading || loadingData || !profile || !caseDetails) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">Loading case details...</div>
      </DashboardLayout>
    );
  }

  const isDoctor = profile.role === 'doctor';
  const canEditReport = isDoctor && caseDetails.assigned_to === user?.id;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h2 className="text-3xl font-bold text-slate-900">{caseDetails.case_number}</h2>
              <p className="text-slate-600 mt-1">Patient: {caseDetails.patient_name}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Select value={caseStatus} onValueChange={setCaseStatus}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            {caseStatus !== caseDetails.status && (
              <Button onClick={handleUpdateStatus} size="sm">
                Update Status
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Case Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-slate-500">Patient ID</Label>
                  <p className="text-lg font-semibold">{caseDetails.patient_id}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-500">Study Type</Label>
                  <p className="text-lg font-semibold">{caseDetails.study_type}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-500">Uploaded By</Label>
                  <p className="text-lg font-semibold">{caseDetails.tech_name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-500">Assigned To</Label>
                  <p className="text-lg font-semibold">{caseDetails.doctor_name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-500">Created</Label>
                  <p className="text-lg font-semibold">
                    {new Date(caseDetails.created_at).toLocaleString()}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-500">Status</Label>
                  <div className="mt-1">
                    <Badge>{caseDetails.status.replace('_', ' ')}</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Media Files ({mediaFiles.length})</CardTitle>
              <CardDescription>Images and videos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {mediaFiles.map((file) => (
                  <div
                    key={file.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedMedia?.id === file.id
                        ? 'bg-blue-50 border-blue-300'
                        : 'hover:bg-slate-50'
                    }`}
                    onClick={() => setSelectedMedia(file)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {file.file_type === 'video' ? (
                          <FileVideo className="h-5 w-5 text-slate-600" />
                        ) : (
                          <FileImage className="h-5 w-5 text-slate-600" />
                        )}
                        <div>
                          <p className="text-sm font-medium truncate max-w-[150px]">
                            {file.file_name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {(file.file_size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadFile(file);
                        }}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {selectedMedia && (
          <Card>
            <CardHeader>
              <CardTitle>Media Viewer</CardTitle>
              <CardDescription>{selectedMedia.file_name}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center min-h-[400px]">
                {selectedMedia.file_type === 'video' ? (
                  <video
                    src={selectedMedia.url}
                    controls
                    className="max-w-full max-h-[600px]"
                  >
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <img
                    src={selectedMedia.url}
                    alt={selectedMedia.file_name}
                    className="max-w-full max-h-[600px] object-contain"
                  />
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Diagnostic Report</CardTitle>
                <CardDescription>
                  {report
                    ? `Last updated: ${new Date(report.updated_at).toLocaleString()}`
                    : 'No report yet'}
                </CardDescription>
              </div>
              {canEditReport && (
                <Button onClick={handleSaveReport} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : report ? 'Update Report' : 'Save Report'}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {canEditReport ? (
              <Textarea
                value={reportContent}
                onChange={(e) => setReportContent(e.target.value)}
                placeholder="Type your diagnostic report here..."
                className="min-h-[300px] font-mono text-sm"
              />
            ) : (
              <div className="min-h-[300px] p-4 border rounded-md bg-slate-50">
                {reportContent ? (
                  <p className="whitespace-pre-wrap font-mono text-sm">{reportContent}</p>
                ) : (
                  <p className="text-slate-500 text-center py-12">
                    No report has been created yet.
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
