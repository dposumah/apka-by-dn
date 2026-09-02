import { getFasilitators } from '@/app/actions/rab'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'

export default async function FasilitatorPage() {
  const fasilitators = await getFasilitators()

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Master Data Fasilitator</h1>
      
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
                  <th className="px-4 py-3">Instansi</th>
                  <th className="px-4 py-3">Bidang Keahlian</th>
                  <th className="px-4 py-3">Rekening Bank</th>
                  <th className="px-4 py-3">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {fasilitators.map(f => (
                  <tr key={f.id} className="border-b hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-blue-700">{f.namaLengkap}</td>
                    <td className="px-4 py-3 text-slate-600">{f.instansi}</td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary">{f.klusterKeahlian}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      {f.bankAccount ? (
                        <span className="text-emerald-600 font-medium">{f.bankName} - {f.bankAccount}</span>
                      ) : (
                        <span className="text-rose-500 text-xs italic">Belum diset</span>
                      )}
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
