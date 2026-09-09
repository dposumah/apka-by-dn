"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { updateAdminAccount, changeUserPassword, createKorwilUser } from '@/app/actions/user'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useRouter } from 'next/navigation'

export function SntAkunClient({ user }: { user: any }) {
  const router = useRouter()
  
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState(false)
  const [profileError, setProfileError] = useState('')
  const [formData, setFormData] = useState({
    name: user.name || '',
    email: user.email || '',
  })

  const [passLoading, setPassLoading] = useState(false)
  const [passSuccess, setPassSuccess] = useState(false)
  const [passError, setPassError] = useState('')
  const [passData, setPassData] = useState({
    currentPass: '',
    newPass: '',
    confirmPass: '',
  })

  
  const [newKorwilLoading, setNewKorwilLoading] = useState(false)
  const [newKorwilSuccess, setNewKorwilSuccess] = useState(false)
  const [newKorwilError, setNewKorwilError] = useState('')
  const [newKorwilData, setNewKorwilData] = useState({ name: '', email: '', password: '' })

  const handleNewKorwil = async (e: React.FormEvent) => {
    e.preventDefault()
    setNewKorwilLoading(true)
    setNewKorwilSuccess(false)
    setNewKorwilError('')
    try {
      const res = await createKorwilUser(newKorwilData)
      if (res.error) throw new Error(res.error)
      setNewKorwilSuccess(true)
      setNewKorwilData({ name: '', email: '', password: '' })
    } catch (err: any) {
      setNewKorwilError(err.message || 'Gagal membuat akun')
    } finally {
      setNewKorwilLoading(false)
    }
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileLoading(true)
    setProfileSuccess(false)
    setProfileError('')
    try {
      const res = await updateAdminAccount(user.id, formData)
      if (res.error) throw new Error(res.error)
      setProfileSuccess(true)
      router.refresh()
    } catch (err: any) {
      setProfileError(err.message || 'Gagal menyimpan profil')
    } finally {
      setProfileLoading(false)
    }
  }

  const handlePassSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPassLoading(true)
    setPassSuccess(false)
    setPassError('')

    if (passData.newPass !== passData.confirmPass) {
      setPassError('Konfirmasi password tidak cocok!')
      setPassLoading(false)
      return
    }

    try {
      const res = await changeUserPassword(user.id, passData.currentPass, passData.newPass)
      if (res.error) throw new Error(res.error)
      setPassSuccess(true)
      setPassData({ currentPass: '', newPass: '', confirmPass: '' })
    } catch (err: any) {
      setPassError(err.message || 'Gagal mengubah password')
    } finally {
      setPassLoading(false)
    }
  }

  return (
    <div className="p-8 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Pengaturan Akun</h1>
        <p className="text-slate-500 mt-1">Kelola data profil dan keamanan akun Anda</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Profil Pengguna</CardTitle>
            <CardDescription>Ubah nama dan email (username) Anda.</CardDescription>
          </CardHeader>
          <CardContent>
            {profileSuccess && (
              <Alert className="bg-emerald-50 text-emerald-800 border-emerald-200 mb-4">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <AlertTitle>Berhasil!</AlertTitle>
                <AlertDescription>Profil Anda telah diperbarui.</AlertDescription>
              </Alert>
            )}
            {profileError && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Gagal</AlertTitle>
                <AlertDescription>{profileError}</AlertDescription>
              </Alert>
            )}
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Nama Lengkap</Label>
                <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label>Email (Username Login)</Label>
                <Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
              </div>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white mt-4" disabled={profileLoading}>
                {profileLoading ? 'Menyimpan...' : 'Simpan Profil'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Keamanan</CardTitle>
            <CardDescription>Ubah kata sandi akun Anda.</CardDescription>
          </CardHeader>
          <CardContent>
            {passSuccess && (
              <Alert className="bg-emerald-50 text-emerald-800 border-emerald-200 mb-4">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <AlertTitle>Berhasil!</AlertTitle>
                <AlertDescription>Password Anda telah berhasil diubah.</AlertDescription>
              </Alert>
            )}
            {passError && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Gagal</AlertTitle>
                <AlertDescription>{passError}</AlertDescription>
              </Alert>
            )}
            <form onSubmit={handlePassSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Password Saat Ini</Label>
                <Input 
                  type="password"
                  value={passData.currentPass} 
                  onChange={e => setPassData({...passData, currentPass: e.target.value})} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label>Password Baru</Label>
                <Input 
                  type="password"
                  value={passData.newPass} 
                  onChange={e => setPassData({...passData, newPass: e.target.value})} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label>Konfirmasi Password Baru</Label>
                <Input 
                  type="password"
                  value={passData.confirmPass} 
                  onChange={e => setPassData({...passData, confirmPass: e.target.value})} 
                  required 
                />
              </div>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white mt-4" disabled={passLoading}>
                {passLoading ? 'Menyimpan...' : 'Perbarui Password'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {user.role === 'ADMIN' && (
        <Card className="mt-6 border-blue-200">
          <CardHeader className="bg-blue-50/50">
            <CardTitle className="text-blue-800">Buat Akun Korwil (Hanya Akses SNT)</CardTitle>
            <CardDescription>Akun ini langsung diarahkan ke Dashboard SNT dan tidak bisa mengakses APKA Induk.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {newKorwilSuccess && (
              <Alert className="bg-emerald-50 text-emerald-800 border-emerald-200 mb-4">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <AlertTitle>Berhasil!</AlertTitle>
                <AlertDescription>Akun Korwil baru telah dibuat dan bisa digunakan login.</AlertDescription>
              </Alert>
            )}
            {newKorwilError && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Gagal</AlertTitle>
                <AlertDescription>{newKorwilError}</AlertDescription>
              </Alert>
            )}
            <form onSubmit={handleNewKorwil} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Nama Lengkap</Label>
                <Input value={newKorwilData.name} onChange={e => setNewKorwilData({...newKorwilData, name: e.target.value})} required placeholder="John Doe" />
              </div>
              <div className="space-y-2">
                <Label>Email (Username)</Label>
                <Input type="email" value={newKorwilData.email} onChange={e => setNewKorwilData({...newKorwilData, email: e.target.value})} required placeholder="korwil@jtrobotic.com" />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input type="password" value={newKorwilData.password} onChange={e => setNewKorwilData({...newKorwilData, password: e.target.value})} required placeholder="Sandi rahasia" />
              </div>
              <div className="md:col-span-3 flex justify-end mt-2">
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={newKorwilLoading}>
                  {newKorwilLoading ? 'Membuat Akun...' : 'Buat Akun Korwil'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

    </div>
  )
}

