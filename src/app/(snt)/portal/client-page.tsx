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
            <Link href="/portal/laporan" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-emerald-600 text-white hover:bg-emerald-700 h-9 px-4">
              + Buat Laporan
            </Link>
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
                  <div className="text-right">
                    {lap.expenseRequest ? (
                      <>
                        <div className="font-medium text-slate-900">Rp {lap.expenseRequest.amount.toLocaleString('id-ID')}</div>
                        <div className="text-xs mt-1 px-2 py-1 bg-slate-100 rounded-md inline-block">
                          {lap.expenseRequest.status === 'APPROVED' ? (
                            <span className="text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Disetujui</span>
                          ) : lap.expenseRequest.status === 'REJECTED' ? (
                            <span className="text-red-600">Ditolak</span>
                          ) : (
                            <span className="text-amber-600">Menunggu</span>
                          )}
                        </div>
                      </>
                    ) : (
                      <span className="text-xs text-slate-400">Belum ada tagihan</span>
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
