import { Activity, Upload, FileText, Users, Shield, Zap } from 'lucide-react';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function LandingBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-500 rounded-lg">
              <Activity className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-800">RadiologyHub</span>
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
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 pb-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Everything You Need in One Place
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <Card className="border-2">
            <CardHeader>
              <div className="p-3 bg-blue-100 rounded-lg w-fit mb-4">
                <Upload className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle>Easy File Upload</CardTitle>
              <CardDescription>
                Upload X-rays, CT scans, MRIs, and videos directly to the platform.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2">
            <CardHeader>
              <div className="p-3 bg-green-100 rounded-lg w-fit mb-4">
                <FileText className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle>Integrated Reporting</CardTitle>
              <CardDescription>
                Create and edit diagnostic reports directly in the system.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2">
            <CardHeader>
              <div className="p-3 bg-purple-100 rounded-lg w-fit mb-4">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle>Case Assignment</CardTitle>
              <CardDescription>
                Assign cases to specific doctors with organized dashboards.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2">
            <CardHeader>
              <div className="p-3 bg-orange-100 rounded-lg w-fit mb-4">
                <Activity className="h-6 w-6 text-orange-600" />
              </div>
              <CardTitle>Real-time Status</CardTitle>
              <CardDescription>
                Track case progress from pending to completed.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2">
            <CardHeader>
              <div className="p-3 bg-red-100 rounded-lg w-fit mb-4">
                <Shield className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle>Secure & Compliant</CardTitle>
              <CardDescription>
                Built with security in mind with row-level access control.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2">
            <CardHeader>
              <div className="p-3 bg-indigo-100 rounded-lg w-fit mb-4">
                <Zap className="h-6 w-6 text-indigo-600" />
              </div>
              <CardTitle>Lightning Fast</CardTitle>
              <CardDescription>
                Built with modern technology for blazing-fast performance.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>
    </div>
  );
}
