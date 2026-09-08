"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { submitLaporanEkstra } from "@/app/actions/ekstra"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/toast"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { Upload, X, Loader2 } from "lucide-react"
import { hitungTransportDarat } from '@/lib/transport-calc'

const formatRp = (v: number) => new Intl.NumberFormat('id-ID').format(v)

type Jadwal = {
  id: string
  mingguKe: number
  modul: { judul: string }
  tanggalMulai: Date
  tanggalSelesai: Date
  tingkatSekolah: string
  laporanKegiatan: any[]
}

type Siswa = {
  id: string
  namaLengkap: string
  kelas: string
}

export function EkstraClientForm({ fasilitatorId, jadwalList, siswaList, jarakTempuhKm, config, claimedTransportDates = [] }: { fasilitatorId: string, jadwalList: any[], siswaList: any[], jarakTempuhKm?: number, config?: any, claimedTransportDates?: string[] }) {
  const router = useRouter()
  const { toast } = useToast()
  
  const [selectedJadwal, setSelectedJadwal] = useState<Jadwal | null>(null)
  
  const [tanggalKegiatan, setTanggalKegiatan] = useState(format(new Date(), "yyyy-MM-dd"))
  const [catatanUmum, setCatatanUmum] = useState("")
  const [fotos, setFotos] = useState<string[]>([])
  
  const [attendance, setAttendance] = useState<Record<string, { status: string, nilai: string, catatan: string }>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  // Transport State
  const [modeTransport, setModeTransport] = useState("PRIBADI")
  const [jenisKendaraan, setJenisKendaraan] = useState("")
  const [jenisBBM, setJenisBBM] = useState("")
  const [nominalStruk, setNominalStruk] = useState("")
  const [nominalInvoice, setNominalInvoice] = useState("")
  const [biayaTransportLaut, setBiayaTransportLaut] = useState("")
  
  const [buktiStrukBBM, setBuktiStrukBBM] = useState("")
  const [buktiInvoiceOnline, setBuktiInvoiceOnline] = useState("")
  const [buktiTiketTransport, setBuktiTiketTransport] = useState("")

  const filteredSiswa = React.useMemo(() => {
    if (!selectedJadwal) return []
    const isSMATarget = selectedJadwal.tingkatSekolah?.toUpperCase().includes('SMA')
    
    return siswaList.filter(s => {
      const isSiswaSMA = s.kelas.includes('10') || s.kelas.includes('11') || s.kelas.includes('12') || s.kelas.toUpperCase().includes('SMA')
      return isSMATarget ? isSiswaSMA : !isSiswaSMA
    })
  }, [selectedJadwal, siswaList])

  React.useEffect(() => {
    if (filteredSiswa.length > 0) {
      const initial: any = {}
      filteredSiswa.forEach(s => {
        initial[s.id] = { status: "Hadir", nilai: "-", catatan: "" }
      })
      setAttendance(initial)
    }
  }, [filteredSiswa])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return
    if (fotos.length >= 2) return toast({ title: "Maksimal 2 foto", type: "error" })
    
    setIsUploading(true)
    const file = e.target.files[0]
    const formData = new FormData()
    formData.append("file", file)
    
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData })
      if (!res.ok) throw new Error("Gagal upload")
      const data = await res.json()
      setFotos(prev => [...prev, data.url])
    } catch (err: any) {
      toast({ title: "Gagal upload foto", description: err.message, type: "error" })
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    const formData = new FormData()
    formData.append("file", file)
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData })
      if (!res.ok) throw new Error("Gagal upload")
      const data = await res.json()
      if (field === 'buktiStrukBBM') setBuktiStrukBBM(data.url)
      if (field === 'buktiInvoiceOnline') setBuktiInvoiceOnline(data.url)
      if (field === 'buktiTiketTransport') setBuktiTiketTransport(data.url)
    } catch (err: any) {
      toast({ title: "Gagal upload", description: err.message, type: "error" })
    } finally {
      setIsUploading(false)
    }
  }

  const removeFoto = (idx: number) => {
    setFotos(prev => prev.filter((_, i) => i !== idx))
  }

  const onSubmit = async () => {
    if (!selectedJadwal) return
    
    const isTransportAlreadyClaimedToday = claimedTransportDates.includes(tanggalKegiatan)
    if (!isTransportAlreadyClaimedToday && modeTransport === 'PRIBADI' && !buktiStrukBBM) {
      if (jenisBBM === 'Pertamax' || jenisBBM === 'Dexlite') {
        return toast({ title: "Validasi Gagal", description: "Struk SPBU wajib untuk Pertamax/Dexlite", type: "error" })
      }
    }
    if (!isTransportAlreadyClaimedToday && parseFloat(biayaTransportLaut || '0') > 0 && !buktiTiketTransport) {
      return toast({ title: "Validasi Gagal", description: "Lampirkan bukti tiket kapal", type: "error" })
    }
    if (!isTransportAlreadyClaimedToday && modeTransport === 'ONLINE' && !buktiInvoiceOnline) {
      return toast({ title: "Validasi Gagal", description: "Lampirkan invoice online", type: "error" })
    }

    setIsSubmitting(true)
    
    try {
      const detailKehadiran = Object.entries(attendance).map(([siswaId, data]) => ({
        siswaId,
        status: data.status,
        nilaiKualitatif: data.nilai,
        catatan: data.catatan
      }))
      
      const payload = {
        jadwalEkstraId: selectedJadwal.id,
        modulEkstraId: (selectedJadwal as any).modulId,
        tanggalKegiatan: new Date(tanggalKegiatan),
        catatanUmum,
        foto1: fotos[0] || null,
        foto2: fotos[1] || null,
        kehadiranEkstra: detailKehadiran,
        
        modeTransport: isTransportAlreadyClaimedToday ? 'PRIBADI' : modeTransport,
        jenisKendaraan: isTransportAlreadyClaimedToday ? null : jenisKendaraan,
        jenisBBM: isTransportAlreadyClaimedToday ? null : jenisBBM,
        nominalStruk: isTransportAlreadyClaimedToday ? null : nominalStruk,
        nominalInvoice: isTransportAlreadyClaimedToday ? null : nominalInvoice,
        biayaTransportLaut: isTransportAlreadyClaimedToday ? null : biayaTransportLaut,
        buktiStrukBBM: isTransportAlreadyClaimedToday ? '' : buktiStrukBBM,
        buktiInvoiceOnline: isTransportAlreadyClaimedToday ? '' : buktiInvoiceOnline,
        buktiTiketTransport: isTransportAlreadyClaimedToday ? '' : buktiTiketTransport
      }
      
      const result = await submitLaporanEkstra(fasilitatorId, payload)
      if (result?.error) throw new Error(result.error)
        
      toast({ title: "Berhasil", description: "Laporan berhasil disimpan" })
      setSelectedJadwal(null)
      setTanggalKegiatan(format(new Date(), "yyyy-MM-dd"))
      setCatatanUmum("")
      setFotos([])
      router.refresh()
    } catch (err: any) {
      toast({ title: "Gagal", description: err.message || "Terjadi kesalahan", type: "error" })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Laporan Ekstrakurikuler</h1>
      
      {!selectedJadwal && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {jadwalList.map(jadwal => {
            const isDilaporkan = jadwal.laporanEkstra?.length > 0
            
            return (
              <Card 
                key={jadwal.id} 
                className={`cursor-pointer transition-colors ${isDilaporkan ? 'opacity-60 bg-gray-50' : 'hover:border-emerald-500 hover:shadow-md'}`}
                onClick={() => !isDilaporkan && setSelectedJadwal(jadwal)}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">Minggu ke-{jadwal.mingguKe}</CardTitle>
                    <Badge variant={isDilaporkan ? "secondary" : "default"} className={!isDilaporkan ? "bg-amber-500 hover:bg-amber-600" : ""}>
                      {isDilaporkan ? "Sudah Dilaporkan" : "Belum Dilaporkan"}
                    </Badge>
                  </div>
                  <CardDescription className="font-medium text-black">
                    {jadwal.modul?.judul}
                  </CardDescription>
                  <p className="text-sm text-gray-500 mt-2">
                    {format(new Date(jadwal.tanggalMulai), "dd MMM", { locale: id })} - {format(new Date(jadwal.tanggalSelesai), "dd MMM yyyy", { locale: id })}
                  </p>
                </CardHeader>
              </Card>
            )
          })}
          {jadwalList.length === 0 && (
            <p className="text-gray-500 col-span-full">Tidak ada jadwal aktif.</p>
          )}
        </div>
      )}

      {selectedJadwal && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={() => setSelectedJadwal(null)}>
              Kembali ke Daftar Jadwal
            </Button>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Form Laporan: Minggu ke-{selectedJadwal.mingguKe}</CardTitle>
              <CardDescription>
                Modul: {selectedJadwal.modul?.judul} | {format(new Date(selectedJadwal.tanggalMulai), "dd MMM")} - {format(new Date(selectedJadwal.tanggalSelesai), "dd MMM yyyy")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tanggal Kegiatan</Label>
                  <Input 
                    type="date" 
                    value={tanggalKegiatan} 
                    onChange={e => setTanggalKegiatan(e.target.value)} 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Kehadiran Siswa ({filteredSiswa.length} Siswa)</Label>
                <div className="border rounded-md overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">No</TableHead>
                        <TableHead>Nama Siswa</TableHead>
                        <TableHead className="w-24">Kelas</TableHead>
                        <TableHead className="w-36">Kehadiran</TableHead>
                        <TableHead className="w-48">Nilai</TableHead>
                        <TableHead>Catatan</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSiswa.map((siswa, idx) => (
                        <TableRow key={siswa.id}>
                          <TableCell>{idx + 1}</TableCell>
                          <TableCell className="font-medium">{siswa.namaLengkap}</TableCell>
                          <TableCell>{siswa.kelas}</TableCell>
                          <TableCell>
                            <Select 
                              value={attendance[siswa.id]?.status || "Hadir"} 
                              onValueChange={(v) => setAttendance(prev => ({...prev, [siswa.id]: {...prev[siswa.id], status: v}}))}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Hadir">Hadir</SelectItem>
                                <SelectItem value="Izin">Izin</SelectItem>
                                <SelectItem value="Sakit">Sakit</SelectItem>
                                <SelectItem value="Alpha">Alpha</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Select 
                              value={attendance[siswa.id]?.nilai || "-"} 
                              onValueChange={(v) => setAttendance(prev => ({...prev, [siswa.id]: {...prev[siswa.id], nilai: v}}))}
                              disabled={attendance[siswa.id]?.status !== "Hadir"}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="-">-</SelectItem>
                                <SelectItem value="Sangat Baik">Sangat Baik</SelectItem>
                                <SelectItem value="Baik">Baik</SelectItem>
                                <SelectItem value="Cukup">Cukup</SelectItem>
                                <SelectItem value="Perlu Bimbingan">Perlu Bimbingan</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Input 
                              placeholder="Catatan..." 
                              value={attendance[siswa.id]?.catatan || ""}
                              onChange={e => setAttendance(prev => ({...prev, [siswa.id]: {...prev[siswa.id], catatan: e.target.value}}))}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredSiswa.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                            Tidak ada data siswa untuk tingkat sekolah ini.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Transport Darat Section */}
            {isTransportAlreadyClaimedToday ? (
              <div className="space-y-4 border-t border-emerald-100 pt-4 mt-6">
                <div className="p-4 bg-amber-50 text-amber-800 border border-amber-200 rounded-md text-sm">
                  <strong>Info:</strong> Anda sudah mengajukan klaim biaya transport pada laporan sebelumnya di tanggal ini ({tanggalKegiatan}). Sesuai aturan, klaim transport (darat/laut) hanya dapat diajukan satu kali per hari. Form transport disembunyikan.
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
                    <input type="radio" name="modeTransport" value="PRIBADI" checked={modeTransport === 'PRIBADI'} onChange={() => { setModeTransport(e.target.value); setNominalInvoice(''); }} className="w-4 h-4 text-emerald-600" />
                    <div>
                      <div className="font-medium">Kendaraan Pribadi</div>
                      <div className="text-xs text-slate-500">BBM berdasarkan jarak tempuh</div>
                    </div>
                  </label>
                  <label className="flex items-center gap-2 p-3 border rounded-md cursor-pointer hover:bg-slate-50 flex-1">
                    <input type="radio" name="modeTransport" value="ONLINE" checked={modeTransport === 'ONLINE'} onChange={() => { setModeTransport(e.target.value); setJenisKendaraan(''); setJenisBBM(''); setNominalStruk(''); }} className="w-4 h-4 text-emerald-600" />
                    <div>
                      <div className="font-medium">Transportasi Online</div>
                      <div className="text-xs text-slate-500">Sesuai nominal invoice Grab/Gojek</div>
                    </div>
                  </label>
                </div>
              </div>

              {modeTransport === 'PRIBADI' && (
                <div className="space-y-4 p-4 bg-slate-50 rounded-lg border">
                  {jarakTempuhKm === 0 && (
                    <div className="p-3 bg-amber-50 text-amber-700 border border-amber-200 rounded text-sm">
                      Peringatan: Jarak tempuh lokasi Anda belum diatur oleh Admin. Anda tetap bisa mengirim laporan, namun biaya BBM akan dihitung 0. Hubungi Admin.
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Jenis Kendaraan *</Label>
                      <select required value={jenisKendaraan} onChange={e => setJenisKendaraan(e.target.value)} className="w-full h-10 px-3 py-2 rounded-md border border-input bg-background text-sm">
                        <option value="">-- Pilih Kendaraan --</option>
                        <option value="R2">Roda 2 (Motor)</option>
                        <option value="R4">Roda 4 (Mobil)</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Jenis BBM *</Label>
                      <select required value={jenisBBM} onChange={e => setJenisBBM(e.target.value)} className="w-full h-10 px-3 py-2 rounded-md border border-input bg-background text-sm">
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
                      <Input type="number" min="0" value={nominalStruk} onChange={e => setNominalStruk(e.target.value)} required placeholder="Contoh: 50000" />
                    </div>
                    <div className="space-y-2">
                      <Label>Unggah Struk SPBU <span className="text-slate-400 font-normal text-xs">(Wajib u/ Pertamax & Dexlite)</span></Label>
                      <Input type="file" onChange={(e) => handleFileChange(e, 'buktiStrukBBM')} accept=".jpg,.jpeg,.png" />
                      {buktiStrukBBM && <p className="text-xs text-emerald-600">Struk terlampir.</p>}
                    </div>
                  </div>

                  {/* Simulasi/Ringkasan Read-Only */}
                  {jenisKendaraan && jenisBBM && jarakTempuhKm > 0 && (
                    <div className="mt-4 p-4 bg-emerald-50 border border-emerald-100 rounded-md">
                      <h4 className="text-sm font-semibold text-emerald-900 mb-2">Ringkasan Kalkulasi Sistem</h4>
                      {(() => {
                        const sim = hitungTransportDarat(jarakTempuhKm, jenisKendaraan, jenisBBM, parseFloat(nominalStruk || '0'), config)
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

              {modeTransport === 'ONLINE' && (
                <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nominal Tagihan Invoice (Rp) *</Label>
                      <Input type="number" min="0" value={nominalInvoice} onChange={e => setNominalInvoice(e.target.value)} required placeholder="Contoh: 75000" />
                    </div>
                    <div className="space-y-2">
                      <Label>Unggah Screenshot Invoice *</Label>
                      <Input type="file" onChange={(e) => handleFileChange(e, 'buktiInvoiceOnline')} accept=".jpg,.jpeg,.png,.pdf" />
                      {buktiInvoiceOnline && <p className="text-xs text-emerald-600">Invoice terlampir.</p>}
                    </div>
                  </div>
                  {nominalInvoice && (
                    <div className="mt-2 text-sm">
                      <span className="text-slate-600">Biaya Disetujui: </span>
                      <span className="font-bold text-blue-700 text-lg">Rp {formatRp(parseFloat(nominalInvoice))}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            )}
            
            
              <div className="space-y-2">
                <Label>Catatan Umum Kegiatan</Label>
                <Textarea 
                  placeholder="Tuliskan catatan jalannya kegiatan..." 
                  value={catatanUmum}
                  onChange={e => setCatatanUmum(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label>Foto Kegiatan (Maks 2)</Label>
                <div className="flex flex-wrap gap-4">
                  {fotos.map((url, i) => (
                    <div key={i} className="relative w-32 h-32 border rounded-md overflow-hidden">
                      <img src={url} alt={`Foto ${i+1}`} className="object-cover w-full h-full" />
                      <button 
                        onClick={() => removeFoto(i)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                        type="button"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  
                  {fotos.length < 2 && (
                    <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed rounded-md cursor-pointer hover:bg-gray-50 transition">
                      {isUploading ? (
                        <Loader2 className="animate-spin text-gray-400" />
                      ) : (
                        <>
                          <Upload className="text-gray-400 mb-2" />
                          <span className="text-xs text-gray-500">Upload Foto</span>
                        </>
                      )}
                      <input type="file" className="hidden" accept="image/*" onChange={handleUpload} disabled={isUploading} />
                    </label>
                  )}
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <Button onClick={onSubmit} disabled={isSubmitting || isUploading} className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700">
                  {isSubmitting ? "Menyimpan..." : "Simpan Laporan"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
