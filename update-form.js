const fs = require('fs')

const content = "use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import Link from 'next/link'
import { submitLaporanKegiatan } from '@/app/actions/rab'
import { useRouter } from 'next/navigation'

export function LaporanClientForm({ fasilitatorId }: { fasilitatorId: string }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [fileError, setFileError] = useState('')
  const [foto1, setFoto1] = useState('')
  const [foto2, setFoto2] = useState('')
  const [uploading, setUploading] = useState(false)
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().substring(0, 10),
    topic: '',
    attendance: '',
    evaluation: '',
    tingkatSekolah: 'SMP',
    jenisKegiatan: 'INTRAKURIKULER',
    jumlahJP: '',
    biayaTransport: '',
  })

  const uploadFile = async (file: File) => {
    const uploadData = new FormData()
    uploadData.append('file', file)
    const res = await fetch('/api/upload', {
      method: 'POST',
      body: uploadData
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Gagal unggah')
    return data.url
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, field: 'foto1' | 'foto2') => {
    const file = e.target.files?.[0]
    setFileError('')
    
    if (!file) return
    
    if (file.size > 5 * 1024 * 1024) {
      setFileError('Ukuran file maksimal 5MB')
      e.target.value = ''
      return
    }

    setUploading(true)
    try {
      const url = await uploadFile(file)
      if (field === 'foto1') setFoto1(url)
      if (field === 'foto2') setFoto2(url)
    } catch (error: any) {
      setFileError(error.message || 'Gagal terhubung ke server unggahan')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!foto1 && !foto2) {
      setFileError('Harap lampirkan minimal 1 foto kegiatan')
      return
    }
    
    setSaving(true)
    try {
      await submitLaporanKegiatan(fasilitatorId, {
        ...formData,
        foto1,
        foto2
      })
      router.push('/portal')
      router.refresh()
    } catch (error) {
      alert("Gagal mengirim laporan")
      setSaving(false)
    }
  }

  return (
    <div className="p-8 space-y-6 max-w-3xl mx-auto">
      <Link href="/portal" className="text-emerald-600 hover:underline mb-4 inline-block">&larr; Kembali ke Portal</Link>
      <h1 className="text-3xl font-bold tracking-tight">Kirim Laporan Kegiatan Mingguan</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Formulir Laporan Mengajar SNT 2026</CardTitle>
          <CardDescription>Laporkan kegiatan mingguan Anda. Biaya transport akan dicatat, sementara JP akan diakumulasi ke dalam Honorarium Bulanan.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tingkat Sekolah</Label>
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center gap-2">
                    <input type="radio" name="tingkatSekolah" value="SMP" checked={formData.tingkatSekolah === 'SMP'} onChange={e => setFormData({...formData, tingkatSekolah: e.target.value})} className="w-4 h-4 text-emerald-600" />
                    SMP
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="tingkatSekolah" value="SMA" checked={formData.tingkatSekolah === 'SMA'} onChange={e => setFormData({...formData, tingkatSekolah: e.target.value})} className="w-4 h-4 text-emerald-600" />
                    SMA
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Jenis Kegiatan</Label>
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center gap-2">
                    <input type="radio" name="jenisKegiatan" value="INTRAKURIKULER" checked={formData.jenisKegiatan === 'INTRAKURIKULER'} onChange={e => setFormData({...formData, jenisKegiatan: e.target.value})} className="w-4 h-4 text-emerald-600" />
                    Intrakurikuler
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="jenisKegiatan" value="EKSTRAKURIKULER" checked={formData.jenisKegiatan === 'EKSTRAKURIKULER'} onChange={e => setFormData({...formData, jenisKegiatan: e.target.value})} className="w-4 h-4 text-emerald-600" />
                    Ekstrakurikuler
                  </label>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tanggal Kegiatan</Label>
                <Input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label>Jumlah Peserta Hadir</Label>
                <Input type="number" min="0" value={formData.attendance} onChange={e => setFormData({...formData, attendance: e.target.value})} required />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Topik Pembelajaran</Label>
              <Input value={formData.topic} onChange={e => setFormData({...formData, topic: e.target.value})} placeholder="Misal: Pengenalan Komponen Robotika" required />
            </div>
            
            <div className="space-y-2">
              <Label>Catatan / Evaluasi</Label>
              <Textarea value={formData.evaluation} onChange={e => setFormData({...formData, evaluation: e.target.value})} placeholder="Catatan singkat tentang pelaksanaan..." />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4 mt-2">
              <div className="space-y-2">
                <Label>Jumlah JP (Jam Pelajaran)</Label>
                <Input type="number" min="0" value={formData.jumlahJP} onChange={e => setFormData({...formData, jumlahJP: e.target.value})} placeholder="Misal: 2" required />
                <p className="text-xs text-slate-500">Rate Honor Rp 65.000 / JP</p>
              </div>
              <div className="space-y-2">
                <Label>Biaya Transport Antar Pulau (Rp)</Label>
                <Input type="number" min="0" value={formData.biayaTransport} onChange={e => setFormData({...formData, biayaTransport: e.target.value})} placeholder="Kosongkan jika tidak ada" />
                <p className="text-xs text-slate-500">Opsional</p>
              </div>
            </div>

            <div className="space-y-4 border-t pt-4 mt-2">
              <Label>Lampiran Bukti (Foto Kegiatan)</Label>
              <p className="text-xs text-slate-500">Maksimal 2 foto (jpg/png/jpeg), ukuran per file max 5 MB.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm text-slate-600">Foto Kegiatan 1 *</Label>
                  <Input type="file" onChange={(e) => handleFileChange(e, 'foto1')} accept=".jpg,.jpeg,.png" />
                  {foto1 && <p className="text-xs text-emerald-600">Foto 1 terlampir.</p>}
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-slate-600">Foto Kegiatan 2 (Opsional)</Label>
                  <Input type="file" onChange={(e) => handleFileChange(e, 'foto2')} accept=".jpg,.jpeg,.png" />
                  {foto2 && <p className="text-xs text-emerald-600">Foto 2 terlampir.</p>}
                </div>
              </div>
              
              {uploading && <p className="text-xs text-blue-600">Mengunggah file...</p>}
              {fileError && <p className="text-xs text-red-600">{fileError}</p>}
            </div>
            
            <div className="pt-4 flex justify-end">
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white w-full md:w-auto" disabled={saving || uploading}>
                {saving ? 'Menyimpan...' : 'Kirim Laporan'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}


fs.writeFileSync('src/app/(snt)/portal/laporan/client-form.tsx', content)
