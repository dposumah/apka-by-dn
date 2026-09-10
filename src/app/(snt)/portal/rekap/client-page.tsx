"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { createRekapBulanan, submitRekapBulanan } from '@/app/actions/rekap'
import { useRouter } from 'next/navigation'
import { CheckCircle2, FileText, Printer, Upload } from 'lucide-react'
import { useModal } from '@/components/modal-provider';

export function RekapClientPage({ fasilitator, availableMonths, rekaps }: { fasilitator: any, availableMonths: any[], rekaps: any[] }) {
  const { confirm, alert } = useModal();

  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState('')
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  
  const handleCreate = async () => {
    if (!selectedMonth) return
    setLoading(true)
    try {
      await createRekapBulanan(fasilitator.id, selectedMonth)
      setSelectedMonth('')
    } catch (e: any) {
      await alert(e.message || 'Gagal membuat rekap')
    } finally {
      setLoading(false)
    }
  }

  const handleUploadAndSubmit = async (e: React.ChangeEvent<HTMLInputElement>, rekapId: string) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingId(rekapId)
    try {
      const uploadData = new FormData()
      uploadData.append('file', file)
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: uploadData
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      await submitRekapBulanan(rekapId, data.url)
      await alert('Berhasil mengirim tagihan honorarium!')
      router.refresh()
    } catch (e: any) {
      await alert(e.message || 'Gagal unggah file')
    } finally {
      setUploadingId(null)
    }
  }

  const formatBulan = (bulan: string) => {
    const [y, m] = bulan.split('-')
    const date = new Date(parseInt(y), parseInt(m) - 1, 1)
    return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
  }

  return (
    <div className="p-8 space-y-6 max-w-5xl mx-auto">
      <Link href="/portal" className="text-emerald-600 hover:underline mb-4 inline-block">&larr; Kembali ke Dashboard</Link>
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Rekap Honorarium Bulanan</h1>
      <p className="text-slate-500">Buat rekapan JP Anda per bulan, unduh PDF, tandatangani, lalu unggah kembali untuk penagihan honorarium.</p>

      <Card className="bg-emerald-50 border-emerald-100">
        <CardContent className="pt-6">
          <Label className="text-emerald-900 mb-2 block">Buat Rekapan Baru</Label>
          <div className="flex gap-4 items-center">
            <select 
              className="flex h-10 w-full md:w-64 rounded-md border border-input bg-white px-3 py-2 text-sm"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              <option value="">-- Pilih Bulan --</option>
              {availableMonths.filter(m => m.unbilled > 0).map(m => (
                <option key={m.month} value={m.month}>
                  {formatBulan(m.month)} ({m.unbilled} Laporan Baru)
                </option>
              ))}
            </select>
            <Button 
              onClick={handleCreate} 
              disabled={!selectedMonth || loading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {loading ? 'Memproses...' : 'Buat Rekap'}
            </Button>
          </div>
          {availableMonths.filter(m => m.unbilled > 0).length === 0 && (
            <p className="text-sm text-emerald-600 mt-2">Semua laporan yang ada sudah direkap.</p>
          )}
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold mt-8">Riwayat Rekap Bulanan</h2>
        {rekaps.length === 0 ? (
          <div className="text-center py-12 border border-dashed rounded-lg text-slate-500">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p>Belum ada rekapan bulanan.</p>
          </div>
        ) : (
          rekaps.map((rekap: any) => (
            <Card key={rekap.id}>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h3 className="font-bold text-lg">Rekap Bulan {formatBulan(rekap.bulan)}</h3>
                    <p className="text-sm text-slate-500">Total {rekap.totalJP} JP &bull; Rp {rekap.totalHonor.toLocaleString('id-ID')}</p>
                    <p className="text-xs text-slate-400 mt-1">Terdiri dari {rekap.laporan.length} laporan kegiatan.</p>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    {rekap.status === 'DRAFT' && (
                      <>
                        <div className="flex gap-2">
                          <Link href={`/portal/rekap/${rekap.id}/pdf`} target="_blank" className="inline-flex items-center gap-2 h-9 px-3 text-sm font-medium border rounded-md text-slate-700 bg-white hover:bg-slate-50">
                            <Printer className="w-4 h-4" /> Cetak PDF
                          </Link>
                          
                          <label className="inline-flex items-center gap-2 h-9 px-3 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 cursor-pointer">
                            <Upload className="w-4 h-4" /> 
                            {uploadingId === rekap.id ? 'Mengunggah...' : 'Unggah Bukti TTD'}
                            <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" disabled={uploadingId === rekap.id} onChange={(e) => handleUploadAndSubmit(e, rekap.id)} />
                          </label>
                        </div>
                        <p className="text-xs text-amber-600 text-right">Silakan cetak, tandatangani, dan unggah kembali.</p>
                      </>
                    )}
                    
                    {rekap.status === 'SUBMITTED' && (
                      <div className="text-right">
                        {rekap.expense?.status === 'APPROVED' ? (
                          <>
                            <span className="inline-flex items-center gap-1 text-emerald-600 text-sm font-bold">
                              <CheckCircle2 className="w-4 h-4" /> Lunas / Selesai
                            </span>
                            {rekap.expense.paymentReceiptUrl && (
                              <div className="mt-1">
                                <a href={rekap.expense.paymentReceiptUrl} target="_blank" rel="noreferrer" className="text-xs font-medium px-2 py-1 bg-emerald-50 text-emerald-700 rounded border border-emerald-200 hover:bg-emerald-100 inline-block">
                                  Lihat Bukti Transfer
                                </a>
                              </div>
                            )}
                          </>
                        ) : rekap.expense?.status === 'REJECTED' ? (
                          <span className="inline-flex items-center gap-1 text-red-600 text-sm font-medium">
                            Ditolak Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-amber-600 text-sm font-medium">
                            Sedang Diproses Keuangan
                          </span>
                        )}
                        
                        {rekap.filePdf && (
                          <div className="mt-2">
                            <a href={rekap.filePdf} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">
                              Lihat Dokumen TTD yang Diajukan
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
