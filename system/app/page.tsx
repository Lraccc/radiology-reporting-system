'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Activity } from 'lucide-react';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    }
  }, [user, loading, router]);

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
