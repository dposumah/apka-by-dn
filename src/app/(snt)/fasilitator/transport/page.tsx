import { getAdminTransportRecap } from '@/app/actions/rekap'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { TransportClient } from './client-page'

export default async function TransportRecapPage() {
  const laporanList = await getAdminTransportRecap()

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/fasilitator" className="text-blue-600 hover:underline mb-2 inline-block">&larr; Kembali ke Data Fasilitator</Link>
          <h1 className="text-3xl font-bold tracking-tight">Rekapitulasi Transport Fasilitator</h1>
          <p className="text-slate-500">Daftar tagihan biaya transport antar pulau yang belum dibayar.</p>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Tagihan Transport Tertunda</CardTitle>
        </CardHeader>
        <CardContent>
          <TransportClient initialData={laporanList} />
        </CardContent>
      </Card>
    </div>
  )
}
