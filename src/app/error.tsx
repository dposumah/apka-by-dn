'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled runtime error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-6 md:p-8 text-center space-y-6">
        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
          <AlertCircle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold text-slate-900">
            Terjadi Kendala Memuat Halaman
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Sistem mendeteksi kendala koneksi atau proses server. Anda dapat mencoba memuat ulang halaman ini.
          </p>
        </div>

        {error?.message && (
          <div className="p-3 rounded-lg bg-slate-100 text-left text-xs font-mono text-slate-700 break-all max-h-32 overflow-y-auto">
            <span className="font-bold text-slate-900">Detail: </span>
            {error.message}
            {error.digest && (
              <span className="block text-[10px] text-slate-400 mt-1">
                Digest: {error.digest}
              </span>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
          <Button
            onClick={() => reset()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 font-medium"
          >
            <RefreshCw size={15} />
            Coba Muat Ulang
          </Button>
          <Link href="/login">
            <Button variant="outline" className="w-full sm:w-auto gap-2 border-slate-300">
              <Home size={15} />
              Ke Halaman Login
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
