"use client"

import { useState } from 'react'
import { resetUserPassword } from '@/app/actions/user'
import { Button } from '@/components/ui/button'
import { AlertCircle, CheckCircle2 } from 'lucide-react'

export function ResetPasswordButton({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleReset = async () => {
    if (!confirm('Apakah Anda yakin ingin mereset kata sandi fasilitator ini ke standar (SNT2026)?')) return;
    
    setLoading(true)
    setStatus('idle')
    try {
      await resetUserPassword(userId)
      setStatus('success')
    } catch (error) {
      setStatus('error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-4 p-4 border rounded-lg bg-slate-50">
      <h4 className="font-semibold text-slate-900 mb-2">Reset Kata Sandi Akun</h4>
      <p className="text-sm text-slate-500 mb-4">Kembalikan kata sandi fasilitator ini ke standar awal (SNT2026) jika mereka melupakannya.</p>
      
      <div className="flex items-center gap-3">
        <Button 
          variant="destructive" 
          onClick={handleReset} 
          disabled={loading}
        >
          {loading ? 'Mereset...' : 'Reset Password (SNT2026)'}
        </Button>
        
        {status === 'success' && <span className="text-sm text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-4 h-4"/> Berhasil direset</span>}
        {status === 'error' && <span className="text-sm text-red-600 flex items-center gap-1"><AlertCircle className="w-4 h-4"/> Gagal mereset</span>}
      </div>
    </div>
  )
}
