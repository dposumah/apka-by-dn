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
  const [fileUrl, setFileUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().substring(0, 10),
    topic: '',
    attendance: '',
    evaluation: '',
    honorAmount: '200000', // Default 200rb
  })

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    setFileError('')
    setFileUrl('')
    
    if (!file) return
    
    // Validasi 5MB
    if (file.size > 5 * 1024 * 1024) {
      setFileError('Ukuran file maksimal 5MB')
      e.target.value = ''
      return
    }

    setUploading(true)
    try {
      const uploadData = new FormData()
      uploadData.append('file', file)
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: uploadData
      })
      const data = await res.json()
      if (res.ok && data.url) {
        setFileUrl(data.url)
      } else {
        setFileError(data.error || 'Gagal mengunggah file')
      }
    } catch (error) {
      setFileError('Gagal terhubung ke server unggahan')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fileUrl) {
      setFileError('Harap lampirkan file laporan kegiatan')
      return
    }
    
    setSaving(true)
    try {
      await submitLaporanKegiatan(fasilitatorId, {
        ...formData,
        materialLink: fileUrl
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
      <h1 className="text-3xl font-bold tracking-tight">Kirim Laporan Kegiatan</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Formulir Laporan Mengajar SNT 2026</CardTitle>
          <CardDescription>Laporan yang disetujui akan otomatis men-generate tagihan honorarium Anda ke bagian keuangan.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Tanggal Kegiatan</Label>
              <Input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <Label>Topik Pembelajaran</Label>
              <Input value={formData.topic} onChange={e => setFormData({...formData, topic: e.target.value})} placeholder="Misal: Pengenalan Komponen Robotika" required />
            </div>
            <div className="space-y-2">
              <Label>Jumlah Peserta Hadir</Label>
              <Input type="number" min="0" value={formData.attendance} onChange={e => setFormData({...formData, attendance: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <Label>Catatan / Evaluasi</Label>
              <Textarea value={formData.evaluation} onChange={e => setFormData({...formData, evaluation: e.target.value})} placeholder="Catatan singkat tentang pelaksanaan..." />
            </div>
            <div className="space-y-2 border-t pt-4 mt-2">
              <Label>Honorarium yang Diajukan (Rp)</Label>
              <Input type="number" min="0" value={formData.honorAmount} onChange={e => setFormData({...formData, honorAmount: e.target.value})} required />
              <p className="text-xs text-slate-500">Sesuaikan dengan standar SNT 2026 (Default Rp 200.000)</p>
            </div>
            <div className="space-y-2 border-t pt-4 mt-2">
              <Label>Lampiran Bukti (Foto/Dokumen Laporan)</Label>
              <Input type="file" onChange={handleFileChange} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />
              {uploading && <p className="text-xs text-blue-600">Mengunggah file...</p>}
              {fileError && <p className="text-xs text-red-600">{fileError}</p>}
              {fileUrl && !uploading && <p className="text-xs text-emerald-600">File berhasil dilampirkan & siap dikirim.</p>}
              <p className="text-xs text-slate-500">Maksimal ukuran file: 5 MB</p>
            </div>
            
            <div className="pt-4 flex justify-end">
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white w-full md:w-auto" disabled={saving || uploading}>
                {saving ? 'Mengirim Laporan...' : 'Kirim Laporan & Tagihan Honor'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
