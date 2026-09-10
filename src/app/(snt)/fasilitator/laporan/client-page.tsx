"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/format'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { deleteLaporanKegiatan } from '@/app/actions/rab'
import { Trash2 } from 'lucide-react'
import { cancelTransportPaid } from '@/app/actions/rekap'

export function LaporanClient({ initialData }: { initialData: any[] }) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [cancelingId, setCancelingId] = useState<string | null>(null)

  const handleDelete = async (lapId: string, fasilitatorId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus laporan ini? Tindakan ini tidak dapat dibatalkan.')) return;
    setDeletingId(lapId);
    try {
      const res = await deleteLaporanKegiatan(lapId, fasilitatorId);
      if (res?.error) {
        alert(res.error);
      } else {
        router.refresh();
      }
    } catch (e: any) {
      alert('Gagal menghapus: ' + e.message);
    } finally {
      setDeletingId(null);
    }
  }
  
  
  const handleCancelPaid = async (lapId: string) => {
    if (!confirm('Apakah Anda yakin ingin membatalkan status Lunas untuk laporan ini? Data Pengeluaran yang terkait juga akan dihapus.')) return;
    setCancelingId(lapId);
    try {
      const res = await cancelTransportPaid(lapId);
      if (res?.error) {
        alert(res.error);
      } else {
        router.refresh();
      }
    } catch (e: any) {
      alert('Gagal membatalkan lunas: ' + e.message);
    } finally {
      setCancelingId(null);
    }
  }

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
          <div style="margin-bottom: 30px;">
            <img src="/kop-surat.png" style="width: 100%; max-height: 120px; object-fit: contain;" alt="Kop Surat" />
          </div>
          <div class="header">
            <h2>INVOICE TRANSPORT FASILITATOR</h2>
            <p>KKA Sekolah Nasional Terintegrasi Tahun 2026</p>
          </div>
          
          <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
            <div>
              <p><strong>Nama Fasilitator:</strong> ${lap.fasilitator.namaLengkap}</p>
              <p><strong>Lokasi SNT:</strong> ${lap.fasilitator.lokasiSNT ? lap.fasilitator.lokasiSNT.split(' - ')[0] : '-'}</p>
              <p><strong>Tanggal Laporan:</strong> ${new Date(lap.date).toLocaleDateString('id-ID')}</p>
            </div>
            
          </div>
          
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
                <td>${lap.topic}</td>
                <td>${lap.tingkatSekolah} <br/><small>${lap.metodePelaksanaan}</small></td>
                <td>${(lap.jumlahJPIntra || 0) + (lap.jumlahJPEkstra || 0)}</td>
                <td>Rp ${lap.biayaTransport.toLocaleString('id-ID')}</td>
              </tr>
              <tr>
                <td colspan="3" class="total">TOTAL TAGIHAN TRANSPORT:</td>
                <td class="total text-emerald-600">Rp ${lap.biayaTransport.toLocaleString('id-ID')}</td>
              </tr>
            </tbody>
          </table>
          <div style="display: flex; justify-content: space-between; margin-top: 30px;">
            <div style="border: 1px solid #ddd; padding: 15px; border-radius: 8px; background-color: #f8fafc; min-width: 250px;">
              <h4 style="margin:0 0 10px 0;">Informasi Transfer</h4>
              <p style="margin:5px 0;"><strong>Bank:</strong> ${lap.fasilitator.bankName || '-'}</p>
              <p style="margin:5px 0;"><strong>No. Rekening:</strong> ${lap.fasilitator.bankAccount || '-'}</p>
              <p style="margin:5px 0;"><strong>A/N:</strong> ${lap.fasilitator.namaLengkap}</p>
            </div>
            <div style="text-align:right;">
              <p style="margin-top:40px;">Dicetak oleh: Admin SNT</p>
            </div>
          </div>
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
                      <div className="text-xs text-slate-500">{lap.attendance} Peserta</div>
                    </td>
                    <td className="py-3 px-4 text-center">{lap.tingkatSekolah} <div className="text-xs text-slate-500">{lap.metodePelaksanaan}</div></td>
                    <td className="py-3 px-4 text-center text-sm">
                      <div>Intra: <strong>{lap.jumlahJPIntra}</strong></div>
                      <div>Ekstra: <strong>{lap.jumlahJPEkstra}</strong></div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {(lap.biayaTransport || 0) > 0 || (lap.biayaTransportLaut || 0) > 0 ? (
                        <>
                          <div className="font-medium">{formatCurrency((lap.biayaTransport || 0) + (lap.biayaTransportLaut || 0))}</div>
                          <Badge variant={lap.statusTransport === 'PAID' ? 'default' : 'secondary'} className="text-[10px] mt-1">
                            {lap.statusTransport}
                          </Badge>
                        </>
                      ) : '-'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex flex-col gap-1 items-center text-xs">
                        {lap.fileLaporanFisik && <a href={lap.fileLaporanFisik} target="_blank" className="text-purple-600 font-medium hover:underline">Lap. Fisik</a>}
                        {lap.foto1 && <a href={lap.foto1} target="_blank" className="text-blue-600 hover:underline">Foto 1</a>}
                        {lap.foto2 && <a href={lap.foto2} target="_blank" className="text-blue-600 hover:underline">Foto 2</a>}
                        {lap.buktiTiketTransport && <a href={lap.buktiTiketTransport} target="_blank" className="text-emerald-600 font-bold hover:underline">Tiket</a>}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right space-y-1">
                      {((lap.biayaTransport || 0) > 0 || (lap.biayaTransportLaut || 0) > 0) && lap.statusTransport === 'PENDING' && (
                        <button 
                          onClick={() => cetakInvoiceTransport(lap)}
                          className="w-full text-xs bg-slate-900 text-white hover:bg-slate-800 rounded px-2 py-1.5 transition-colors whitespace-nowrap"
                        >
                          Cetak Invoice Transport
                        </button>
                      )}
                      {lap.statusTransport === 'PAID' && (
                        <button 
                          onClick={() => handleCancelPaid(lap.id)}
                          disabled={cancelingId === lap.id}
                          className="w-full flex items-center justify-center text-xs bg-orange-100 text-orange-700 hover:bg-orange-200 rounded px-2 py-1.5 transition-colors whitespace-nowrap disabled:opacity-50"
                        >
                          {cancelingId === lap.id ? 'Membatalkan...' : 'Batalkan Lunas'}
                        </button>
                      )}
                      <button 
                        onClick={() => handleDelete(lap.id, lap.fasilitatorId)}
                        disabled={deletingId === lap.id}
                        className="w-full flex items-center justify-center gap-1 text-xs bg-red-100 text-red-700 hover:bg-red-200 rounded px-2 py-1.5 transition-colors whitespace-nowrap disabled:opacity-50"
                      >
                        <Trash2 className="w-3 h-3" />
                        {deletingId === lap.id ? 'Menghapus...' : 'Hapus Laporan'}
                      </button>
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
