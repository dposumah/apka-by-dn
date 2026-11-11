import { prisma } from '@/lib/prisma'
import { RekapHonorClient } from './client-page'
import { getAppSetting } from '@/app/actions/rab'
import { buildSignedReceiptUrl } from '@/lib/receipt-link'

export const dynamic = 'force-dynamic'

export default async function AdminRekapHonorPage() {
  const fasilitators = await prisma.fasilitator.findMany({ orderBy: { namaLengkap: 'asc' } });
  const rekapRawList = await prisma.rekapHonorarium.findMany({
    include: { 
      fasilitator: true, 
      laporan: true,
      kwitansiRecord: true,
      invoiceRecord: true
    },
    orderBy: { createdAt: 'desc' }
  })

  const rekapList = rekapRawList.map((r) => ({
    ...r,
    shortUrlHonor: r.buktiPembayaranHonor ? buildSignedReceiptUrl(r.id, 'h') : null,
    shortUrlTransport: r.buktiPembayaranTransport ? buildSignedReceiptUrl(r.id, 't') : null,
  }))

  const hargaBbmSetting = await getAppSetting('harga_pertamax', '16300');
  const globalHargaBbm = parseFloat(hargaBbmSetting) || 16300;

  return (
    <RekapHonorClient 
      initialData={rekapList} 
      fasilitators={fasilitators} 
      globalHargaBbm={globalHargaBbm} 
    />
  )
}
