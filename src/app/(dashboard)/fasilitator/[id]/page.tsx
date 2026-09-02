import { getFasilitatorDetail } from '@/app/actions/rab'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/format'
import { BankForm } from './bank-form'
import Link from 'next/link'

export default async function FasilitatorDetailPage({ params }: { params: { id: string } }) {
  const f = await getFasilitatorDetail(params.id)
  
  if (!f) return <div className="p-8">Fasilitator tidak ditemukan.</div>

  const totalHonor = f.expenses
    .filter(e => e.status === 'APPROVED')
    .reduce((sum, e) => sum + e.amount, 0)

  return (
    <div className="p-8 space-y-6 max-w-5xl mx-auto">
      <Link href="/fasilitator" className="text-blue-600 hover:underline mb-4 inline-block">&larr; Kembali ke Daftar Fasilitator</Link>
      <h1 className="text-3xl font-bold tracking-tight">Profil Fasilitator</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Data Akademik & Profil</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-500 block">Nama Lengkap</span>
                <span className="font-medium text-lg">{f.namaLengkap}</span>
              </div>
              <div>
                <span className="text-slate-500 block">NIP / NUPTK</span>
                <span className="font-medium">{f.nipNuptk || '-'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Instansi</span>
                <span className="font-medium">{f.instansi || '-'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Pendidikan</span>
                <span className="font-medium">{f.pendidikan || '-'}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-500 block">Bidang Keahlian / Kompetensi</span>
                <p className="font-medium mt-1">{f.klusterKeahlian}</p>
                <p className="text-slate-600 mt-1">{f.kompetensi}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Riwayat Pembayaran Honorarium</CardTitle>
            </CardHeader>
            <CardContent>
              {f.expenses.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="py-2 px-3">Tanggal</th>
                        <th className="py-2 px-3">Item RAB</th>
                        <th className="py-2 px-3">Deskripsi</th>
                        <th className="py-2 px-3">Status</th>
                        <th className="py-2 px-3">Jumlah</th>
                      </tr>
                    </thead>
                    <tbody>
                      {f.expenses.map(exp => (
                        <tr key={exp.id} className="border-b">
                          <td className="py-2 px-3">{new Date(exp.date).toLocaleDateString('id-ID')}</td>
                          <td className="py-2 px-3">{exp.rabItem.name}</td>
                          <td className="py-2 px-3">{exp.description}</td>
                          <td className="py-2 px-3">
                            <Badge variant={exp.status === 'APPROVED' ? 'default' : exp.status === 'REJECTED' ? 'destructive' : 'secondary'}>{exp.status}</Badge>
                          </td>
                          <td className="py-2 px-3 font-medium text-right">{formatCurrency(exp.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50 font-bold border-t-2 border-slate-200">
                      <tr>
                        <td colSpan={4} className="py-3 px-3 text-right">TOTAL HONOR CAIR:</td>
                        <td className="py-3 px-3 text-right text-emerald-600">{formatCurrency(totalHonor)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <p className="text-slate-500">Belum ada riwayat honorarium.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Data Keuangan</CardTitle>
            </CardHeader>
            <CardContent>
              <BankForm fasilitator={f} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
