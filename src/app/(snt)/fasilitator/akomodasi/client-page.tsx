
"use client"

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, terbilangRupiah } from '@/lib/format'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSewaRumah, createAkomodasiToT, deleteAkomodasi } from '@/app/actions/akomodasi'
import { Trash2 } from 'lucide-react'
import { useModal } from '@/components/modal-provider'

export function AkomodasiClient({ initialData, fasilitators }: { initialData: any[], fasilitators: any[] }) {
  const { confirm, alert } = useModal()
  const router = useRouter()
  
  // Custom Modal State for Kop Surat
  const [showKopModal, setShowKopModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any>(null)

  const openKopModal = (item: any) => {
    setSelectedItem(item)
    setShowKopModal(true)
  }

  const handlePrintWithKop = (kopType: 'robotik' | 'maleo') => {
    setShowKopModal(false)
    if (selectedItem) {
      if (selectedItem.tipe === 'SEWA_RUMAH') {
        cetakInvoiceSewa(selectedItem, kopType)
      } else {
        cetakInvoiceToT(selectedItem, kopType)
      }
    }
  }

  const [activeTab, setActiveTab] = useState<'SEWA' | 'TOT'>('SEWA')
 const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)

  // Sewa Form State
  const [fasilitatorId, setFasilitatorId] = useState('')
  const [namaPemilik, setNamaPemilik] = useState('')
  const [alamatSewa, setAlamatSewa] = useState('')
  const [periodeSewa, setPeriodeSewa] = useState('')
  const [hargaSewaBulan, setHargaSewaBulan] = useState('')

  // ToT Form State
  const [namaPenginapan, setNamaPenginapan] = useState('')
  const [alamatPenginapan, setAlamatPenginapan] = useState('')
  const [namaPengelola, setNamaPengelola] = useState('')
  const [namaKegiatan, setNamaKegiatan] = useState('')
  const [tanggalMulai, setTanggalMulai] = useState('')
  const [tanggalSelesai, setTanggalSelesai] = useState('')
  const [jumlahOrang, setJumlahOrang] = useState('')
  const [jumlahKamar, setJumlahKamar] = useState('')
  const [tarifPerMalam, setTarifPerMalam] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (activeTab === 'SEWA') {
        const harga = parseFloat(hargaSewaBulan) || 0
        const totalNominal = harga * 4 // Default 4 bulan
        await createSewaRumah({
          fasilitatorId,
          namaPemilik,
          alamatSewa,
          periodeSewa,
          hargaSewaBulan: harga,
          totalNominal
        })
      } else {
        const tarif = parseFloat(tarifPerMalam) || 0
        const orang = parseInt(jumlahOrang) || 1
        const t1 = new Date(tanggalMulai).getTime()
        const t2 = new Date(tanggalSelesai).getTime()
        const days = Math.max(1, Math.ceil((t2 - t1) / (1000 * 60 * 60 * 24)))
        
        await createAkomodasiToT({
          fasilitatorId,
          namaPenginapan,
          alamatPenginapan,
          namaPengelola,
          namaKegiatan,
          tanggalMulai,
          tanggalSelesai,
          jumlahOrang: parseInt(jumlahOrang),
          jumlahKamar: parseInt(jumlahKamar),
          tarifPerMalam: tarif,
          totalNominal: tarif * orang * days
        })
      }
      setShowForm(false)
      // reset forms
      setFasilitatorId('')
      setNamaPemilik('')
      setAlamatSewa('')
      setPeriodeSewa('')
      setHargaSewaBulan('')
      setNamaPenginapan('')
      setAlamatPenginapan('')
      setNamaPengelola('')
      setNamaKegiatan('')
      setTanggalMulai('')
      setTanggalSelesai('')
      setJumlahOrang('')
      setJumlahKamar('')
      setTarifPerMalam('')
      router.refresh()
    } catch (e: any) {
      await alert('Error: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (await confirm('Hapus data ini?')) {
      await deleteAkomodasi(id)
      router.refresh()
    }
  }

  const cetakInvoiceSewa = (item: any, kopType: 'robotik' | 'maleo') => {
    const win = window.open('', '_blank')
    if (!win) return
    const d = new Date(item.createdAt)
    const noKwitansi = `KWT/MTC/VIII/${d.getFullYear()}`
    

    const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    let startMonthIdx = -1;
    let year = d.getFullYear();
    
    if (item.periodeSewa) {
      const words = item.periodeSewa.split(/[\s-]+/);
      for (const w of words) {
        const idx = monthNames.findIndex(m => m.toLowerCase() === w.toLowerCase());
        if (idx !== -1 && startMonthIdx === -1) startMonthIdx = idx;
        if (w.match(/^20\d{2}$/)) year = parseInt(w);
      }
    }
    
    const getBulan = (offset: number) => {
      if (startMonthIdx === -1) return '';
      const m = (startMonthIdx + offset) % 12;
      const y = year + Math.floor((startMonthIdx + offset) / 12);
      return `${monthNames[m]} ${y}`;
    };
    
    win.document.write(`

      <html>
        <head>
          <title>Kwitansi Sewa Rumah - ${item.namaPemilik}</title>
          <style>
            @page { margin: 0.5cm 1cm; }
            @media print { body { padding: 0; } }
            body { font-family: 'Times New Roman', Times, serif; padding: 10px 40px; line-height: 1.5; font-size: 14px; }
            .header-img { width: 100%; max-height: 120px; object-fit: contain; margin-bottom: 10px; }
            .title-box { text-align: center; margin-bottom: 15px; }
            .title-box h2 { margin: 0; font-size: 20px; font-weight: bold; text-decoration: underline; letter-spacing: 1px; }
            .title-box p { margin: 5px 0 0 0; font-size: 16px; font-weight: bold; }
            .info-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
            .form-group { margin-bottom: 8px; display: flex; }
            .form-label { width: 220px; font-weight: normal; }
            .form-colon { width: 20px; }
            .form-value { flex: 1; font-weight: bold; }
            .form-value-underline { flex: 1; border-bottom: 1px solid #000; padding-bottom: 2px; font-weight: bold; }
            .terbilang-box { background-color: #f1f5f9; padding: 6px 10px; font-style: italic; font-weight: bold; border: 1px dashed #ccc; margin-top: 5px;}
            
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #000; padding: 8px; text-align: center; }
            th { background-color: #f8fafc; }
            
            .ttd-container { display: flex; justify-content: space-between; margin-top: 30px; text-align: center; }
            .ttd-box { width: 250px; }
            .ttd-name { margin-top: 50px; font-weight: bold; text-decoration: underline; }
            .notes { margin-top: 20px; font-size: 12px; }
          </style>
        </head>
        <body>
          <img src="${kopType === 'maleo' ? '/kop-maleo.png' : '/kop-surat.png'}" class="header-img" />
          <div class="title-box">
            <h2>KUITANSI</h2>
            <p>Sewa Rumah / Tempat Tinggal — Periode 4 (Empat) Bulan</p>
          </div>
          
          <div class="info-row">
            <div>No. Kuitansi : <strong>${noKwitansi}</strong></div>
            <div>Tanggal : <strong>${new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</strong></div>
          </div>
          
          <div class="form-group" style="margin-top: 10px;">
            <div class="form-label">Jumlah Uang</div>
            <div class="form-colon">:</div>
            <div class="form-value" style="font-size: 16px;">Rp ${(item.totalNominal || 0).toLocaleString('id-ID')}</div>
          </div>
          <div class="form-group">
            <div class="form-label">Terbilang</div>
            <div class="form-colon">:</div>
            <div class="form-value terbilang-box">${terbilangRupiah(item.totalNominal || 0)}</div>
          </div>
          
          <div class="form-group" style="margin-top: 10px;">
            <div class="form-label">Untuk pembayaran</div>
            <div class="form-colon">:</div>
            <div class="form-value" style="font-weight: normal;">Sewa rumah / tempat tinggal atas nama <strong>${item.fasilitator?.namaLengkap}</strong> untuk keperluan Yayasan Maleo Talenta Cendekia,</div>
          </div>
          
          <div style="margin-left: 20px;">
            <div class="form-group">
              <div class="form-label">Alamat rumah disewa</div>
              <div class="form-colon">:</div>
              <div class="form-value-underline">${item.alamatSewa || '-'}</div>
            </div>
            <div class="form-group">
              <div class="form-label">Periode sewa (bulan ke-1 s.d. ke-4)</div>
              <div class="form-colon">:</div>
              <div class="form-value-underline">${item.periodeSewa || '-'}</div>
            </div>
            <div class="form-group">
              <div class="form-label">Harga sewa / bulan</div>
              <div class="form-colon">:</div>
              <div class="form-value-underline">Rp ${(item.hargaSewaBulan || 0).toLocaleString('id-ID')}</div>
            </div>
          </div>
          
          <div style="margin-top: 10px;">Rincian per bulan:</div>
          <table>
            <thead>
              <tr>
                <th>Bulan ke-</th>
                <th>Periode</th>
                <th>Nominal (Rp)</th>
                <th>Paraf Penerima</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>1</td><td>${getBulan(0)}</td><td>${(item.hargaSewaBulan || 0).toLocaleString('id-ID')}</td><td></td></tr>
              <tr><td>2</td><td>${getBulan(1)}</td><td>${(item.hargaSewaBulan || 0).toLocaleString('id-ID')}</td><td></td></tr>
              <tr><td>3</td><td>${getBulan(2)}</td><td>${(item.hargaSewaBulan || 0).toLocaleString('id-ID')}</td><td></td></tr>
              <tr><td>4</td><td>${getBulan(3)}</td><td>${(item.hargaSewaBulan || 0).toLocaleString('id-ID')}</td><td></td></tr>
            </tbody>
          </table>
          
          <div class="ttd-container">
            <div class="ttd-box">
              <div>Yang Menyerahkan / Menyetujui,</div>
              <div style="font-weight: bold;">Yayasan Maleo Talenta Cendekia</div>
              <div class="ttd-name">( ______________________________ )</div>
            </div>
            <div class="ttd-box">
              <div>Yang Menerima,</div>
              <div style="font-weight: bold;">Pemilik / Kuasa Pemilik Rumah</div>
              <div class="ttd-name">( ${item.namaPemilik || '______________________________'} )</div>
            </div>
          </div>
          
          <div class="notes">
            <strong>Catatan:</strong><br/>
            • Materai Rp10.000 ditempel bila nominal pembayaran di atas Rp5.000.000.<br/>
            • Lampirkan salinan identitas pemilik dan bukti kepemilikan/kuasa sewa bila diperlukan untuk arsip.
          </div>
          
          <script>window.print()</script>
        </body>
      </html>
    `)
    win.document.close()
  }

  const cetakInvoiceToT = (item: any, kopType: 'robotik' | 'maleo') => {
    const win = window.open('', '_blank')
    if (!win) return
    const d = new Date(item.createdAt)
    const noKwitansi = `KWT/MTC/_/${d.getFullYear()}`
    
    const t1 = new Date(item.tanggalMulai).getTime()
    const t2 = new Date(item.tanggalSelesai).getTime()
    const days = Math.max(1, Math.ceil((t2 - t1) / (1000 * 60 * 60 * 24)))
    
    win.document.write(`
      <html>
        <head>
          <title>Kwitansi Akomodasi ToT - ${item.namaPengelola}</title>
          <style>
            @page { margin: 0.5cm 1cm; }
            @media print { body { padding: 0; } }
            body { font-family: 'Times New Roman', Times, serif; padding: 10px 40px; line-height: 1.5; font-size: 14px; }
            .header-img { width: 100%; max-height: 120px; object-fit: contain; margin-bottom: 10px; }
            .title-box { text-align: center; margin-bottom: 15px; }
            .title-box h2 { margin: 0; font-size: 20px; font-weight: bold; text-decoration: underline; letter-spacing: 1px; }
            .title-box p { margin: 5px 0 0 0; font-size: 16px; font-weight: bold; }
            .info-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
            .form-group { margin-bottom: 8px; display: flex; }
            .form-label { width: 220px; font-weight: normal; }
            .form-colon { width: 20px; }
            .form-value { flex: 1; font-weight: bold; }
            .form-value-underline { flex: 1; border-bottom: 1px solid #000; padding-bottom: 2px; font-weight: bold; }
            .terbilang-box { background-color: #f1f5f9; padding: 6px 10px; font-style: italic; font-weight: bold; border: 1px dashed #ccc; margin-top: 5px;}
            
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #000; padding: 8px; text-align: center; }
            th { background-color: #f8fafc; }
            
            .ttd-container { display: flex; justify-content: space-between; margin-top: 30px; text-align: center; }
            .ttd-box { width: 250px; }
            .ttd-name { margin-top: 50px; font-weight: bold; text-decoration: underline; }
            .notes { margin-top: 20px; font-size: 12px; }
          </style>
        </head>
        <body>
          <img src="${kopType === 'maleo' ? '/kop-maleo.png' : '/kop-surat.png'}" class="header-img" />
          <div class="title-box">
            <h2>KUITANSI</h2>
            <p>Sewa Tempat Tinggal / Akomodasi — Pelatihan ToT (${days} Hari)</p>
          </div>
          
          <div class="info-row">
            <div>No. Kuitansi : <strong>${noKwitansi}</strong></div>
            <div>Tanggal : <strong>${new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</strong></div>
          </div>
          
          <div class="form-group">
            <div class="form-label">Telah terima dari</div>
            <div class="form-colon">:</div>
            <div class="form-value-underline">Yayasan Maleo Talenta Cendekia</div>
          </div>
          
          <div class="form-group" style="margin-top: 10px;">
            <div class="form-label">Jumlah Uang</div>
            <div class="form-colon">:</div>
            <div class="form-value" style="font-size: 16px;">Rp ${(item.totalNominal || 0).toLocaleString('id-ID')}</div>
          </div>
          <div class="form-group">
            <div class="form-label">Terbilang</div>
            <div class="form-colon">:</div>
            <div class="form-value terbilang-box">${terbilangRupiah(item.totalNominal || 0)}</div>
          </div>
          
          <div class="form-group" style="margin-top: 10px;">
            <div class="form-label">Untuk pembayaran</div>
            <div class="form-colon">:</div>
            <div class="form-value" style="font-weight: normal;">Sewa akomodasi/tempat tinggal peserta & fasilitator selama pelaksanaan Training of Trainers (ToT) berikut:</div>
          </div>
          
          <div style="margin-left: 20px;">
            <div class="form-group">
              <div class="form-label">Nama tempat/penginapan</div>
              <div class="form-colon">:</div>
              <div class="form-value-underline">${item.namaPenginapan || '-'}</div>
            </div>
            <div class="form-group">
              <div class="form-label">Alamat</div>
              <div class="form-colon">:</div>
              <div class="form-value-underline">${item.alamatPenginapan || '-'}</div>
            </div>
            <div class="form-group">
              <div class="form-label">Nama pengelola/pemilik</div>
              <div class="form-colon">:</div>
              <div class="form-value-underline">${item.namaPengelola || '-'}</div>
            </div>
            <div class="form-group">
              <div class="form-label">Nama kegiatan ToT</div>
              <div class="form-colon">:</div>
              <div class="form-value-underline">${item.namaKegiatan || '-'}</div>
            </div>
            <div class="form-group">
              <div class="form-label">Tanggal mulai</div>
              <div class="form-colon">:</div>
              <div class="form-value-underline">${new Date(item.tanggalMulai).toLocaleDateString('id-ID')}</div>
            </div>
            <div class="form-group">
              <div class="form-label">Tanggal selesai (${days} hari)</div>
              <div class="form-colon">:</div>
              <div class="form-value-underline">${new Date(item.tanggalSelesai).toLocaleDateString('id-ID')}</div>
            </div>
            <div class="form-group">
              <div class="form-label">Jumlah orang menginap</div>
              <div class="form-colon">:</div>
              <div class="form-value-underline">${item.jumlahOrang || 0} Orang</div>
            </div>
            <div class="form-group">
              <div class="form-label">Jumlah kamar</div>
              <div class="form-colon">:</div>
              <div class="form-value-underline">${item.jumlahKamar || 0} Kamar</div>
            </div>
            <div class="form-group">
              <div class="form-label">Tarif per orang/malam</div>
              <div class="form-colon">:</div>
              <div class="form-value-underline">Rp ${(item.tarifPerMalam || 0).toLocaleString('id-ID')}</div>
            </div>
          </div>
          
          <div style="margin-top: 10px;">Perhitungan total:</div>
          <table>
            <thead>
              <tr>
                <th>Jumlah Orang</th>
                <th>Jumlah Malam</th>
                <th>Total (Rp)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${item.jumlahOrang || 0}</td>
                <td>${days}</td>
                <td>${(item.totalNominal || 0).toLocaleString('id-ID')}</td>
              </tr>
            </tbody>
          </table>
          
          <div class="ttd-container">
            <div class="ttd-box">
              <div>Mengetahui / Menyetujui,</div>
              <div style="font-weight: bold;">Yayasan Maleo Talenta Cendekia</div>
              <div class="ttd-name">( ______________________________ )</div>
            </div>
            <div class="ttd-box">
              <div>Yang Menerima,</div>
              <div style="font-weight: bold;">Pengelola / Pemilik Tempat Tinggal</div>
              <div class="ttd-name">( ${item.namaPengelola || '______________________________'} )</div>
            </div>
          </div>
          
          <div class="notes">
            <strong>Catatan:</strong><br/>
            • Materai Rp10.000 ditempel bila nominal pembayaran di atas Rp5.000.000.<br/>
            • Lampirkan daftar nama peserta/fasilitator yang menginap dan bukti check-in/check-out bila tersedia.
          </div>
          
          <script>window.print()</script>
        </body>
      </html>
    `)
    win.document.close()
  }

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kwitansi Sewa & Akomodasi</h1>
          <p className="text-slate-500 mt-1">Generate dan cetak kwitansi Sewa Rumah dan Akomodasi ToT Fasilitator</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-slate-900 text-white px-4 py-2 rounded-md hover:bg-slate-800"
        >
          {showForm ? 'Batal' : '+ Buat Kwitansi Baru'}
        </button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex space-x-4 border-b mb-4">
              <button 
                className={`pb-2 px-1 ${activeTab === 'SEWA' ? 'border-b-2 border-slate-900 font-bold' : 'text-slate-500'}`}
                onClick={() => setActiveTab('SEWA')}
              >
                Sewa Rumah (4 Bulan)
              </button>
              <button 
                className={`pb-2 px-1 ${activeTab === 'TOT' ? 'border-b-2 border-slate-900 font-bold' : 'text-slate-500'}`}
                onClick={() => setActiveTab('TOT')}
              >
                Akomodasi ToT
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Fasilitator (Ditugaskan)</label>
                <select required className="w-full border rounded p-2" value={fasilitatorId} onChange={e => setFasilitatorId(e.target.value)}>
                  <option value="">Pilih Fasilitator...</option>
                  {fasilitators.map(f => (
                    <option key={f.id} value={f.id}>{f.namaLengkap} - {f.lokasiSNT}</option>
                  ))}
                </select>
              </div>

              {activeTab === 'SEWA' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">Nama Pemilik / Kuasa</label>
                    <input type="text" required className="w-full border rounded p-2" value={namaPemilik} onChange={e => setNamaPemilik(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Alamat Rumah Disewa</label>
                    <input type="text" required className="w-full border rounded p-2" value={alamatSewa} onChange={e => setAlamatSewa(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Periode Sewa</label>
                      <input type="text" placeholder="Misal: Januari 2026 - April 2026" required className="w-full border rounded p-2" value={periodeSewa} onChange={e => setPeriodeSewa(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Harga Sewa per Bulan (Rp)</label>
                      <input type="number" required className="w-full border rounded p-2" value={hargaSewaBulan} onChange={e => setHargaSewaBulan(e.target.value)} />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Nama Penginapan</label>
                      <input type="text" required className="w-full border rounded p-2" value={namaPenginapan} onChange={e => setNamaPenginapan(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Nama Pengelola / Pemilik</label>
                      <input type="text" required className="w-full border rounded p-2" value={namaPengelola} onChange={e => setNamaPengelola(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Alamat Penginapan</label>
                    <input type="text" required className="w-full border rounded p-2" value={alamatPenginapan} onChange={e => setAlamatPenginapan(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Nama Kegiatan</label>
                    <input type="text" required className="w-full border rounded p-2" value={namaKegiatan} onChange={e => setNamaKegiatan(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Tanggal Mulai</label>
                      <input type="date" required className="w-full border rounded p-2" value={tanggalMulai} onChange={e => setTanggalMulai(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Tanggal Selesai</label>
                      <input type="date" required className="w-full border rounded p-2" value={tanggalSelesai} onChange={e => setTanggalSelesai(e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Jumlah Orang</label>
                      <input type="number" required className="w-full border rounded p-2" value={jumlahOrang} onChange={e => setJumlahOrang(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Jumlah Kamar</label>
                      <input type="number" required className="w-full border rounded p-2" value={jumlahKamar} onChange={e => setJumlahKamar(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Tarif per Org/Mlm (Rp)</label>
                      <input type="number" required className="w-full border rounded p-2" value={tarifPerMalam} onChange={e => setTarifPerMalam(e.target.value)} />
                    </div>
                  </div>
                </>
              )}

              <div className="flex justify-end mt-4">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Menyimpan...' : 'Simpan & Buat Kwitansi'}
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="py-3 px-4">Tanggal Buat</th>
                  <th className="py-3 px-4">Tipe Kwitansi</th>
                  <th className="py-3 px-4">Fasilitator</th>
                  <th className="py-3 px-4 text-right">Total Nominal</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {initialData.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4">{new Date(item.createdAt).toLocaleDateString('id-ID')}</td>
                    <td className="py-3 px-4">
                      <Badge variant={item.tipe === 'SEWA_RUMAH' ? 'default' : 'secondary'}>
                        {item.tipe === 'SEWA_RUMAH' ? 'Sewa Rumah' : 'Akomodasi ToT'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 font-medium">{item.fasilitator?.namaLengkap}</td>
                    <td className="py-3 px-4 text-right font-medium">{formatCurrency(item.totalNominal)}</td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant="outline" className="bg-slate-100">Saved</Badge>
                    </td>
                    <td className="py-3 px-4 text-right flex justify-end space-x-2">
                      <button 
                        onClick={() => openKopModal(item)}
                        className="text-xs bg-slate-900 text-white hover:bg-slate-800 rounded px-2 py-1.5 transition-colors"
                      >
                        Cetak Kwitansi
                      </button>
                      <button 
                        onClick={() => handleDelete(item.id)}
                        className="text-xs bg-red-100 text-red-700 hover:bg-red-200 rounded px-2 py-1.5 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    
      {/* Modal Pilih Kop Surat */}
      {showKopModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-96">
            <h3 className="text-lg font-bold mb-4">Pilih Kop Surat Kwitansi</h3>
            <p className="text-sm text-slate-600 mb-6">Pilih jenis kop surat yang akan digunakan untuk mencetak kwitansi ini.</p>
            <div className="flex flex-col space-y-3">
              <button 
                onClick={() => handlePrintWithKop('robotik')}
                className="w-full py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md transition-colors text-left flex justify-between items-center"
              >
                <span>Gunakan Kop Robotik (Standar)</span>
              </button>
              <button 
                onClick={() => handlePrintWithKop('maleo')}
                className="w-full py-2 px-4 bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 font-medium rounded-md transition-colors text-left flex justify-between items-center"
              >
                <span>Gunakan Kop Yayasan Maleo</span>
              </button>
            </div>
            <div className="mt-6 flex justify-end">
              <button onClick={() => setShowKopModal(false)} className="text-sm text-slate-500 hover:text-slate-800">
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
