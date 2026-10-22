'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/format'
import { createPaketIoT, deletePaketIoT } from '@/app/actions/iot'
import { generateRabIotHtml, generateTandaTerimaIotHtml } from '@/lib/pdf-iot-templates'
import { 
  Plus, 
  Search, 
  Printer, 
  Trash2, 
  ExternalLink, 
  CheckCircle2, 
  FileText, 
  Bot, 
  Package, 
  Layers, 
  Coins, 
  ArrowRight,
  Loader2,
  X
} from 'lucide-react'

export function AlatBahanIotClient({ 
  initialPaketList = [], 
  fasilitators = [] 
}: { 
  initialPaketList: any[], 
  fasilitators: any[] 
}) {
  const router = useRouter()
  const [paketList, setPaketList] = useState<any[]>(initialPaketList)
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Form State for New Package
  const [formData, setFormData] = useState({
    lokasiSNT: '',
    namaPaket: '',
    lingkupProyek: 'Rover (Smart Trash IoT), Smart Lamp IoT, dan Smart Garden IoT',
    nomorSurat: '',
    tanggalSurat: new Date().toISOString().split('T')[0],
    fasilitatorId: '',
    mengetahuiNama: '',
    mengetahuiNip: '',
    mengetahuiJabatan: 'Kepala SNT',
    persenCadangan: 10,
    loadDefaultTemplate: true
  })

  // Distinct locations from fasilitators
  const lokasiOptions = Array.from(
    new Set(fasilitators.map(f => f.lokasiSNT).filter(Boolean))
  ).sort()

  const handleSelectFasilitator = (fasilId: string) => {
    const f = fasilitators.find(item => item.id === fasilId)
    if (f) {
      setFormData(prev => ({
        ...prev,
        fasilitatorId: fasilId,
        lokasiSNT: f.lokasiSNT || prev.lokasiSNT,
        namaPaket: prev.namaPaket || `Pengadaan Alat dan Bahan Robotika - ${f.lokasiSNT || ''}`
      }))
    } else {
      setFormData(prev => ({ ...prev, fasilitatorId: '' }))
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.lokasiSNT.trim()) {
      alert('Isi atau pilih Lokasi SNT')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await createPaketIoT(formData)
      if (res?.error) {
        alert('Gagal membuat paket: ' + res.error)
        return
      }

      setShowCreateModal(false)
      alert('Paket pengadaan IoT berhasil dibuat!')
      router.refresh()
      if (res?.paket?.id) {
        router.push(`/alat-bahan-iot/${res.paket.id}`)
      }
    } catch (err: any) {
      alert('Terjadi kesalahan: ' + (err.message || err))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (paket: any) => {
    if (!confirm(`Hapus paket pengadaan IoT untuk "${paket.lokasiSNT}"?\nSemua rincian item barang akan ikut dihapus.`)) {
      return
    }

    setDeletingId(paket.id)
    try {
      const res = await deletePaketIoT(paket.id)
      if (res?.error) {
        alert('Gagal menghapus: ' + res.error)
        return
      }
      setPaketList(prev => prev.filter(p => p.id !== paket.id))
      router.refresh()
    } catch (err: any) {
      alert('Terjadi kesalahan: ' + (err.message || err))
    } finally {
      setDeletingId(null)
    }
  }

  const handlePrintTandaTerima = (paket: any) => {
    const html = generateTandaTerimaIotHtml(paket, paket.items || [])
    const win = window.open('', '_blank')
    if (win) {
      win.document.write(html)
      win.document.close()
      setTimeout(() => {
        win.print()
      }, 700)
    }
  }

  const handlePrintRAB = (paket: any) => {
    const html = generateRabIotHtml(paket, paket.items || [])
    const win = window.open('', '_blank')
    if (win) {
      win.document.write(html)
      win.document.close()
      setTimeout(() => {
        win.print()
      }, 700)
    }
  }

  // Filter list
  const filteredList = paketList.filter(p => {
    const q = searchQuery.toLowerCase()
    return (
      (p.lokasiSNT || '').toLowerCase().includes(q) ||
      (p.namaPaket || '').toLowerCase().includes(q) ||
      (p.nomorSurat || '').toLowerCase().includes(q) ||
      (p.pihakKeduaNama || '').toLowerCase().includes(q) ||
      (p.fasilitator?.namaLengkap || '').toLowerCase().includes(q)
    )
  })

  // Summary Metrics
  const totalLokasi = paketList.length
  const totalPaguAll = paketList.reduce((sum, p) => sum + (p.totalPaguRAB || 0), 0)
  const totalRealAll = paketList.reduce((sum, p) => sum + (p.totalRealisasi || 0), 0)
  const totalSisaAll = totalPaguAll - totalRealAll

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1440px] mx-auto">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-blue-100 text-blue-800 rounded-lg">
              <Bot className="w-6 h-6" />
            </span>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
              Pengadaan Alat & Bahan IoT / Robotika
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Penyusunan Rencana Anggaran Biaya (RAB) dan Surat Tanda Terima serah terima barang per lokasi SNT. Terintegrasi langsung dengan <strong>RAB Kategori D (Biaya IoT/Robotic)</strong>.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard-rab"
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-xs"
          >
            <ExternalLink className="w-4 h-4 text-slate-500" />
            <span>Dashboard RAB</span>
          </Link>

          <button
            onClick={() => {
              setFormData({
                lokasiSNT: '',
                namaPaket: '',
                lingkupProyek: 'Rover (Smart Trash IoT), Smart Lamp IoT, dan Smart Garden IoT',
                nomorSurat: `……/RE/SNT-K2/X/${new Date().getFullYear()}`,
                tanggalSurat: new Date().toISOString().split('T')[0],
                fasilitatorId: '',
                mengetahuiNama: '',
                mengetahuiNip: '',
                mengetahuiJabatan: 'Kepala SNT',
                persenCadangan: 10,
                loadDefaultTemplate: true
              })
              setShowCreateModal(true)
            }}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Buat Paket IoT Baru</span>
          </button>
        </div>
      </div>

      {/* METRIC STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="pb-2">
            <span className="text-xs font-semibold uppercase text-slate-500 flex items-center justify-between">
              <span>Total Lokasi SNT</span>
              <Package className="w-4 h-4 text-blue-600" />
            </span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{totalLokasi} Lokasi</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Paket pengadaan robotika</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="pb-2">
            <span className="text-xs font-semibold uppercase text-slate-500 flex items-center justify-between">
              <span>Total Pagu RAB</span>
              <Layers className="w-4 h-4 text-indigo-600" />
            </span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-900">{formatCurrency(totalPaguAll)}</div>
            <p className="text-[11px] text-indigo-600/80 mt-0.5">Total rencana anggaran Kategori D</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="pb-2">
            <span className="text-xs font-semibold uppercase text-slate-500 flex items-center justify-between">
              <span>Realisasi Belanja</span>
              <Coins className="w-4 h-4 text-emerald-600" />
            </span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700">{formatCurrency(totalRealAll)}</div>
            <p className="text-[11px] text-emerald-600/80 mt-0.5">Total tanda terima diserahterimakan</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="pb-2">
            <span className="text-xs font-semibold uppercase text-slate-500 flex items-center justify-between">
              <span>Sisa Anggaran Pagu</span>
              <CheckCircle2 className="w-4 h-4 text-slate-600" />
            </span>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalSisaAll < 0 ? 'text-rose-600' : 'text-slate-900'}`}>
              {formatCurrency(totalSisaAll)}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {totalSisaAll < 0 ? 'Melebihi total pagu rencana' : 'Sisa saldo alokasi Kategori D'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* SEARCH BAR & LIST */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="bg-slate-50/70 border-b pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold text-slate-900">
                Daftar Paket Pengadaan Alat & Bahan Robotika
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Pilih paket lokasi untuk mengedit 51+ item alat bahan, mencetak tanda terima resmi, atau mencetak RAB.
              </CardDescription>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cari lokasi, fasilitator, no. surat..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 uppercase border-b text-[11px]">
                <tr>
                  <th className="px-4 py-3 text-center" style={{ width: '40px' }}>No</th>
                  <th className="px-4 py-3">Lokasi SNT &amp; Satuan Pendidikan</th>
                  <th className="px-4 py-3">Fasilitator Penerima</th>
                  <th className="px-4 py-3">Nomor &amp; Tanggal Surat</th>
                  <th className="px-4 py-3 text-right">Pagu RAB</th>
                  <th className="px-4 py-3 text-right">Realisasi Belanja</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-center" style={{ width: '220px' }}>Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredList.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-slate-400">
                      Belum ada paket pengadaan alat/bahan IoT. Klik tombol "+ Buat Paket IoT Baru" di atas.
                    </td>
                  </tr>
                ) : (
                  filteredList.map((paket, idx) => {
                    const totalRAB = paket.totalPaguRAB || 0
                    const totalReal = paket.totalRealisasi || 0
                    const itCount = paket.items?.length || 0

                    return (
                      <tr key={paket.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3.5 text-center font-mono text-slate-500">{idx + 1}</td>
                        <td className="px-4 py-3.5 font-medium text-slate-900">
                          <div className="font-bold text-sm text-blue-900">{paket.lokasiSNT}</div>
                          <div className="text-[11px] text-slate-500">{paket.namaPaket}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{itCount} item alat & bahan terdaftar</div>
                        </td>
                        <td className="px-4 py-3.5 text-slate-700">
                          <div className="font-semibold">{paket.pihakKeduaNama || paket.fasilitator?.namaLengkap || '–'}</div>
                          <div className="text-[11px] text-slate-500">{paket.pihakKeduaJabatan || 'Fasilitator'}</div>
                        </td>
                        <td className="px-4 py-3.5 text-slate-600 font-mono text-[11px]">
                          <div>{paket.nomorSurat || '–'}</div>
                          <div className="text-[10px] text-slate-400 font-sans">
                            {paket.tanggalSurat ? new Date(paket.tanggalSurat).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '–'}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-right font-bold text-indigo-900">
                          {formatCurrency(totalRAB)}
                        </td>
                        <td className="px-4 py-3.5 text-right font-bold text-emerald-700">
                          {formatCurrency(totalReal)}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <Badge 
                            variant="secondary"
                            className={`text-[10px] font-semibold ${
                              paket.status === 'DITERIMA' 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : paket.status === 'DIKIRIM' 
                                  ? 'bg-blue-100 text-blue-800' 
                                  : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {paket.status || 'DRAFT'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <Link
                              href={`/alat-bahan-iot/${paket.id}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-[11px] font-medium transition-colors"
                              title="Buka detail & kelola item"
                            >
                              <span>Kelola</span>
                              <ArrowRight className="w-3 h-3" />
                            </Link>

                            <button
                              type="button"
                              onClick={() => handlePrintTandaTerima(paket)}
                              className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded border border-emerald-200 transition-colors"
                              title="Cetak Surat Tanda Terima (Format Resmi Kupang)"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handlePrintRAB(paket)}
                              className="p-1.5 text-indigo-700 hover:bg-indigo-50 rounded border border-indigo-200 transition-colors"
                              title="Cetak Dokumen RAB Rencana (Format Tidore)"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              disabled={deletingId === paket.id}
                              onClick={() => handleDelete(paket)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded border border-rose-200 transition-colors disabled:opacity-50"
                              title="Hapus Paket"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* MODAL BUAT PAKET BARU */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[92vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between pb-3 border-b">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Buat Paket Alat & Bahan IoT Baru</h3>
                <p className="text-xs text-slate-500">
                  Paket akan otomatis membuat Pos Item di Kategori D RAB aplikasi.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Pilih Fasilitator Terkait (Opsional)
                </label>
                <select
                  value={formData.fasilitatorId}
                  onChange={e => handleSelectFasilitator(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 text-xs bg-white"
                >
                  <option value="">-- Pilih Fasilitator --</option>
                  {fasilitators.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.namaLengkap} ({f.lokasiSNT || 'Tanpa Lokasi'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Lokasi SNT / Sekolah <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: SNT 5 Tidore Kepulauan, SNT 5 Kupang, SNT Jayapura"
                  value={formData.lokasiSNT}
                  onChange={e => {
                    const val = e.target.value
                    setFormData(prev => ({
                      ...prev,
                      lokasiSNT: val,
                      namaPaket: prev.namaPaket || `Pengadaan Alat dan Bahan Robotika - ${val}`
                    }))
                  }}
                  className="w-full border rounded-md px-3 py-2 text-xs bg-white font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Paket Pengadaan
                </label>
                <input
                  type="text"
                  value={formData.namaPaket}
                  onChange={e => setFormData({ ...formData, namaPaket: e.target.value })}
                  placeholder="Pengadaan Alat dan Bahan Robotika - [Lokasi]"
                  className="w-full border rounded-md px-3 py-2 text-xs bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nomor Surat Tanda Terima
                  </label>
                  <input
                    type="text"
                    value={formData.nomorSurat}
                    onChange={e => setFormData({ ...formData, nomorSurat: e.target.value })}
                    placeholder="01/RE/SNT-K2/X/2026"
                    className="w-full border rounded-md px-3 py-2 text-xs bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tanggal Surat
                  </label>
                  <input
                    type="date"
                    value={formData.tanggalSurat}
                    onChange={e => setFormData({ ...formData, tanggalSurat: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 text-xs bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Kepala Sekolah / Pengetahu (Mengetahui)
                </label>
                <input
                  type="text"
                  value={formData.mengetahuiNama}
                  onChange={e => setFormData({ ...formData, mengetahuiNama: e.target.value })}
                  placeholder="Nama Kepala Sekolah SNT"
                  className="w-full border rounded-md px-3 py-2 text-xs bg-white"
                />
              </div>

              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg space-y-2">
                <label className="flex items-center space-x-2 cursor-pointer text-blue-900 font-semibold">
                  <input
                    type="checkbox"
                    checked={formData.loadDefaultTemplate}
                    onChange={e => setFormData({ ...formData, loadDefaultTemplate: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span>Muat Template Standar (51 Item Bawaan Robotika IoT)</span>
                </label>
                <p className="text-[11px] text-blue-700 leading-relaxed pl-6">
                  Otomatis mengisi 51 item lengkap (Solder, ESP32, Sensor, Rangka Rover, Smart Lamp, Smart Garden). Anda tetap bebas menambah, mengubah volume/harga, atau menghapus item setelah paket dibuat.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border rounded-md text-xs text-slate-700 hover:bg-slate-50"
                  disabled={isSubmitting}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-bold flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Memproses...</span>
                    </>
                  ) : (
                    <span>Buat &amp; Buka Editor Item</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
