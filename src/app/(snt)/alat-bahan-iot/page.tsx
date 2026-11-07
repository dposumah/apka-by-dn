import { getPaketIoTList } from '@/app/actions/iot'
import { getIoTCashflowData } from '@/app/actions/iot-cashflow'
import { prisma } from '@/lib/prisma'
import { AlatBahanIotClient } from './client-page'

export const dynamic = 'force-dynamic'

export default async function AlatBahanIotPage() {
  const [paketList, fasilitators, cashflowData] = await Promise.all([
    getPaketIoTList(),
    prisma.fasilitator.findMany({
      where: { isActive: true },
      orderBy: { namaLengkap: 'asc' }
    }),
    getIoTCashflowData()
  ])

  return (
    <AlatBahanIotClient 
      initialPaketList={paketList} 
      fasilitators={fasilitators} 
      initialCashflowData={cashflowData}
    />
  )
}
