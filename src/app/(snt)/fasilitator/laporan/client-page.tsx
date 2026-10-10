"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/format'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { deleteLaporanKegiatan, updateLaporanKegiatan } from '@/app/actions/rab'
import { Trash2 } from 'lucide-react'
import { cancelTransportPaid, adminUpdateTransportAmount } from '@/app/actions/rekap'
import { useModal } from '@/components/modal-provider';

export function LaporanClient({ initialData }: { initialData: any[] }) {
  const { confirm, alert } = useModal();

  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [filterNama, setFilterNama] = useState('')
  const [filterBulan, setFilterBulan] = useState('')

  const [cancelingId, setCancelingId] = useState<string | null>(null)
  
  const [editingTransport, setEditingTransport] = useState<any | null>(null);
  const [editDarat, setEditDarat] = useState(0);
  const [editLaut, setEditLaut] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveTransport = async () => {
    if (!editingTransport) return;
    setIsSaving(true);
    try {
      await adminUpdateTransportAmount(editingTransport.id, editDarat, editLaut);
      alert('Success', 'Biaya transport berhasil diperbarui.');
      setEditingTransport(null);
      router.refresh();
    } catch (e: any) {
      alert('Error', e.message || 'Gagal menyimpan perubahan');
    } finally {
      setIsSaving(false);
    }
  };


  const handleDelete = async (lapId: string, fasilitatorId: string) => {
    if (!(await confirm('Apakah Anda yakin ingin menghapus laporan ini? Tindakan ini tidak dapat dibatalkan.'))) return;
    setDeletingId(lapId);
    try {
      const res = await deleteLaporanKegiatan(lapId, fasilitatorId);
      if (res?.error) {
        await alert(res.error);
      } else {
        router.refresh();
      }
    } catch (e: any) {
      await alert('Gagal menghapus: ' + e.message);
    } finally {
      setDeletingId(null);
    }
  }
  
  
  const handleCancelPaid = async (lapId: string) => {
    if (!(await confirm('Apakah Anda yakin ingin membatalkan status Lunas untuk laporan ini? Data Pengeluaran yang terkait juga akan dihapus.'))) return;
    setCancelingId(lapId);
    try {
      const res = await cancelTransportPaid(lapId);
      if (res?.error) {
        await alert(res.error);
      } else {
        router.refresh();
      }
    } catch (e: any) {
      await alert('Gagal membatalkan lunas: ' + e.message);
    } finally {
      setCancelingId(null);
    }
  }

  const cetakInvoiceTransport = (lap: any) => {
    // Cari semua laporan pada tanggal yang sama untuk fasilitator ini
    const sameDayReports = initialData.filter(r => 
      r.fasilitatorId === lap.fasilitatorId && 
      new Date(r.date).toDateString() === new Date(lap.date).toDateString()
    );

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
              <p><strong>Lokasi SNT:</strong> ${lap.fasilitator.lokasiSNT || '-'}</p>
              <p><strong>Tanggal Laporan:</strong> ${new Date(lap.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
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
              ${sameDayReports.map((r: any, i: number) => `
                <tr>
                  <td>
                    ${r.topic} <br/>
                    <small style="color: #64748b;">${r.jumlahJPIntra > 0 ? 'Intrakurikuler' : 'Ekstrakurikuler'}</small>
                  </td>
                  <td>${r.tingkatSekolah} <br/><small>${r.metodePelaksanaan}</small></td>
                  <td>${(r.jumlahJPIntra || 0) + (r.jumlahJPEkstra || 0)}</td>
                  ${i === 0 ? `<td rowspan="${sameDayReports.length}">Rp ${((lap.biayaTransport || 0) + (lap.biayaTransportLaut || 0)).toLocaleString('id-ID')} <br/><small>(Darat: Rp ${(lap.biayaTransport || 0).toLocaleString('id-ID')} | Laut: Rp ${(lap.biayaTransportLaut || 0).toLocaleString('id-ID')})</small></td>` : ''}
                </tr>
              `).join('')}
              <tr>
                <td colspan="3" class="total">TOTAL TAGIHAN TRANSPORT:</td>
                <td class="total text-emerald-600">Rp ${((lap.biayaTransport || 0) + (lap.biayaTransportLaut || 0)).toLocaleString('id-ID')}</td>
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

  
  const filteredData = initialData.filter((lap: any) => {
    const matchNama = lap.fasilitator?.namaLengkap?.toLowerCase().includes(filterNama.toLowerCase()) ?? true;
    let matchBulan = true;
    if (filterBulan) {
      const d = new Date(lap.date);
      matchBulan = (d.getMonth() + 1).toString() === filterBulan;
    }
    return matchNama && matchBulan;
  });

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Laporan Mingguan Fasilitator</h1>
        <p className="text-slate-500 mt-1">Kelola dan pantau aktivitas mingguan seluruh fasilitator</p>
      </div>
      <div className="flex flex-col md:flex-row gap-4 mb-2">
        <div className="flex-1">
          <label className="text-sm font-medium mb-1 block">Cari Nama Fasilitator</label>
          <input 
            type="text" 
            placeholder="Ketik nama..." 
            value={filterNama}
            onChange={e => setFilterNama(e.target.value)}
            className="w-full border rounded-lg p-2 text-sm"
          />
        </div>
        <div className="w-full md:w-64">
          <label className="text-sm font-medium mb-1 block">Filter Bulan</label>
          <select 
            value={filterBulan}
            onChange={e => setFilterBulan(e.target.value)}
            className="w-full border rounded-lg p-2 text-sm bg-white"
          >
            <option value="">Semua Bulan</option>
            <option value="1">Januari</option>
            <option value="2">Februari</option>
            <option value="3">Maret</option>
            <option value="4">April</option>
            <option value="5">Mei</option>
            <option value="6">Juni</option>
            <option value="7">Juli</option>
            <option value="8">Agustus</option>
            <option value="9">September</option>
            <option value="10">Oktober</option>
            <option value="11">November</option>
            <option value="12">Desember</option>
          </select>
        </div>
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
                {filteredData.map((lap) => (
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
                            <div className="text-[10px] text-slate-500 mt-1 flex flex-col items-end">
                              {(lap.biayaTransport || 0) > 0 && <span>Darat: {formatCurrency(lap.biayaTransport)}</span>}
                              {(lap.biayaTransportLaut || 0) > 0 && <span>Laut: {formatCurrency(lap.biayaTransportLaut)}</span>}
                            </div>
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
                        {lap.buktiTransportDarat && <a href={lap.buktiTransportDarat} target="_blank" className="text-blue-600 font-bold hover:underline mr-2">Bukti Darat</a>}
                        {lap.buktiTiketTransport && <a href={lap.buktiTiketTransport} target="_blank" className="text-emerald-600 font-bold hover:underline">Bukti Laut</a>}
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
                        {((lap.biayaTransport || 0) > 0 || (lap.reqBiayaTransport || 0) > 0) && lap.statusTransport === 'PENDING' && (
                          <button 
                            onClick={() => {
                              setEditingTransport(lap);
                              setEditDarat(lap.biayaTransport || 0);
                              setEditLaut(lap.biayaTransportLaut || 0);
                            }}
                            className="w-full text-xs bg-amber-100 text-amber-700 hover:bg-amber-200 rounded px-2 py-1.5 transition-colors whitespace-nowrap mt-1"
                          >
                            ✏️ Edit Transport
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

      {editingTransport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold mb-4">Edit Nominal Transport</h3>
            <div className="mb-4 text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border">
              <p><strong>Fasilitator:</strong> {editingTransport.fasilitator?.namaLengkap}</p>
              <p><strong>Tanggal:</strong> {new Date(editingTransport.date).toLocaleDateString('id-ID')}</p>
              <p><strong>Req Awal Darat:</strong> {formatCurrency(editingTransport.reqBiayaTransport || 0)}</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Biaya Transport Darat (Disetujui)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-500">Rp</span>
                  <input 
                    type="number" 
                    value={editDarat} 
                    onChange={e => setEditDarat(Number(e.target.value))}
                    className="w-full border rounded-lg pl-8 pr-2 py-2"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Biaya Transport Laut (Disetujui)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-500">Rp</span>
                  <input 
                    type="number" 
                    value={editLaut} 
                    onChange={e => setEditLaut(Number(e.target.value))}
                    className="w-full border rounded-lg pl-8 pr-2 py-2"
                  />
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end gap-2">
              <button 
                onClick={() => setEditingTransport(null)}
                className="px-4 py-2 text-sm text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
                disabled={isSaving}
              >
                Batal
              </button>
              <button 
                onClick={handleSaveTransport}
                className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                disabled={isSaving}
              >
                {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
