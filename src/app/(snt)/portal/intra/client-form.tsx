"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import Link from 'next/link'
import { submitLaporanKegiatan } from '@/app/actions/rab'
import { hitungTransportDarat } from '@/lib/transport-calc'
import { useRouter } from 'next/navigation'

export function LaporanClientForm({ fasilitatorId, jarakTempuhKm, config, claimedTransportDates = [] }: { fasilitatorId: string, jarakTempuhKm: number, config: any, claimedTransportDates?: string[] }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [fileError, setFileError] = useState('')
  const [foto1, setFoto1] = useState('')
  const [foto2, setFoto2] = useState('')
  const [buktiStrukBBM, setBuktiStrukBBM] = useState('')
  const [buktiInvoiceOnline, setBuktiInvoiceOnline] = useState('')
  const [buktiTiketTransport, setBuktiTiketTransport] = useState('')
  const [uploading, setUploading] = useState(false)
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().substring(0, 10),
    topic: '',
    attendance: '',
    evaluation: '',
    tingkatSekolah: 'SMP',
    jumlahJPIntra: '',
    jumlahJPEkstra: '',
    modeTransport: 'PRIBADI',
    jenisKendaraan: '',
    jenisBBM: '',
    nominalStruk: '',
    nominalInvoice: '',
    biayaTransportLaut: '',
  })

  const uploadFile = async (file: File) => {
    const uploadData = new FormData()
    uploadData.append('file', file)
    const res = await fetch('/api/upload', {
      method: 'POST',
      body: uploadData
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Gagal unggah')
    return data.url
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0]
    setFileError('')
    
    if (!file) return
    
    if (file.size > 5 * 1024 * 1024) {
      setFileError('Ukuran file maksimal 5MB')
      e.target.value = ''
      return
    }

    setUploading(true)
    try {
      const url = await uploadFile(file)
      if (field === 'foto1') setFoto1(url)
      if (field === 'foto2') setFoto2(url)
      if (field === 'buktiStrukBBM') setBuktiStrukBBM(url)
      if (field === 'buktiInvoiceOnline') setBuktiInvoiceOnline(url)
      if (field === 'buktiTiketTransport') setBuktiTiketTransport(url)
    } catch (error: any) {
      setFileError(error.message || 'Gagal terhubung ke server unggahan')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!foto1 && !foto2) {
      setFileError('Harap lampirkan minimal 1 foto kegiatan')
      return
    }
    if (!isTransportAlreadyClaimedToday && formData.modeTransport === 'PRIBADI' && !buktiStrukBBM) {
      if (formData.jenisBBM === 'Pertamax' || formData.jenisBBM === 'Dexlite') {
        setFileError('Harap lampirkan foto struk SPBU (wajib untuk Pertamax/Dexlite)')
        return
      }
    }
    if (!isTransportAlreadyClaimedToday && parseFloat(formData.biayaTransportLaut || '0') > 0 && !buktiTiketTransport) {
      setFileError('Harap lampirkan foto/scan tiket transport laut')
      return
    }
    if (!isTransportAlreadyClaimedToday && formData.modeTransport === 'ONLINE' && !buktiInvoiceOnline) {
      setFileError('Harap lampirkan foto/screenshot invoice transport online')
      return
    }
    
    setSaving(true)
    try {
      await submitLaporanKegiatan(fasilitatorId, {
        ...formData,
        modeTransport: isTransportAlreadyClaimedToday ? 'PRIBADI' : formData.modeTransport, // default fallback
        jenisKendaraan: isTransportAlreadyClaimedToday ? null : formData.jenisKendaraan,
        jenisBBM: isTransportAlreadyClaimedToday ? null : formData.jenisBBM,
        nominalStruk: isTransportAlreadyClaimedToday ? null : formData.nominalStruk,
        nominalInvoice: isTransportAlreadyClaimedToday ? null : formData.nominalInvoice,
        biayaTransportLaut: isTransportAlreadyClaimedToday ? null : formData.biayaTransportLaut,
        foto1,
        foto2,
        buktiStrukBBM: isTransportAlreadyClaimedToday ? '' : buktiStrukBBM,
        buktiInvoiceOnline: isTransportAlreadyClaimedToday ? '' : buktiInvoiceOnline,
        buktiTiketTransport: isTransportAlreadyClaimedToday ? '' : buktiTiketTransport
      })
      router.push('/portal')
      router.refresh()
    } catch (error: any) {
      alert(error.message || "Gagal mengirim laporan")
      setSaving(false)
    }
  }

  const formatRp = (v: number) => new Intl.NumberFormat('id-ID').format(v)
  const isTransportAlreadyClaimedToday = claimedTransportDates.includes(formData.date)

  return (
    <div className="p-8 space-y-6 max-w-3xl mx-auto pb-20">
      <Link href="/portal" className="text-emerald-600 hover:underline mb-4 inline-block">&larr; Kembali ke Portal</Link>
      <h1 className="text-3xl font-bold tracking-tight">Kirim Laporan Kegiatan Mingguan</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Formulir Laporan Mengajar SNT 2026</CardTitle>
          <CardDescription>Laporkan kegiatan mingguan Anda. Biaya transport akan dicatat, sementara JP akan diakumulasi ke dalam Honorarium Bulanan.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* ... Basic Info Fields ... */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tingkat Sekolah</Label>
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center gap-2">
                    <input type="radio" name="tingkatSekolah" value="SMP" checked={formData.tingkatSekolah === 'SMP'} onChange={e => setFormData({...formData, tingkatSekolah: e.target.value})} className="w-4 h-4 text-emerald-600" />
                    SMP
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="tingkatSekolah" value="SMA" checked={formData.tingkatSekolah === 'SMA'} onChange={e => setFormData({...formData, tingkatSekolah: e.target.value})} className="w-4 h-4 text-emerald-600" />
                    SMA
                  </label>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tanggal Kegiatan</Label>
                <Input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label>Jumlah Peserta Hadir</Label>
                <Input type="number" min="0" value={formData.attendance} onChange={e => setFormData({...formData, attendance: e.target.value})} required />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Topik Pembelajaran</Label>
              <Input value={formData.topic} onChange={e => setFormData({...formData, topic: e.target.value})} placeholder="Misal: Pengenalan Komponen Robotika" required />
            </div>
            
            <div className="space-y-2">
              <Label>Catatan / Evaluasi</Label>
              <Textarea value={formData.evaluation} onChange={e => setFormData({...formData, evaluation: e.target.value})} placeholder="Catatan singkat tentang pelaksanaan..." />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4 mt-2">
              <div className="space-y-2">
                <Label>JP Intrakurikuler</Label>
                <Input type="number" min="0" value={formData.jumlahJPIntra} onChange={e => setFormData({...formData, jumlahJPIntra: e.target.value})} placeholder="0" />
                <p className="text-xs text-slate-500">Maksimal 8 JP / minggu / Lokasi</p>
              </div>
              <div className="space-y-2">
                <Label>JP Ekstrakurikuler</Label>
                <Input type="number" min="0" value={formData.jumlahJPEkstra} onChange={e => setFormData({...formData, jumlahJPEkstra: e.target.value})} placeholder="0" />
                <p className="text-xs text-slate-500">Maksimal 4 JP / minggu / Lokasi</p>
              </div>
            </div>

            {/* Transport Darat Section */}
            {isTransportAlreadyClaimedToday ? (
              <div className="space-y-4 border-t border-emerald-100 pt-4 mt-6">
                <div className="p-4 bg-amber-50 text-amber-800 border border-amber-200 rounded-md text-sm">
                  <strong>Info:</strong> Anda sudah mengajukan klaim biaya transport pada laporan sebelumnya di tanggal ini ({formData.date}). Sesuai aturan, klaim transport (darat/laut) hanya dapat diajukan satu kali per hari. Form transport disembunyikan.
                </div>
              </div>
            ) : (
            <div className="space-y-4 border-t border-emerald-100 pt-4 mt-6">
              <div className="mb-2">
                <Label className="text-lg font-semibold text-emerald-900">Klaim Biaya Transport Darat</Label>
                <p className="text-xs text-slate-500">Isi data di bawah ini untuk klaim penggantian biaya transport.</p>
              </div>

              <div className="space-y-2">
                <Label>Mode Transportasi</Label>
                <div className="flex flex-col sm:flex-row gap-4 mt-2">
                  <label className="flex items-center gap-2 p-3 border rounded-md cursor-pointer hover:bg-slate-50 flex-1">
                    <input type="radio" name="modeTransport" value="PRIBADI" checked={formData.modeTransport === 'PRIBADI'} onChange={e => setFormData({...formData, modeTransport: e.target.value, nominalInvoice: ''})} className="w-4 h-4 text-emerald-600" />
                    <div>
                      <div className="font-medium">Kendaraan Pribadi</div>
                      <div className="text-xs text-slate-500">BBM berdasarkan jarak tempuh</div>
                    </div>
                  </label>
                  <label className="flex items-center gap-2 p-3 border rounded-md cursor-pointer hover:bg-slate-50 flex-1">
                    <input type="radio" name="modeTransport" value="ONLINE" checked={formData.modeTransport === 'ONLINE'} onChange={e => setFormData({...formData, modeTransport: e.target.value, jenisKendaraan: '', jenisBBM: '', nominalStruk: ''})} className="w-4 h-4 text-emerald-600" />
                    <div>
                      <div className="font-medium">Transportasi Online</div>
                      <div className="text-xs text-slate-500">Sesuai nominal invoice Grab/Gojek</div>
                    </div>
                  </label>
                </div>
              </div>

              {formData.modeTransport === 'PRIBADI' && (
                <div className="space-y-4 p-4 bg-slate-50 rounded-lg border">
                  {jarakTempuhKm === 0 && (
                    <div className="p-3 bg-amber-50 text-amber-700 border border-amber-200 rounded text-sm">
                      Peringatan: Jarak tempuh lokasi Anda belum diatur oleh Admin. Anda tetap bisa mengirim laporan, namun biaya BBM akan dihitung 0. Hubungi Admin.
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Jenis Kendaraan *</Label>
                      <select required value={formData.jenisKendaraan} onChange={e => setFormData({...formData, jenisKendaraan: e.target.value})} className="w-full h-10 px-3 py-2 rounded-md border border-input bg-background text-sm">
                        <option value="">-- Pilih Kendaraan --</option>
                        <option value="R2">Roda 2 (Motor)</option>
                        <option value="R4">Roda 4 (Mobil)</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Jenis BBM *</Label>
                      <select required value={formData.jenisBBM} onChange={e => setFormData({...formData, jenisBBM: e.target.value})} className="w-full h-10 px-3 py-2 rounded-md border border-input bg-background text-sm">
                        <option value="">-- Pilih BBM --</option>
                        <option value="Pertalite">Pertalite</option>
                        <option value="Pertamax">Pertamax</option>
                        <option value="Solar">Solar</option>
                        <option value="Dexlite">Dexlite</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nominal Struk SPBU (Rp) *</Label>
                      <Input type="number" min="0" value={formData.nominalStruk} onChange={e => setFormData({...formData, nominalStruk: e.target.value})} required placeholder="Contoh: 50000" />
                    </div>
                    <div className="space-y-2">
                      <Label>Unggah Struk SPBU <span className="text-slate-400 font-normal text-xs">(Wajib u/ Pertamax & Dexlite)</span></Label>
                      <Input type="file" onChange={(e) => handleFileChange(e, 'buktiStrukBBM')} accept=".jpg,.jpeg,.png" />
                      {buktiStrukBBM && <p className="text-xs text-emerald-600">Struk terlampir.</p>}
                    </div>
                  </div>

                  {/* Simulasi/Ringkasan Read-Only */}
                  {formData.jenisKendaraan && formData.jenisBBM && jarakTempuhKm > 0 && (
                    <div className="mt-4 p-4 bg-emerald-50 border border-emerald-100 rounded-md">
                      <h4 className="text-sm font-semibold text-emerald-900 mb-2">Ringkasan Kalkulasi Sistem</h4>
                      {(() => {
                        const sim = hitungTransportDarat(jarakTempuhKm, formData.jenisKendaraan, formData.jenisBBM, parseFloat(formData.nominalStruk || '0'), config)
                        return (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                            <div>
                              <div className="text-xs text-slate-500">Jarak Efektif (PP)</div>
                              <div className="font-medium">{sim.jarakEfektif.toFixed(1)} KM</div>
                            </div>
                            <div>
                              <div className="text-xs text-slate-500">Kebutuhan BBM</div>
                              <div className="font-medium">{sim.volumeLiter} L</div>
                            </div>
                            <div>
                              <div className="text-xs text-slate-500">Plafon Maksimal</div>
                              <div className="font-medium text-amber-600">Rp {formatRp(sim.plafonMaksimal)}</div>
                            </div>
                            <div>
                              <div className="text-xs text-emerald-700 font-bold">Biaya Disetujui</div>
                              <div className="font-bold text-emerald-700 text-lg">Rp {formatRp(sim.biayaDisetujui)}</div>
                            </div>
                          </div>
                        )
                      })()}
                      <p className="text-xs text-slate-500 mt-2 italic">* Biaya disetujui adalah nilai terkecil antara nominal struk SPBU dan plafon maksimal.</p>
                    </div>
                  )}
                </div>
              )}

              {formData.modeTransport === 'ONLINE' && (
                <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nominal Tagihan Invoice (Rp) *</Label>
                      <Input type="number" min="0" value={formData.nominalInvoice} onChange={e => setFormData({...formData, nominalInvoice: e.target.value})} required placeholder="Contoh: 75000" />
                    </div>
                    <div className="space-y-2">
                      <Label>Unggah Screenshot Invoice *</Label>
                      <Input type="file" onChange={(e) => handleFileChange(e, 'buktiInvoiceOnline')} accept=".jpg,.jpeg,.png,.pdf" />
                      {buktiInvoiceOnline && <p className="text-xs text-emerald-600">Invoice terlampir.</p>}
                    </div>
                  </div>
                  {formData.nominalInvoice && (
                    <div className="mt-2 text-sm">
                      <span className="text-slate-600">Biaya Disetujui: </span>
                      <span className="font-bold text-blue-700 text-lg">Rp {formatRp(parseFloat(formData.nominalInvoice))}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            )}
            
            {/* Transport Antar Pulau */}
            {!isTransportAlreadyClaimedToday && (
            <div className="space-y-4 border-t pt-4 mt-2">
              <div className="space-y-2">
                <Label>Biaya Transport Antar Pulau (Rp) - Opsional</Label>
                <Input type="number" min="0" value={formData.biayaTransportLaut} onChange={e => setFormData({...formData, biayaTransportLaut: e.target.value})} placeholder="Kosongkan jika tidak ada" />
                <p className="text-xs text-slate-500">Khusus perjalanan menggunakan kapal/speedboat/ferry.</p>
              </div>

              {parseFloat(formData.biayaTransportLaut || '0') > 0 && (
                <div className="space-y-2 border border-blue-100 bg-blue-50 p-4 rounded-md mt-2">
                  <Label>Bukti Tiket Transport Antar Pulau *</Label>
                  <Input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleFileChange(e, 'buktiTiketTransport')} required />
                  {buktiTiketTransport && <p className="text-xs text-blue-600">Tiket terlampir.</p>}
                  <p className="text-xs text-blue-600 mt-1">Unggah foto/scan tiket atau bukti pembayaran transport laut.</p>
                </div>
              )}
            </div>

            )}
            <div className="space-y-4 border-t pt-4 mt-2">
              <Label>Lampiran Bukti (Foto Kegiatan)</Label>
              <p className="text-xs text-slate-500">Maksimal 2 foto (jpg/png/jpeg), ukuran per file max 5 MB.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm text-slate-600">Foto Kegiatan 1 *</Label>
                  <Input type="file" onChange={(e) => handleFileChange(e, 'foto1')} accept=".jpg,.jpeg,.png" />
                  {foto1 && <p className="text-xs text-emerald-600">Foto 1 terlampir.</p>}
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-slate-600">Foto Kegiatan 2 (Opsional)</Label>
                  <Input type="file" onChange={(e) => handleFileChange(e, 'foto2')} accept=".jpg,.jpeg,.png" />
                  {foto2 && <p className="text-xs text-emerald-600">Foto 2 terlampir.</p>}
                </div>
              </div>
              
              {uploading && <p className="text-xs text-blue-600 font-medium animate-pulse">Sedang mengunggah file. Mohon tunggu...</p>}
              {fileError && <p className="text-sm text-red-600 font-medium p-2 bg-red-50 border border-red-200 rounded">{fileError}</p>}
            </div>
            
            <div className="pt-6 border-t mt-4 flex justify-end">
              <Button type="submit" size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white w-full md:w-auto" disabled={saving || uploading}>
                {saving ? 'Menyimpan...' : 'Kirim Laporan'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
