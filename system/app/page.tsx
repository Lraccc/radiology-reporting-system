'use client';

import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Upload, FileText, Users, Shield, Zap, Check, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-blue-500 rounded-full animate-pulse">
              <Activity className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-semibold text-slate-700">Loading...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-500 rounded-lg">
              <Activity className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-800">RadiologyHub</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/signup">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-block mb-4 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
            Modern Healthcare Technology
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6">
            Transform Your Radiology
            <span className="text-blue-600"> Workflow</span>
          </h1>
          <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
            Replace manual email workflows and disconnected Word documents with a unified, secure platform for managing radiological images, videos, and diagnostic reports.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/signup">
              <Button size="lg" className="text-lg px-8">
                Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="text-lg px-8">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Everything You Need in One Place
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Streamline your entire radiology workflow from image upload to final diagnosis
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <Card className="border-2 hover:border-blue-300 transition-colors">
            <CardHeader>
              <div className="p-3 bg-blue-100 rounded-lg w-fit mb-4">
                <Upload className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle>Easy File Upload</CardTitle>
              <CardDescription>
                Upload X-rays, CT scans, MRIs, and videos directly to the platform. No more emailing large files through Gmail.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-blue-300 transition-colors">
            <CardHeader>
              <div className="p-3 bg-green-100 rounded-lg w-fit mb-4">
                <FileText className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle>Integrated Reporting</CardTitle>
              <CardDescription>
                Create and edit diagnostic reports directly in the system. Say goodbye to separate Word documents.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-blue-300 transition-colors">
            <CardHeader>
              <div className="p-3 bg-purple-100 rounded-lg w-fit mb-4">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle>Case Assignment</CardTitle>
              <CardDescription>
                Rad techs assign cases to specific doctors. Doctors view only their assigned cases in an organized dashboard.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-blue-300 transition-colors">
            <CardHeader>
              <div className="p-3 bg-orange-100 rounded-lg w-fit mb-4">
                <Activity className="h-6 w-6 text-orange-600" />
              </div>
              <CardTitle>Real-time Status</CardTitle>
              <CardDescription>
                Track case progress from pending to in progress to completed. Everyone stays informed.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-blue-300 transition-colors">
            <CardHeader>
              <div className="p-3 bg-red-100 rounded-lg w-fit mb-4">
                <Shield className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle>Secure & Compliant</CardTitle>
              <CardDescription>
                Built with security in mind. Row-level security ensures users only see their authorized cases and files.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-blue-300 transition-colors">
            <CardHeader>
              <div className="p-3 bg-indigo-100 rounded-lg w-fit mb-4">
                <Zap className="h-6 w-6 text-indigo-600" />
              </div>
              <CardTitle>Lightning Fast</CardTitle>
              <CardDescription>
                Built with modern technology for blazing-fast performance. Access medical files instantly.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Roles Section */}
      <section className="bg-white py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Built for Your Entire Team
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Tailored experiences for radiological technicians and doctors
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-2xl">For Rad Techs</CardTitle>
                <CardDescription className="text-base">
                  Upload and manage medical imaging cases
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Upload medical images and videos</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Assign cases to specific doctors</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Track case status in real-time</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>View complete case history</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Access uploaded files and reports</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-2xl">For Doctors</CardTitle>
                <CardDescription className="text-base">
                  Review cases and create diagnostic reports
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>View all assigned cases in one place</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Review medical images and videos</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Create diagnostic reports directly in-app</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Update case status as work progresses</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Filter cases by status</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardContent className="text-center py-16 px-8">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                Ready to Modernize Your Radiology Workflow?
              </h2>
              <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">
                Join healthcare facilities that have replaced manual processes with our efficient, secure platform.
              </p>
              <Link href="/signup">
                <Button size="lg" className="text-lg px-8">
                  Get Started Now <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white py-8">
        <div className="container mx-auto px-4 text-center text-slate-600">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="p-1.5 bg-blue-500 rounded">
              <Activity className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-slate-800">RadiologyHub</span>
          </div>
          <p className="text-sm">
            © {new Date().getFullYear()} Hospital Radiology Management System. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
