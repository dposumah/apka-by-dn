'use client';

import { useEffect } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global application error:', error);
  }, [error]);

  return (
    <html lang="id">
      <body className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-6 md:p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
            <AlertCircle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-slate-900">
              Terjadi Kendala Memuat Aplikasi
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Sistem mendeteksi kendala pada server utama. Silakan muat ulang halaman.
            </p>
          </div>

          {error?.message && (
            <div className="p-3 rounded-lg bg-slate-100 text-left text-xs font-mono text-slate-700 break-all max-h-32 overflow-y-auto">
              <span className="font-bold text-slate-900">Detail: </span>
              {error.message}
            </div>
          )}

          <div className="pt-2">
            <button
              onClick={() => reset()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors"
            >
              <RefreshCw size={15} />
              Muat Ulang Halaman
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
