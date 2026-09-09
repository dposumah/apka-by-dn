export const dynamic = 'force-dynamic';
import { getFasilitators } from '@/app/actions/rab'
import { DeleteFasilButton } from './delete-fasil-button'
import { ToggleStatusButton } from './toggle-status-button'
import { ExportExcelButton } from './export-excel-button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'

export default async function FasilitatorPage() {
  const fasilitators = await getFasilitators()

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Master Data Fasilitator</h1>
        <div className="flex gap-2 flex-wrap">
          <ExportExcelButton data={fasilitators} />
          <Link href="/fasilitator/transport" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 h-10 py-2 px-4">
            Rekap Transport
          </Link>
          <Link href="/fasilitator/new" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-blue-600 text-white hover:bg-blue-700 h-10 py-2 px-4">
            + Tambah Fasilitator
          </Link>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Daftar Fasilitator Terdaftar ({fasilitators.length} orang)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="text-xs uppercase bg-slate-50 border-b">
                <tr>
                  <th className="px-4 py-3">Nama Lengkap</th>
                  <th className="px-4 py-3">Lokasi SNT</th>
                  <th className="px-4 py-3">Alamat / Wilayah</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Rekening Bank</th>
                  <th className="px-4 py-3">Akses Login</th>
                  <th className="px-4 py-3">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {fasilitators.map(f => (
                  <tr key={f.id} className="border-b hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-blue-700">{f.namaLengkap}</td>
                    <td className="px-4 py-3 text-slate-600">
        {f.lokasiSNT ? (
          <>
            <div className="font-medium text-slate-800">{f.lokasiSNT.split(' - ')[0]}</div>
            {f.lokasiSNT.split(' - ')[1] && <div className="text-xs text-slate-500 mt-0.5 leading-tight">{f.lokasiSNT.split(' - ')[1]}</div>}
          </>
        ) : (
          '-'
        )}
      </td>
                    <td className="px-4 py-3 max-w-[200px] truncate text-slate-600" title={f.alamat || ''}>
                      {f.kabKota || f.propinsi ? `${f.kabKota || ''} ${f.propinsi ? '('+f.propinsi+')' : ''}` : (f.alamat || '-')}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{f.email || '-'}</td>
                    <td className="px-4 py-3">
                      {f.bankAccount ? (
                        <span className="text-emerald-600 font-medium">{f.bankName} - {f.bankAccount}</span>
                      ) : (
                        <span className="text-rose-500 text-xs italic">Belum diset</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <ToggleStatusButton id={f.id} isActive={f.isActive} />
                    </td>
                    <td className="px-4 py-3">
                      <Link href={/fasilitator/ + f.id} className="text-sm font-medium text-blue-600 hover:underline">
                        Lihat Profil &rarr;
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {fasilitators.length === 0 && (
              <p className="p-4 text-center text-slate-500">Belum ada data Fasilitator. Harap jalankan script seed.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
