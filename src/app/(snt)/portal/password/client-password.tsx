"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { changeUserPassword } from '@/app/actions/user'
import { AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export function PasswordClient({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)

  const [formData, setFormData] = useState({
    currentPass: '',
    newPass: '',
    confirmPass: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (formData.newPass !== formData.confirmPass) {
      setError('Konfirmasi password tidak cocok!')
      return
    }

    if (formData.newPass.length < 6) {
      setError('Password baru minimal 6 karakter.')
      return
    }

    setLoading(true)
    try {
      const res = await changeUserPassword(userId, formData.currentPass, formData.newPass)
      if (res.error) throw new Error(res.error)
      setSuccess(true)
      setFormData({ currentPass: '', newPass: '', confirmPass: '' })
    } catch (err: any) {
      setError(err.message || 'Gagal mengubah password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 space-y-6 max-w-md mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Keamanan</h1>
        <p className="text-slate-500 mt-1">Ubah kata sandi akun Anda</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ganti Password</CardTitle>
          <CardDescription>Pastikan Anda menggunakan kata sandi yang kuat dan mudah diingat.</CardDescription>
        </CardHeader>
        <CardContent>
          {success && (
            <Alert className="bg-emerald-50 text-emerald-800 border-emerald-200 mb-4">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <AlertTitle>Berhasil!</AlertTitle>
              <AlertDescription>Password Anda telah berhasil diubah.</AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Gagal</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Password Saat Ini</Label>
              <div className="relative">
                <Input 
                  type={showCurrent ? 'text' : 'password'}
                  value={formData.currentPass} 
                  onChange={e => setFormData({...formData, currentPass: e.target.value})} 
                  required 
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowCurrent(!showCurrent)}
                >
                  {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Password Baru</Label>
              <div className="relative">
                <Input 
                  type={showNew ? 'text' : 'password'}
                  value={formData.newPass} 
                  onChange={e => setFormData({...formData, newPass: e.target.value})} 
                  required 
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowNew(!showNew)}
                >
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Konfirmasi Password Baru</Label>
              <Input 
                type="password"
                value={formData.confirmPass} 
                onChange={e => setFormData({...formData, confirmPass: e.target.value})} 
                required 
              />
            </div>

            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white mt-4" disabled={loading}>
              {loading ? 'Menyimpan...' : 'Perbarui Password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

