"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/format'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function LaporanClient({ initialData }: { initialData: any[] }) {
  const router = useRouter()
  
  const cetakInvoiceTransport = (lap: any) => {
    // Generate Invoice PDF
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`
      <html>
        <head>
          <title>Invoice Transport - ${lap.fasilitator.namaLengkap}</title>
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
          <div class="header">
            <h2>INVOICE TRANSPORT FASILITATOR</h2>
            <p>Proyek SNT 2026</p>
          </div>
          <p><strong>Nama Fasilitator:</strong> ${lap.fasilitator.namaLengkap}</p>
          <p><strong>Lokasi SNT:</strong> ${lap.fasilitator.lokasiSNT || '-'}</p>
          <p><strong>Tanggal Laporan:</strong> ${new Date(lap.date).toLocaleDateString('id-ID')}</p>
          
          <table>
            <thead>
              <tr>
                <th>Deskripsi / Topik</th>
                <th>Tingkat</th>
                <th>JP</th>
                <th>Biaya Transport</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${lap.topic} - ${lap.jenisKegiatan}</td>
                <td>${lap.tingkatSekolah}</td>
                <td>${lap.jumlahJP}</td>
                <td>Rp ${lap.biayaTransport.toLocaleString('id-ID')}</td>
              </tr>
              <tr>
                <td colspan="3" class="total">TOTAL TAGIHAN TRANSPORT:</td>
                <td class="total text-emerald-600">Rp ${lap.biayaTransport.toLocaleString('id-ID')}</td>
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
        <h1 className="text-3xl font-bold tracking-tight">Laporan Mingguan Fasilitator</h1>
        <p className="text-slate-500 mt-1">Kelola dan pantau aktivitas mingguan seluruh fasilitator</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="py-3 px-4">Tanggal & Nama</th>
                  <th className="py-3 px-4">Topik Kegiatan</th>
                  <th className="py-3 px-4 text-center">Tingkat</th>
                  <th className="py-3 px-4 text-center">JP</th>
                  <th className="py-3 px-4 text-right">Transport</th>
                  <th className="py-3 px-4 text-center">Lampiran</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {initialData.map((lap) => (
                  <tr key={lap.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900">{lap.fasilitator.namaLengkap}</div>
                      <div className="text-xs text-slate-500">{new Date(lap.date).toLocaleDateString('id-ID')}</div>
                    </td>
                    <td className="py-3 px-4">
                      {lap.topic}
                      <div className="text-xs text-slate-500">{lap.jenisKegiatan} &bull; {lap.attendance} Peserta</div>
                    </td>
                    <td className="py-3 px-4 text-center">{lap.tingkatSekolah}</td>
                    <td className="py-3 px-4 text-center font-medium">{lap.jumlahJP}</td>
                    <td className="py-3 px-4 text-right">
                      {lap.biayaTransport > 0 ? (
                        <>
                          <div className="font-medium">{formatCurrency(lap.biayaTransport)}</div>
                          <Badge variant={lap.statusTransport === 'PAID' ? 'default' : 'secondary'} className="text-[10px] mt-1">
                            {lap.statusTransport}
                          </Badge>
                        </>
                      ) : '-'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex flex-col gap-1 items-center text-xs">
                        {lap.foto1 && <a href={lap.foto1} target="_blank" className="text-blue-600 hover:underline">Foto 1</a>}
                        {lap.foto2 && <a href={lap.foto2} target="_blank" className="text-blue-600 hover:underline">Foto 2</a>}
                        {lap.buktiTiketTransport && <a href={lap.buktiTiketTransport} target="_blank" className="text-emerald-600 font-bold hover:underline">Tiket</a>}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right space-y-1">
                      {lap.biayaTransport > 0 && lap.statusTransport === 'PENDING' && (
                        <button 
                          onClick={() => cetakInvoiceTransport(lap)}
                          className="w-full text-xs bg-slate-900 text-white hover:bg-slate-800 rounded px-2 py-1.5 transition-colors whitespace-nowrap"
                        >
                          Cetak Invoice Transport
                        </button>
                      )}
                      {/* For uploading receipt, Admin uses the Rekap Transport page, or we can add it here too. */}
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
