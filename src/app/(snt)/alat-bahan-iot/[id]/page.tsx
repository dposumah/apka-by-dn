import { getPaketIoTDetail } from '@/app/actions/iot'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { AlatBahanIotDetailClient } from './client-detail'

export const dynamic = 'force-dynamic'

export default async function PaketIoTDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const paket = await getPaketIoTDetail(id)

  if (!paket) {
    notFound()
  }

  const fasilitators = await prisma.fasilitator.findMany({
    where: { isActive: true },
    orderBy: { namaLengkap: 'asc' }
  })

  return (
    <AlatBahanIotDetailClient 
      initialPaket={paket} 
      fasilitators={fasilitators} 
    />
  )
}
