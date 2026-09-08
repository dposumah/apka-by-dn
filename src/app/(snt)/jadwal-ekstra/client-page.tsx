"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { createJadwalEkstra, updateJadwalEkstra, deleteJadwalEkstra } from "@/app/actions/ekstra"
import { Pencil, Trash2, Plus } from "lucide-react"

export function JadwalClientPage({ initialJadwal = [], lokasiList = [], modulList = [] }: any) {
  const router = useRouter()
  const [jadwal, setJadwal] = useState(initialJadwal)
  const [filterLokasi, setFilterLokasi] = useState("all")
  const [filterTingkat, setFilterTingkat] = useState("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  
  const [formData, setFormData] = useState({
    id: null,
    mingguKe: "",
    modulId: "",
    lokasiId: "",
    tingkat: "",
    tanggalMulai: "",
    tanggalSelesai: ""
  })

  const filteredJadwal = jadwal.filter((j: any) => {
    if (filterLokasi !== "all" && j.lokasiId !== filterLokasi) return false
    if (filterTingkat !== "all" && j.tingkat !== filterTingkat) return false
    return true
  })

  const filteredModul = modulList.filter((m: any) => formData.tingkat ? m.tingkat === formData.tingkat : true)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.id) {
      await updateJadwalEkstra(formData.id, formData)
    } else {
      await createJadwalEkstra(formData)
    }
    setIsDialogOpen(false)
    router.refresh()
  }

  const handleDelete = async (id: string) => {
    if (confirm("Apakah anda yakin ingin menghapus jadwal ini?")) {
      await deleteJadwalEkstra(id)
      router.refresh()
    }
  }

  const handleEdit = (j: any) => {
    setFormData({
      id: j.id,
      mingguKe: j.mingguKe.toString(),
      modulId: j.modulId,
      lokasiId: j.lokasiId,
      tingkat: j.tingkat,
      tanggalMulai: j.tanggalMulai.split('T')[0],
      tanggalSelesai: j.tanggalSelesai.split('T')[0]
    })
    setIsDialogOpen(true)
  }

  const handleOpenNew = () => {
    setFormData({
      id: null,
      mingguKe: "",
      modulId: "",
      lokasiId: "",
      tingkat: "",
      tanggalMulai: "",
      tanggalSelesai: ""
    })
    setIsDialogOpen(true)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Jadwal Mingguan Ekstrakurikuler</h1>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenNew}><Plus className="w-4 h-4 mr-2" /> Tambah Jadwal</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{formData.id ? "Edit Jadwal" : "Tambah Jadwal Baru"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Minggu Ke</label>
                <Input type="number" required value={formData.mingguKe} onChange={e => setFormData({...formData, mingguKe: e.target.value})} />
              </div>
              <div>
                <label className="text-sm font-medium">Tingkat Sekolah</label>
                <Select value={formData.tingkat} onValueChange={v => setFormData({...formData, tingkat: v, modulId: ""})}>
                  <SelectTrigger><SelectValue placeholder="Pilih Tingkat" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SMP">SMP</SelectItem>
                    <SelectItem value="SMA">SMA</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Modul</label>
                <Select value={formData.modulId} onValueChange={v => setFormData({...formData, modulId: v})} disabled={!formData.tingkat}>
                  <SelectTrigger><SelectValue placeholder="Pilih Modul" /></SelectTrigger>
                  <SelectContent>
                    {filteredModul.map((m: any) => (
                      <SelectItem key={m.id} value={m.id}>{m.kode} - {m.judul}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Lokasi SNT</label>
                <Select value={formData.lokasiId} onValueChange={v => setFormData({...formData, lokasiId: v})}>
                  <SelectTrigger><SelectValue placeholder="Pilih Lokasi" /></SelectTrigger>
                  <SelectContent>
                    {lokasiList.map((l: any) => (
                      <SelectItem key={l.id} value={l.id}>{l.nama}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Tanggal Mulai</label>
                <Input type="date" required value={formData.tanggalMulai} onChange={e => setFormData({...formData, tanggalMulai: e.target.value})} />
              </div>
              <div>
                <label className="text-sm font-medium">Tanggal Selesai</label>
                <Input type="date" required value={formData.tanggalSelesai} onChange={e => setFormData({...formData, tanggalSelesai: e.target.value})} />
              </div>
              <div className="pt-4 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Batal</Button>
                <Button type="submit">Simpan</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-4">
        <div className="w-48">
          <Select value={filterLokasi} onValueChange={setFilterLokasi}>
            <SelectTrigger><SelectValue placeholder="Semua Lokasi" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Lokasi</SelectItem>
              {lokasiList.map((l: any) => <SelectItem key={l.id} value={l.id}>{l.nama}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="w-48">
          <Select value={filterTingkat} onValueChange={setFilterTingkat}>
            <SelectTrigger><SelectValue placeholder="Semua Tingkat" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Tingkat</SelectItem>
              <SelectItem value="SMP">SMP</SelectItem>
              <SelectItem value="SMA">SMA</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Minggu Ke</TableHead>
              <TableHead>Modul</TableHead>
              <TableHead>Tingkat</TableHead>
              <TableHead>Lokasi SNT</TableHead>
              <TableHead>Tanggal Mulai</TableHead>
              <TableHead>Tanggal Selesai</TableHead>
              <TableHead>Status Laporan</TableHead>
              <TableHead>Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredJadwal.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center">Tidak ada jadwal</TableCell></TableRow>
            ) : filteredJadwal.map((j: any) => (
              <TableRow key={j.id}>
                <TableCell>{j.mingguKe}</TableCell>
                <TableCell>{j.modul?.kode} - {j.modul?.judul}</TableCell>
                <TableCell>{j.tingkat}</TableCell>
                <TableCell>{j.lokasi?.nama}</TableCell>
                <TableCell>{new Date(j.tanggalMulai).toLocaleDateString('id-ID')}</TableCell>
                <TableCell>{new Date(j.tanggalSelesai).toLocaleDateString('id-ID')}</TableCell>
                <TableCell>
                  <Badge variant={j.laporanEkstra?.length > 0 ? "default" : "secondary"} className={j.laporanEkstra?.length > 0 ? "bg-green-500 hover:bg-green-600" : "bg-amber-500 hover:bg-amber-600"}>
                    {j.laporanEkstra?.length > 0 ? "Sudah Dilaporkan" : "Belum"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(j)}><Pencil className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(j.id)} className="text-red-500"><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
