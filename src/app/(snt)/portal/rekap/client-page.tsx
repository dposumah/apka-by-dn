"use client"

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { createRekapBulanan, submitRekapBulanan } from '@/app/actions/rekap'
import { useRouter } from 'next/navigation'
import { CheckCircle2, FileText, Printer, Upload, ExternalLink, Wallet, Car } from 'lucide-react'
import { useModal } from '@/components/modal-provider'
import { hitungTotalTransportRekap } from '@/lib/transport'

export function RekapClientPage({ fasilitator, availableMonths, rekaps }: { fasilitator: any, availableMonths: any[], rekaps: any[] }) {
  const { alert } = useModal();

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
    if (!bulan) return '-'
    const [y, m] = bulan.split('-')
    const date = new Date(parseInt(y), parseInt(m) - 1, 1)
    return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
  }

  return (
    <div className="p-8 space-y-6 max-w-5xl mx-auto">
      <Link href="/portal" className="text-emerald-600 hover:underline mb-4 inline-block">&larr; Kembali ke Dashboard</Link>
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Rekap Honorarium & Transport Bulanan</h1>
      <p className="text-slate-500">Rekapitulasi pencairan honorarium mengajar dan bantuan biaya transport fasilitator per bulan.</p>

      <Card className="bg-emerald-50 border-emerald-100">
        <CardContent className="pt-6">
          <Label className="text-emerald-900 mb-2 block font-semibold">Buat Pengajuan Rekap Baru</Label>
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
          rekaps.map((rekap: any) => {
            const transportAmount = hitungTotalTransportRekap({ ...rekap, fasilitator })
            const totalHonor = rekap.totalHonor || 0
            const totalKeseluruhan = totalHonor + transportAmount

            const isHonorPaid = Boolean(rekap.buktiPembayaranHonor || rekap.status === 'APPROVED' || rekap.expense?.status === 'APPROVED')
            const isTransportPaid = Boolean(rekap.buktiPembayaranTransport || rekap.status === 'APPROVED')
            const isFullyPaid = isHonorPaid && isTransportPaid

            return (
              <Card key={rekap.id} className="border-slate-200 overflow-hidden shadow-sm">
                <CardContent className="p-6">
                  {/* Header Row */}
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b pb-4 mb-4">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h3 className="font-bold text-lg text-slate-900">Bulan {formatBulan(rekap.bulan)}</h3>
                        {isFullyPaid ? (
                          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300">✓ Lunas Sepenuhnya</Badge>
                        ) : (isHonorPaid || isTransportPaid) ? (
                          <Badge className="bg-blue-100 text-blue-800 border-blue-300">Dibayar Sebagian</Badge>
                        ) : rekap.status === 'SUBMITTED' ? (
                          <Badge className="bg-amber-100 text-amber-800 border-amber-300">Diproses Keuangan</Badge>
                        ) : (
                          <Badge className="bg-slate-100 text-slate-700 border-slate-300">Draft</Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Kinerja: <strong>{rekap.totalJP} JP</strong>
                        {(rekap.totalJPIntra > 0 || rekap.totalJPEkstra > 0) && (
                          <span className="text-slate-400"> (Intra: {rekap.totalJPIntra || 0} JP &bull; Ekstra: {rekap.totalJPEkstra || 0} JP)</span>
                        )}
                        &bull; {rekap.laporan?.length || 0} Laporan Kegiatan
                      </p>
                    </div>

                    {/* Action buttons on the right of header */}
                    <div className="flex items-center gap-2">
                      <Link 
                        href={`/portal/rekap/${rekap.id}/pdf`} 
                        target="_blank" 
                        className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-medium border rounded-md text-slate-700 bg-white hover:bg-slate-50 transition-colors"
                      >
                        <Printer className="w-3.5 h-3.5" /> Lihat / Cetak PDF
                      </Link>

                      {rekap.status === 'DRAFT' && (
                        <label className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 cursor-pointer">
                          <Upload className="w-3.5 h-3.5" /> 
                          {uploadingId === rekap.id ? 'Mengunggah...' : 'Unggah Bukti TTD'}
                          <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" disabled={uploadingId === rekap.id} onChange={(e) => handleUploadAndSubmit(e, rekap.id)} />
                        </label>
                      )}
                    </div>
                  </div>

                  {/* 3-Box Breakdown: Honor, Transport, Total */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Box 1: Honorarium */}
                    <div className="p-4 rounded-lg border border-slate-100 bg-slate-50/60 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                            <Wallet className="w-3.5 h-3.5 text-blue-600" />
                            Honorarium
                          </span>
                          {isHonorPaid ? (
                            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                              ✓ Lunas
                            </span>
                          ) : (
                            <span className="text-[11px] font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                              Menunggu
                            </span>
                          )}
                        </div>
                        <div className="text-xl font-bold text-slate-900">
                          Rp {totalHonor.toLocaleString('id-ID')}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {rekap.totalJP} JP &bull; Rp {(rekap.totalJP > 0 ? Math.round(totalHonor / rekap.totalJP) : 65000).toLocaleString('id-ID')}/JP
                        </p>
                      </div>

                      {/* Bukti Transfer Honor */}
                      {(rekap.buktiPembayaranHonor || rekap.expense?.paymentReceiptUrl) && (
                        <div className="mt-3 pt-2 border-t border-slate-200/60">
                          <a 
                            href={rekap.buktiPembayaranHonor || rekap.expense?.paymentReceiptUrl} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-1 hover:underline"
                          >
                            <ExternalLink className="w-3 h-3" /> Bukti Transfer Honor
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Box 2: Transportasi */}
                    <div className="p-4 rounded-lg border border-slate-100 bg-slate-50/60 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                            <Car className="w-3.5 h-3.5 text-purple-600" />
                            Transportasi
                          </span>
                          {isTransportPaid ? (
                            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                              ✓ Lunas
                            </span>
                          ) : (
                            <span className="text-[11px] font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                              Menunggu
                            </span>
                          )}
                        </div>
                        <div className="text-xl font-bold text-slate-900">
                          Rp {transportAmount.toLocaleString('id-ID')}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {rekap.totalTransport !== null && rekap.totalTransport !== undefined ? 'Disesuaikan admin' : 'Standar operasional'}
                        </p>
                      </div>

                      {/* Bukti Transfer Transport */}
                      {rekap.buktiPembayaranTransport && (
                        <div className="mt-3 pt-2 border-t border-slate-200/60">
                          <a 
                            href={rekap.buktiPembayaranTransport} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="text-xs text-purple-600 hover:text-purple-800 font-medium inline-flex items-center gap-1 hover:underline"
                          >
                            <ExternalLink className="w-3 h-3" /> Bukti Transfer Transport
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Box 3: Total Pembayaran Bersih */}
                    <div className="p-4 rounded-lg border border-emerald-100 bg-emerald-50/40 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Total Diterima
                          </span>
                          {isFullyPaid && (
                            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-200/70 px-2 py-0.5 rounded">
                              Transfer Lengkap
                            </span>
                          )}
                        </div>
                        <div className="text-xl font-bold text-emerald-900">
                          Rp {totalKeseluruhan.toLocaleString('id-ID')}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Honor + Bantuan Transportasi
                        </p>
                      </div>

                      {rekap.filePdf && (
                        <div className="mt-3 pt-2 border-t border-emerald-200/60">
                          <a 
                            href={rekap.filePdf} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="text-xs text-emerald-700 hover:underline font-medium inline-flex items-center gap-1"
                          >
                            <ExternalLink className="w-3 h-3" /> Dokumen TTD Diajukan
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {rekap.status === 'DRAFT' && (
                    <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-800 flex items-center justify-between">
                      <span>Dokumen rekap perlu dicetak, ditandatangani, lalu diunggah kembali agar dapat diverifikasi dan dibayarkan oleh admin.</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}

