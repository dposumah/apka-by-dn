import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getAkomodasiList } from '@/app/actions/akomodasi'
import { getFasilitators } from '@/app/actions/rab'
import { AkomodasiClient } from './client-page'

export default async function AkomodasiPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const [data, fasilitators] = await Promise.all([
    getAkomodasiList(),
    getFasilitators()
  ])

  return <AkomodasiClient initialData={data} fasilitators={fasilitators} />
}
