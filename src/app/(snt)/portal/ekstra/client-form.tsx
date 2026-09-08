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

type Jadwal = {
  id: string
  mingguKe: number
  modul: { judul: string }
  tanggalMulai: Date
  tanggalSelesai: Date
  tingkatSekolah: string
  laporanEkstra: any[]
}

type Siswa = {
  id: string
  namaLengkap: string
  kelas: string
}

export function EkstraClientForm({ fasilitatorId, jadwalList, siswaList }: { fasilitatorId: string, jadwalList: any[], siswaList: any[] }) {
  const router = useRouter()
  const { toast } = useToast()
  
  const [selectedJadwal, setSelectedJadwal] = useState<Jadwal | null>(null)
  
  const [tanggalKegiatan, setTanggalKegiatan] = useState(format(new Date(), "yyyy-MM-dd"))
  const [catatanUmum, setCatatanUmum] = useState("")
  const [fotos, setFotos] = useState<string[]>([])
  
  const [attendance, setAttendance] = useState<Record<string, { status: string, nilai: string, catatan: string }>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const filteredSiswa = React.useMemo(() => {
    if (!selectedJadwal) return []
    const isSMATarget = selectedJadwal.tingkatSekolah?.toUpperCase().includes('SMA')
    
    return siswaList.filter(s => {
      const isSiswaSMA = s.kelas === '10' || s.kelas === '11' || s.kelas === '12' || s.kelas.toUpperCase().startsWith('X')
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

  const removeFoto = (idx: number) => {
    setFotos(prev => prev.filter((_, i) => i !== idx))
  }

  const onSubmit = async () => {
    if (!selectedJadwal) return
    setIsSubmitting(true)
    
    try {
      const detailKehadiran = Object.entries(attendance).map(([siswaId, data]) => ({
        siswaId,
        status: data.status,
        nilai: data.nilai,
        catatan: data.catatan
      }))
      
      const payload = {
        jadwalId: selectedJadwal.id,
        fasilitatorId,
        tanggalKegiatan: new Date(tanggalKegiatan),
        catatanUmum,
        foto1: fotos[0] || null,
        foto2: fotos[1] || null,
        detail: detailKehadiran
      }
      
      const result = await submitLaporanEkstra(payload)
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
