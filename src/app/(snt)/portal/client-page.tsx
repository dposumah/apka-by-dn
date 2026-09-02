"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { AlertCircle, FileText, CheckCircle2 } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import Link from 'next/link'
import { updateFasilitatorProfile } from '@/app/actions/rab'
import { useRouter } from 'next/navigation'

export function PortalClient({ fasilitator, isIncomplete }: { fasilitator: any, isIncomplete: boolean }) {
  const router = useRouter()
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
    <div className="p-8 space-y-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold tracking-tight">Portal Fasilitator SNT 2026</h1>
      
      {isIncomplete && !isEditing && (
        <Alert variant="destructive" className="bg-red-50 text-red-700 border-red-200">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Data Profil Belum Lengkap!</AlertTitle>
          <AlertDescription>
            Harap lengkapi Nama Bank, No Rekening, dan NIK/NPWP Anda agar pembayaran honorarium dapat diproses.
            <Button variant="link" onClick={() => setIsEditing(true)} className="text-red-700 font-bold p-0 ml-2">Lengkapi Sekarang &rarr;</Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Profil Anda</CardTitle>
                <CardDescription>Detail data diri & rekening</CardDescription>
              </div>
              {!isEditing && (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>Edit</Button>
              )}
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nama Lengkap</Label>
                    <Input value={formData.namaLengkap} onChange={e => setFormData({...formData, namaLengkap: e.target.value})} required />
                  </div>
                  <div className="space-y-2">
                    <Label>NIP / NUPTK</Label>
                    <Input value={formData.nipNuptk} onChange={e => setFormData({...formData, nipNuptk: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>NIDN</Label>
                    <Input value={formData.nidn} onChange={e => setFormData({...formData, nidn: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Instansi</Label>
                    <Input value={formData.instansi} onChange={e => setFormData({...formData, instansi: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
                  </div>
                  <div className="space-y-2">
                    <Label>No HP / Kontak</Label>
                    <Input value={formData.kontak} onChange={e => setFormData({...formData, kontak: e.target.value})} />
                  </div>
                  <div className="p-3 bg-slate-50 border rounded-md space-y-4">
                    <p className="text-xs font-semibold text-slate-500 uppercase">Data Pembayaran</p>
                    <div className="space-y-2">
                      <Label>Nama Bank</Label>
                      <Input value={formData.bankName} onChange={e => setFormData({...formData, bankName: e.target.value})} required />
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
                  <div className="flex justify-end gap-2 pt-2">
                    {!isIncomplete && <Button type="button" variant="ghost" onClick={() => setIsEditing(false)}>Batal</Button>}
                    <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white" disabled={saving}>
                      {saving ? 'Menyimpan...' : 'Simpan Profil'}
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4 text-sm">
                  <div>
                    <p className="text-slate-500">Nama Lengkap</p>
                    <p className="font-medium">{fasilitator.namaLengkap}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Instansi</p>
                    <p className="font-medium">{fasilitator.instansi || '-'}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">NIP/NUPTK/NIDN</p>
                    <p className="font-medium">{fasilitator.nipNuptk || fasilitator.nidn || '-'}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Email & Kontak</p>
                    <p className="font-medium">{fasilitator.email}<br/>{fasilitator.kontak}</p>
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-slate-500">Informasi Pembayaran</p>
                    <p className="font-medium">{fasilitator.bankName} - {fasilitator.bankAccount}</p>
                    <p className="text-slate-500 text-xs mt-1">NIK/NPWP: {fasilitator.npwpNik}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between border-b pb-4 mb-4">
              <div>
                <CardTitle>Riwayat Laporan & Honorarium</CardTitle>
                <CardDescription>Daftar kegiatan yang telah Anda laporkan</CardDescription>
              </div>
              {isIncomplete ? (
                <button 
                  onClick={() => alert('Harap lengkapi Profil dan Data Pembayaran Anda (Nama Bank, No Rekening, NIK/NPWP) dan klik "Simpan Profil" terlebih dahulu sebelum membuat laporan.')}
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-gray-400 text-white cursor-not-allowed h-9 px-4"
                >
                  + Buat Laporan
                </button>
              ) : (
                <Link href="/portal/laporan" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-emerald-600 text-white hover:bg-emerald-700 h-9 px-4">
                  + Buat Laporan
                </Link>
              )}
            </CardHeader>
            <CardContent>
              {fasilitator.laporan && fasilitator.laporan.length > 0 ? (
                <div className="space-y-4">
                  {fasilitator.laporan.map((lap: any) => (
                    <div key={lap.id} className="flex items-start justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-semibold text-slate-900">{lap.topic}</h4>
                        <p className="text-sm text-slate-500">{new Date(lap.date).toLocaleDateString('id-ID')} &bull; {lap.attendance} Peserta</p>
                        {lap.materialLink && (
                          <a href={lap.materialLink} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline mt-1 inline-block">
                            Lihat Lampiran File
                          </a>
                        )}
                      </div>
                      <div className="text-right">
                        {lap.expenseRequest ? (
                          <>
                            <div className="font-medium text-slate-900">Rp {lap.expenseRequest.amount.toLocaleString('id-ID')}</div>
                            <div className="text-xs mt-1 px-2 py-1 bg-slate-100 rounded-md inline-block">
                              {lap.expenseRequest.status === 'APPROVED' ? (
                                <span className="text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Disetujui</span>
                              ) : lap.expenseRequest.status === 'REJECTED' ? (
                                <span className="text-red-600">Ditolak</span>
                              ) : (
                                <span className="text-amber-600">Menunggu</span>
                              )}
                            </div>
                          </>
                        ) : (
                          <span className="text-xs text-slate-400">Belum ada tagihan</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500 flex flex-col items-center">
                  <FileText className="w-12 h-12 text-slate-300 mb-3" />
                  <p>Belum ada laporan kegiatan.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
