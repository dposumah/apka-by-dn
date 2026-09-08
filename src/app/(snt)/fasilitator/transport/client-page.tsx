"use client"

import { useState } from 'react'
import { markTransportPaid } from '@/app/actions/rekap'
import { CheckCircle2, Upload, Eye } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export function TransportClient({ initialData }: { initialData: any[] }) {
  const router = useRouter()
  const [processingId, setProcessingId] = useState<string | null>(null)

  const handleUploadTransfer = async (e: React.ChangeEvent<HTMLInputElement>, id: string) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!confirm('Tandai biaya transport ini lunas dan unggah bukti transfer?')) {
      e.target.value = ''
      return
    }
    
    setProcessingId(id)
    try {
      const uploadData = new FormData()
      uploadData.append('file', file)
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: uploadData
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      await markTransportPaid(id, data.url)
      router.refresh()
    } catch (e: any) {
      alert('Gagal mengupdate data atau mengunggah bukti transfer')
    } finally {
      setProcessingId(null)
    }
  }

  if (initialData.length === 0) {
    return <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-md border border-dashed">Tidak ada tagihan transport yang pending.</div>
  }

  // Hitung total keseluruhan
  const totalAmount = initialData.reduce((sum, item) => sum + (item.biayaTransportDisetujui || 0) + (item.biayaTransportLaut || 0), 0)
  const formatRp = (v: number) => new Intl.NumberFormat('id-ID').format(v)

  return (
    <div>
      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md flex justify-between items-center">
        <span className="font-medium text-blue-900">Total Tagihan Keseluruhan:</span>
        <span className="text-xl font-bold text-blue-700">Rp {totalAmount.toLocaleString('id-ID')}</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="text-xs uppercase bg-slate-50 border-b">
            <tr>
              <th className="px-4 py-3">Tanggal Kegiatan</th>
              <th className="px-4 py-3">Fasilitator</th>
              <th className="px-4 py-3">Transport Darat</th>
              <th className="px-4 py-3">Transport Laut</th>
              <th className="px-4 py-3 text-right">Biaya Disetujui</th>
              <th className="px-4 py-3 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {initialData.map((lap) => (
              <tr key={lap.id} className="border-b hover:bg-slate-50">
                <td className="px-4 py-3">{new Date(lap.date).toLocaleDateString('id-ID')}</td>
                <td className="px-4 py-3 font-medium text-slate-900">
                  {lap.fasilitator.namaLengkap}
                  <div className="text-xs text-slate-500">{lap.fasilitator.bankName} - {lap.fasilitator.bankAccount}</div>
                  <div className="text-xs text-slate-400 mt-1">{lap.fasilitator.lokasiSNT?.split(' - ')[0]}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-800">{lap.modeTransport === 'ONLINE' ? 'ONLINE' : lap.jenisKendaraan ? `PRIBADI (${lap.jenisKendaraan})` : 'TIDAK ADA'}</div>
                  {lap.modeTransport === 'PRIBADI' && lap.jenisKendaraan && (
                    <div className="text-xs text-slate-500 mt-1">
                      {lap.jarakTempuhKm} KM | {lap.jenisBBM}<br/>
                      Struk: Rp {formatRp(lap.nominalStruk || 0)}<br/>
                      Plafon: Rp {formatRp(lap.plafonMaksimal || 0)}
                    </div>
                  )}
                  {lap.modeTransport === 'ONLINE' && lap.nominalInvoice > 0 && (
                    <div className="text-xs text-slate-500 mt-1">
                      Invoice: Rp {formatRp(lap.nominalInvoice || 0)}
                    </div>
                  )}
                  {(lap.buktiStrukBBM || lap.buktiInvoiceOnline) && (
                    <Link href={lap.buktiStrukBBM || lap.buktiInvoiceOnline || '#'} target="_blank" className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1">
                      <Eye className="w-3 h-3" /> Lihat Bukti Darat
                    </Link>
                  )}
                </td>
                <td className="px-4 py-3">
                  {lap.biayaTransportLaut > 0 ? (
                    <>
                      <div className="font-medium text-slate-800">Rp {formatRp(lap.biayaTransportLaut)}</div>
                      {lap.buktiTiketTransport && (
                        <Link href={lap.buktiTiketTransport} target="_blank" className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1">
                          <Eye className="w-3 h-3" /> Lihat Tiket Laut
                        </Link>
                      )}
                    </>
                  ) : '-'}
                </td>
                <td className="px-4 py-3 text-right font-bold text-emerald-700">
                  Rp {formatRp((lap.biayaTransportDisetujui || 0) + (lap.biayaTransportLaut || 0))}
                </td>
                <td className="px-4 py-3 text-center">
                  <label className={`inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-medium rounded transition-colors ${processingId === lap.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                    <Upload className="w-3 h-3" /> {processingId === lap.id ? 'Memproses...' : 'Upload & Lunas'}
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" disabled={processingId === lap.id} onChange={(e) => handleUploadTransfer(e, lap.id)} />
                  </label>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
