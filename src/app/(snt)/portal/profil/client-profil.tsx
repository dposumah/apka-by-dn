"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { updateFasilitatorProfile } from '@/app/actions/rab'
import { useRouter } from 'next/navigation'

export function ProfilClient({ fasilitator }: { fasilitator: any }) {
  const router = useRouter()
  
  const isIncomplete = !fasilitator.bankName || !fasilitator.bankAccount || !fasilitator.npwpNik
  const [isEditing, setIsEditing] = useState(isIncomplete)
  const [saving, setSaving] = useState(false)
  
  const [formData, setFormData] = useState({
    namaLengkap: fasilitator.namaLengkap || '',
    nipNuptk: fasilitator.nipNuptk || '',
    nidn: fasilitator.nidn || '',
    instansi: fasilitator.instansi || '',
    email: fasilitator.email || '',
    kontak: fasilitator.kontak || '',
    bankName: fasilitator.bankName || '',
    bankAccount: fasilitator.bankAccount || '',
    npwpNik: fasilitator.npwpNik || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await updateFasilitatorProfile(fasilitator.id, formData)
      setIsEditing(false)
      router.refresh()
    } catch (error) {
      alert("Gagal menyimpan profil")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-8 space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Profil Fasilitator</h1>
        <p className="text-slate-500 mt-1">Kelola data diri dan informasi rekening Anda</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Data Profil</CardTitle>
            <CardDescription>Informasi pribadi dan instansi</CardDescription>
          </div>
          {!isEditing && (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>Edit Profil</Button>
          )}
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Nama Lengkap</Label>
                <Input value={formData.namaLengkap} onChange={e => setFormData({...formData, namaLengkap: e.target.value})} required />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>NIP / NUPTK</Label>
                  <Input value={formData.nipNuptk} onChange={e => setFormData({...formData, nipNuptk: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>NIDN</Label>
                  <Input value={formData.nidn} onChange={e => setFormData({...formData, nidn: e.target.value})} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Instansi</Label>
                <Input value={formData.instansi} onChange={e => setFormData({...formData, instansi: e.target.value})} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label>No HP / Kontak</Label>
                  <Input value={formData.kontak} onChange={e => setFormData({...formData, kontak: e.target.value})} />
                </div>
              </div>
              
              <div className="pt-4 mt-4 border-t space-y-4">
                <h3 className="font-semibold text-slate-900">Data Pembayaran</h3>
                <p className="text-sm text-slate-500 mb-2">Pastikan data ini benar untuk pencairan honorarium</p>
                <div className="space-y-2">
                  <Label>Nama Bank</Label>
                  <Input value={formData.bankName} onChange={e => setFormData({...formData, bankName: e.target.value})} required placeholder="Misal: Bank Mandiri" />
                </div>
                <div className="space-y-2">
                  <Label>No Rekening</Label>
                  <Input value={formData.bankAccount} onChange={e => setFormData({...formData, bankAccount: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label>NIK / NPWP</Label>
                  <Input value={formData.npwpNik} onChange={e => setFormData({...formData, npwpNik: e.target.value})} required />
                </div>
              </div>
              
              <div className="flex justify-end gap-2 pt-6">
                {!isIncomplete && <Button type="button" variant="ghost" onClick={() => setIsEditing(false)}>Batal</Button>}
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white" disabled={saving}>
                  {saving ? 'Menyimpan...' : 'Simpan Profil'}
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-500">Nama Lengkap</p>
                  <p className="font-medium text-lg">{fasilitator.namaLengkap}</p>
                </div>
                <div>
                  <p className="text-slate-500">Instansi</p>
                  <p className="font-medium text-lg">{fasilitator.instansi || '-'}</p>
                </div>
                <div>
                  <p className="text-slate-500">NIP/NUPTK/NIDN</p>
                  <p className="font-medium">{fasilitator.nipNuptk || fasilitator.nidn || '-'}</p>
                </div>
                <div>
                  <p className="text-slate-500">Email & Kontak</p>
                  <p className="font-medium">{fasilitator.email} <br/> {fasilitator.kontak}</p>
                </div>
              </div>
              
              <div className="pt-4 mt-4 border-t">
                <h3 className="font-semibold text-slate-900 mb-3">Informasi Pembayaran</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-slate-500">Rekening Bank</p>
                    <p className="font-medium">{fasilitator.bankName} - {fasilitator.bankAccount}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">NIK / NPWP</p>
                    <p className="font-medium">{fasilitator.npwpNik}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
