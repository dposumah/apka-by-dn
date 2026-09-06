"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { FileText, CheckCircle2 } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import Link from 'next/link'

export function PortalClient({ fasilitator, isIncomplete, userName }: { fasilitator: any, isIncomplete: boolean, userName: string }) {
  
  return (
    <div className="p-8 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Selamat datang, {userName}</h1>
        <p className="text-slate-500 mt-1">Dashboard Portal Fasilitator KKA Robotika SNT 2026</p>
        
        {fasilitator.lokasiSNT ? (
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-sm font-medium">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
            Lokasi SNT: {fasilitator.lokasiSNT}
          </div>
        ) : (
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-sm font-medium">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>
            Lokasi SNT Belum Ditentukan oleh Admin
          </div>
        )}
      </div>
      
      {isIncomplete && (
        <Alert variant="destructive" className="bg-red-50 text-red-700 border-red-200">
          <AlertTitle>Data Profil Belum Lengkap!</AlertTitle>
          <AlertDescription>
            Harap lengkapi Nama Bank, No Rekening, dan NIK/NPWP Anda agar pembayaran honorarium dapat diproses.
            <Link href="/portal/profil" className="text-red-700 font-bold p-0 ml-2 hover:underline">
              Lengkapi Sekarang &rarr;
            </Link>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4 mb-4">
          <div>
            <CardTitle>Riwayat Laporan & Honorarium</CardTitle>
            <CardDescription>Daftar kegiatan yang telah Anda laporkan</CardDescription>
          </div>
          {isIncomplete ? (
            <button 
              onClick={() => alert('Harap lengkapi Profil dan Data Pembayaran Anda di menu Profil terlebih dahulu sebelum membuat laporan.')}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-gray-400 text-white cursor-not-allowed h-9 px-4"
            >
              + Buat Laporan
            </button>
          ) : (
            <div className="flex gap-2">
              <Link href="/portal/rekap" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 h-9 px-4">
                Rekap Bulanan
              </Link>
              <Link href="/portal/laporan" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-emerald-600 text-white hover:bg-emerald-700 h-9 px-4">
                + Buat Laporan
              </Link>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {fasilitator.laporan && fasilitator.laporan.length > 0 ? (
            <div className="space-y-4">
              {fasilitator.laporan.map((lap: any) => (
                <div key={lap.id} className="flex items-start justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-semibold text-slate-900">{lap.topic}</h4>
                    <p className="text-sm text-slate-500">{new Date(lap.date).toLocaleDateString('id-ID')} &bull; {lap.attendance} Peserta</p>
                    {lap.materialLink && (
                      <a href={lap.materialLink} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline mt-1 inline-block">
                        Lihat Lampiran File
                      </a>
                    )}
                  </div>
                  <div className="text-right space-y-1">
                    <div className="text-sm font-medium text-slate-900">
                      {(lap.jumlahJPIntra || 0) + (lap.jumlahJPEkstra || 0)} JP 
                      <span className="text-slate-500 font-normal ml-1">
                        ({lap.tingkatSekolah} - Intra: {lap.jumlahJPIntra}, Ekstra: {lap.jumlahJPEkstra})
                      </span>
                    </div>
                    {lap.biayaTransport > 0 && (
                      <div className="text-xs text-blue-600 mt-1">
                        Transport: Rp {lap.biayaTransport.toLocaleString('id-ID')}
                        {lap.statusTransport === 'PAID' && lap.buktiTransferTransport ? (
                          <a href={lap.buktiTransferTransport} target="_blank" rel="noreferrer" className="ml-1 text-emerald-600 font-medium hover:underline flex justify-end items-center mt-1">
                            Lunas (Lihat Bukti)
                          </a>
                        ) : lap.statusTransport === 'PAID' ? (
                          <span className="ml-1 text-emerald-600 font-medium block mt-1">Lunas</span>
                        ) : (
                          <span className="ml-1 text-amber-600 block mt-1">Menunggu Transfer Admin</span>
                        )}
                      </div>
                    )}
                    {lap.rekapHonorariumId ? (
                      <div className="text-xs text-emerald-600 mt-1 flex items-center justify-end gap-1"><CheckCircle2 className="w-3 h-3"/> Direkap (Bulanan)</div>
                    ) : (
                      <div className="text-xs text-amber-600 mt-1 flex justify-end">Honor Belum direkap</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500 flex flex-col items-center">
              <FileText className="w-12 h-12 text-slate-300 mb-3" />
              <p>Belum ada laporan kegiatan.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
