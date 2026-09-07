"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/format'
import { useState } from 'react'
import { adminGenerateInvoiceHonor } from '@/app/actions/rekap'
import { useRouter } from 'next/navigation'

export function RekapHonorClient({ initialData }: { initialData: any[] }) {
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)
    const handleCetakInvoice = async (rekap: any) => {
    try {
      setLoadingId(rekap.id)
      if (rekap.status === 'SUBMITTED') {
        await adminGenerateInvoiceHonor(rekap.id)
      }
      cetakInvoiceHonor(rekap)
      router.refresh()
    } catch (e) {
      alert('Gagal memproses invoice')
    } finally {
      setLoadingId(null)
    }
  }

  const cetakInvoiceHonor = (rekap: any) => {
    // Generate Invoice PDF
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`
      <html>
        <head>
          <title>Invoice Honorarium - ${rekap.fasilitator.namaLengkap}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #f8fafc; }
            .header { text-align: center; margin-bottom: 40px; }
            .total { font-weight: bold; font-size: 1.2em; text-align: right; }
          </style>
        </head>
        <body>
          <div style="margin-bottom: 30px;">
            <img src="/kop-surat.png" style="width: 100%; max-height: 120px; object-fit: contain;" alt="Kop Surat" />
          </div>
          <div class="header">
            <h2>INVOICE HONORARIUM FASILITATOR</h2>
            <p>KKA Sekolah Nasional Terintegrasi Tahun 2026</p>
          </div>
          
          <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
            <div>
              <p><strong>Nama Fasilitator:</strong> ${rekap.fasilitator.namaLengkap}</p>
              <p><strong>Lokasi SNT:</strong> ${rekap.fasilitator.lokasiSNT ? rekap.fasilitator.lokasiSNT.split(' - ')[0] : '-'}</p>
              <p><strong>Bulan Laporan:</strong> ${rekap.bulan}</p>
              <p><strong>Tanggal Diajukan:</strong> ${new Date(rekap.createdAt).toLocaleDateString('id-ID')}</p>
            </div>
            <div style="text-align: right; border: 1px solid #ddd; padding: 15px; border-radius: 8px; background-color: #f8fafc;">
              <h4 style="margin:0 0 10px 0;">Informasi Transfer</h4>
              <p style="margin:5px 0;"><strong>Bank:</strong> ${rekap.fasilitator.bankName || '-'}</p>
              <p style="margin:5px 0;"><strong>No. Rekening:</strong> ${rekap.fasilitator.bankAccount || '-'}</p>
              <p style="margin:5px 0;"><strong>A/N:</strong> ${rekap.fasilitator.namaLengkap}</p>
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Keterangan</th>
                <th>Jumlah JP</th>
                <th>Total Honor</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Honorarium Fasilitator Bulan ${rekap.bulan}</td>
                <td>${rekap.totalJP} JP</td>
                <td>Rp ${rekap.totalHonor.toLocaleString('id-ID')}</td>
              </tr>
              <tr>
                <td colspan="2" class="total">TOTAL TAGIHAN HONORARIUM:</td>
                <td class="total text-emerald-600">Rp ${rekap.totalHonor.toLocaleString('id-ID')}</td>
              </tr>
            </tbody>
          </table>
          <p style="margin-top:40px; text-align:right;">Dicetak oleh: Admin SNT</p>
          <script>window.print()</script>
        </body>
      </html>
    `)
    win.document.close()
  }

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Rekap Honorarium Bulanan</h1>
        <p className="text-slate-500 mt-1">Daftar rekapitulasi honorarium yang diajukan oleh Fasilitator.</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="py-3 px-4">Fasilitator</th>
                  <th className="py-3 px-4">Bulan</th>
                  <th className="py-3 px-4 text-center">Total JP</th>
                  <th className="py-3 px-4 text-right">Total Honor</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Dokumen PDF</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {initialData.map((rekap) => (
                  <tr key={rekap.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-medium text-slate-900">{rekap.fasilitator.namaLengkap}</td>
                    <td className="py-3 px-4">{rekap.bulan}</td>
                    <td className="py-3 px-4 text-center">{rekap.totalJP}</td>
                    <td className="py-3 px-4 text-right font-medium">{formatCurrency(rekap.totalHonor)}</td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant={rekap.status === 'SUBMITTED' ? 'default' : 'secondary'}>{rekap.status}</Badge>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {rekap.filePdf ? (
                        <a href={rekap.filePdf} target="_blank" className="text-blue-600 hover:underline">Lihat PDF TTD</a>
                      ) : '-'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {rekap.status === 'SUBMITTED' && (
                        <button 
                          onClick={() => handleCetakInvoice(rekap)}
                          disabled={loadingId === rekap.id}
                          className="text-xs bg-slate-900 text-white hover:bg-slate-800 rounded px-2 py-1.5 transition-colors whitespace-nowrap"
                        >
                          {loadingId === rekap.id ? 'Memproses...' : 'Buat Invoice & Cetak'}
                        </button>
                      )}
                      {/* Note: Generating ExpenseRequest happens on Fasil submit currently. We can change this logic later if needed. */}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
