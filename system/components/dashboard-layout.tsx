'use client';

import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Activity, LogOut, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Link from 'next/link';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { profile, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
      router.push('/login');
    } catch (error: any) {
      toast.error('Failed to sign out');
    }
  };

  const roleDisplay = profile?.role === 'rad_tech' ? 'Radiological Technician' : 'Doctor';
  const initials = profile?.full_name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '';

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Radiology Management</h1>
                <p className="text-xs text-slate-500">{roleDisplay}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                href="/dashboard/profile"
                className="flex items-center space-x-3 hover:bg-slate-100 rounded-lg px-3 py-2 transition-colors"
              >
                <Avatar className="h-9 w-9">
                  <AvatarImage 
                    src={(profile as any)?.profile_picture_url} 
                    alt={profile?.full_name} 
                  />
                  <AvatarFallback className="bg-blue-500 text-white text-sm">
                    {initials || <User className="h-4 w-4" />}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left">
                  <p className="text-sm font-medium text-slate-900">{profile?.full_name}</p>
                  <p className="text-xs text-slate-500">{profile?.email}</p>
                </div>
              </Link>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
