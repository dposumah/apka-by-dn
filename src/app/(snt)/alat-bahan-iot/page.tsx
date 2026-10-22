import { getPaketIoTList } from '@/app/actions/iot'
import { prisma } from '@/lib/prisma'
import { AlatBahanIotClient } from './client-page'

export const dynamic = 'force-dynamic'

export default async function AlatBahanIotPage() {
  const paketList = await getPaketIoTList()
  const fasilitators = await prisma.fasilitator.findMany({
    where: { isActive: true },
    orderBy: { namaLengkap: 'asc' }
  })

  return (
    <AlatBahanIotClient 
      initialPaketList={paketList} 
      fasilitators={fasilitators} 
    />
  )
}
