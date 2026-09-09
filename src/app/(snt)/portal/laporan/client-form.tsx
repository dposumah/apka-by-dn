"use client"

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
    const [fileLaporanFisik, setFileLaporanFisik] = useState('')
  const [uploading, setUploading] = useState(false)
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().substring(0, 10),
    topic: '',
    attendance: '',
    evaluation: '',
    tingkatSekolah: 'SMP',
    metodePelaksanaan: 'LURING',
      jenisPembelajaran: 'INTRAKURIKULER',
    jumlahJPIntra: '',
    jumlahJPEkstra: '',
    biayaTransportLaut: '',
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, field: 'foto1' | 'foto2' | 'fileLaporanFisik' | 'fileLaporanFisik') => {
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
        if (field === 'fileLaporanFisik') setFileLaporanFisik(url)
        if (field === 'fileLaporanFisik') setFileLaporanFisik(url)
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
        foto2,
        fileLaporanFisik
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
            
            
            <div className="space-y-3 p-4 bg-slate-50 rounded-md border border-slate-200">
              <Label>Metode Pelaksanaan</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input type="radio" name="metodePelaksanaan" value="LURING" checked={formData.metodePelaksanaan === 'LURING'} onChange={e => setFormData({...formData, metodePelaksanaan: e.target.value})} className="w-4 h-4 text-emerald-600" />
                  Luring (Tatap Muka)
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" name="metodePelaksanaan" value="DARING" checked={formData.metodePelaksanaan === 'DARING'} onChange={e => setFormData({...formData, metodePelaksanaan: e.target.value})} className="w-4 h-4 text-emerald-600" />
                  Daring (Online)
                </label>
              </div>
              
            </div>

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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4 mt-2">
                <div className="space-y-2">
                  <Label>Jenis Pembelajaran</Label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={formData.jenisPembelajaran}
                    onChange={e => setFormData({...formData, jenisPembelajaran: e.target.value, jumlahJPIntra: '', jumlahJPEkstra: ''})}
                  >
                    <option value="INTRAKURIKULER">Intrakurikuler</option>
                    <option value="EKSTRAKURIKULER">Ekstrakurikuler</option>
                  </select>
                </div>
                
                {formData.jenisPembelajaran === 'INTRAKURIKULER' ? (
                  <div className="space-y-2">
                    <Label>Jumlah JP (Intrakurikuler)</Label>
                    <Input type="number" min="0" value={formData.jumlahJPIntra} onChange={e => setFormData({...formData, jumlahJPIntra: e.target.value})} placeholder="0" />
                    <p className="text-xs text-slate-500">Maksimal 8 JP / minggu / Lokasi</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>Jumlah JP (Ekstrakurikuler)</Label>
                    <Input type="number" min="0" value={formData.jumlahJPEkstra} onChange={e => setFormData({...formData, jumlahJPEkstra: e.target.value})} placeholder="0" />
                    <p className="text-xs text-slate-500">Maksimal 4 JP / minggu / Lokasi</p>
                  </div>
                )}
              <div className="space-y-2">
                <Label>Biaya Transport Antar Pulau (Rp)</Label>
                <Input type="number" min="0" value={formData.biayaTransportLaut} onChange={e => setFormData({...formData, biayaTransportLaut: e.target.value})} placeholder="Kosongkan jika tidak ada" />
                <p className="text-xs text-slate-500">Opsional</p>
              </div>
            </div>

            {parseFloat(formData.biayaTransportLaut) > 0 && (
                <div className="space-y-2 col-span-2 border border-blue-100 bg-blue-50 p-4 rounded-md mt-2">
                  <Label>Bukti Tiket Transport (Wajib jika Transport Antar Pulau)</Label>
                  <Input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => e.target.files && setTiket(e.target.files[0])} />
                  <p className="text-xs text-blue-600">Unggah foto/scan tiket atau bukti pembayaran transport.</p>
                </div>
              )}
  
              
              <div className="space-y-2 border border-slate-200 bg-slate-50 p-4 rounded-md mt-4">
                <div className="flex justify-between items-center mb-2">
                  <Label className="text-sm font-semibold">Laporan Fisik</Label>
                  <a href="/templates/Template_Laporan_Fisik_Fasilitator.docx" download className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                    Download Template
                  </a>
                </div>
                <Input type="file" onChange={(e) => handleFileChange(e, 'fileLaporanFisik')} accept=".pdf,.doc,.docx" />
                {fileLaporanFisik && <p className="text-xs text-emerald-600">Laporan fisik terlampir.</p>}
                <p className="text-xs text-slate-500">Silakan unduh template, isi, tanda tangani, lalu unggah kembali di sini (Bisa PDF/Word).</p>
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
