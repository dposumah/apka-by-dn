"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { ChevronDown, ChevronUp } from "lucide-react"

export function RiwayatEkstraClient({ laporanList }: { laporanList: any[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Riwayat Laporan Ekstrakurikuler</h1>

      {laporanList.length === 0 ? (
        <Card className="bg-gray-50 border-dashed">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <div className="rounded-full bg-gray-200 p-3 mb-4">
              <span className="text-2xl">📋</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900">Belum Ada Riwayat</h3>
            <p className="text-sm text-gray-500 mt-1 max-w-sm">
              Anda belum pernah mengirimkan laporan ekstrakurikuler. Laporan yang sudah Anda kirimkan akan muncul di sini.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {laporanList.map((laporan) => {
            const isExpanded = expandedId === laporan.id

            // Calculate stats
            let hadir = 0, izin = 0, sakit = 0, alpha = 0
            laporan.detailKehadiran?.forEach((d: any) => {
              if (d.status === "Hadir") hadir++
              else if (d.status === "Izin") izin++
              else if (d.status === "Sakit") sakit++
              else if (d.status === "Alpha") alpha++
            })

            return (
              <Card key={laporan.id} className="overflow-hidden">
                <CardHeader 
                  className="cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : laporan.id)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        Minggu ke-{laporan.jadwal?.mingguKe}
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                          {laporan.jadwal?.modul?.judul || "Tanpa Modul"}
                        </Badge>
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Tanggal Kegiatan: {format(new Date(laporan.tanggalKegiatan), "dd MMMM yyyy", { locale: id })}
                      </CardDescription>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex gap-2 text-sm">
                        <Badge variant="secondary" className="bg-green-100 text-green-800">{hadir} Hadir</Badge>
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">{izin} Izin</Badge>
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">{sakit} Sakit</Badge>
                        <Badge variant="secondary" className="bg-red-100 text-red-800">{alpha} Alpha</Badge>
                      </div>
                      {isExpanded ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                    </div>
                  </div>
                </CardHeader>
                
                {isExpanded && (
                  <CardContent className="border-t bg-gray-50/50 pt-4">
                    <div className="space-y-6">
                      
                      {laporan.catatanUmum && (
                        <div className="bg-white p-4 rounded-md border text-sm">
                          <strong className="block mb-1">Catatan Umum:</strong>
                          <p className="text-gray-700 whitespace-pre-wrap">{laporan.catatanUmum}</p>
                        </div>
                      )}

                      {(laporan.foto1 || laporan.foto2) && (
                        <div>
                          <strong className="block mb-2 text-sm">Dokumentasi:</strong>
                          <div className="flex gap-4">
                            {laporan.foto1 && (
                              <img src={laporan.foto1} alt="Foto 1" className="w-40 h-40 object-cover rounded-md border shadow-sm" />
                            )}
                            {laporan.foto2 && (
                              <img src={laporan.foto2} alt="Foto 2" className="w-40 h-40 object-cover rounded-md border shadow-sm" />
                            )}
                          </div>
                        </div>
                      )}
                      
                      <div>
                        <strong className="block mb-2 text-sm">Detail Kehadiran:</strong>
                        <div className="bg-white border rounded-md overflow-hidden">
                          <Table>
                            <TableHeader className="bg-gray-50">
                              <TableRow>
                                <TableHead className="w-12">No</TableHead>
                                <TableHead>Nama Siswa</TableHead>
                                <TableHead>Kelas</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Nilai</TableHead>
                                <TableHead>Catatan</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {laporan.detailKehadiran?.map((detail: any, idx: number) => (
                                <TableRow key={detail.id}>
                                  <TableCell>{idx + 1}</TableCell>
                                  <TableCell className="font-medium">{detail.siswa?.namaLengkap}</TableCell>
                                  <TableCell>{detail.siswa?.kelas}</TableCell>
                                  <TableCell>
                                    <Badge variant={
                                      detail.status === "Hadir" ? "default" : 
                                      detail.status === "Alpha" ? "destructive" : 
                                      "outline"
                                    } className={detail.status === "Hadir" ? "bg-green-600" : ""}>
                                      {detail.status}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>{detail.nilai}</TableCell>
                                  <TableCell className="text-gray-600 text-sm">{detail.catatan || "-"}</TableCell>
                                </TableRow>
                              ))}
                              {(!laporan.detailKehadiran || laporan.detailKehadiran.length === 0) && (
                                <TableRow>
                                  <TableCell colSpan={6} className="text-center text-gray-500 py-4">
                                    Tidak ada data kehadiran
                                  </TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                      
                    </div>
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
