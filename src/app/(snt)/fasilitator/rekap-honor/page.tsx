import { prisma } from '@/lib/prisma'
import { RekapHonorClient } from './client-page'

export const dynamic = 'force-dynamic'

export default async function AdminRekapHonorPage() {
  const fasilitators = await prisma.fasilitator.findMany({ orderBy: { namaLengkap: 'asc' } });
  const rekapList = await prisma.rekapHonorarium.findMany({
    include: {
      fasilitator: true
    },
    orderBy: { createdAt: 'desc' }
  })

  return <RekapHonorClient initialData={rekapList} fasilitators={fasilitators} />
}
