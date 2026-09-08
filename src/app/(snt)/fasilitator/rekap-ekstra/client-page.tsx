"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp } from "lucide-react"

export function RekapEkstraClientPage({ initialRekap = [], lokasiList = [], modulList = [] }: any) {
  const [filterLokasi, setFilterLokasi] = useState("all")
  const [filterModul, setFilterModul] = useState("all")
  const [expandedRows, setExpandedRows] = useState<string[]>([])

  const filteredRekap = initialRekap.filter((r: any) => {
    if (filterLokasi !== "all" && r.lokasiId !== filterLokasi) return false
    if (filterModul !== "all" && r.modulId !== filterModul) return false
    return true
  })

  const totalLaporan = filteredRekap.length
  const avgKehadiran = totalLaporan > 0 
    ? filteredRekap.reduce((acc: number, curr: any) => acc + curr.persentaseHadir, 0) / totalLaporan 
    : 0

  const toggleRow = (id: string) => {
    setExpandedRows(prev => 
      prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
    )
  }

  const getHadirColor = (percent: number) => {
    if (percent >= 80) return "text-green-600 font-bold"
    if (percent >= 60) return "text-amber-600 font-bold"
    return "text-red-600 font-bold"
  }

  const getNilaiBadge = (nilai: string) => {
    switch(nilai) {
      case "Sangat Baik": return <Badge className="bg-green-500">Sangat Baik</Badge>
      case "Baik": return <Badge className="bg-blue-500">Baik</Badge>
      case "Cukup": return <Badge className="bg-amber-500">Cukup</Badge>
      case "Perlu Bimbingan": return <Badge className="bg-red-500">Perlu Bimbingan</Badge>
      default: return <Badge variant="outline">{nilai}</Badge>
    }
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Rekap Kehadiran & Capaian Ekstrakurikuler</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Laporan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLaporan}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Rata-rata Kehadiran</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getHadirColor(avgKehadiran)}`}>{avgKehadiran.toFixed(1)}%</div>
          </CardContent>
        </Card>
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
          <Select value={filterModul} onValueChange={setFilterModul}>
            <SelectTrigger><SelectValue placeholder="Semua Modul" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Modul</SelectItem>
              {modulList.map((m: any) => <SelectItem key={m.id} value={m.id}>{m.judul}</SelectItem>)}
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
              <TableHead>Fasilitator</TableHead>
              <TableHead>Lokasi</TableHead>
              <TableHead>Hadir</TableHead>
              <TableHead>Izin</TableHead>
              <TableHead>Sakit</TableHead>
              <TableHead>Alpha</TableHead>
              <TableHead>% Hadir</TableHead>
              <TableHead>Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRekap.length === 0 ? (
              <TableRow><TableCell colSpan={10} className="text-center">Tidak ada data rekap</TableCell></TableRow>
            ) : filteredRekap.map((r: any) => (
              <>
                <TableRow key={r.id}>
                  <TableCell>{r.mingguKe}</TableCell>
                  <TableCell>{r.modul?.judul}</TableCell>
                  <TableCell>{r.fasilitator?.nama}</TableCell>
                  <TableCell>{r.lokasi?.nama}</TableCell>
                  <TableCell>{r.hadir}</TableCell>
                  <TableCell>{r.izin}</TableCell>
                  <TableCell>{r.sakit}</TableCell>
                  <TableCell>{r.alpha}</TableCell>
                  <TableCell className={getHadirColor(r.persentaseHadir)}>{r.persentaseHadir}%</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => toggleRow(r.id)}>
                      Detail {expandedRows.includes(r.id) ? <ChevronUp className="ml-1 w-4 h-4" /> : <ChevronDown className="ml-1 w-4 h-4" />}
                    </Button>
                  </TableCell>
                </TableRow>
                {expandedRows.includes(r.id) && (
                  <TableRow>
                    <TableCell colSpan={10} className="bg-muted/50 p-4">
                      <div className="border rounded-md bg-background">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Nama Siswa</TableHead>
                              <TableHead>Kelas</TableHead>
                              <TableHead>Kehadiran</TableHead>
                              <TableHead>Nilai</TableHead>
                              <TableHead>Catatan</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {r.detailSiswa?.map((siswa: any, idx: number) => (
                              <TableRow key={idx}>
                                <TableCell className="font-medium">{siswa.nama}</TableCell>
                                <TableCell>{siswa.kelas}</TableCell>
                                <TableCell>
                                  <Badge variant="outline">{siswa.statusKehadiran}</Badge>
                                </TableCell>
                                <TableCell>{getNilaiBadge(siswa.nilai)}</TableCell>
                                <TableCell>{siswa.catatan || "-"}</TableCell>
                              </TableRow>
                            ))}
                            {(!r.detailSiswa || r.detailSiswa.length === 0) && (
                              <TableRow><TableCell colSpan={5} className="text-center">Tidak ada detail siswa</TableCell></TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
