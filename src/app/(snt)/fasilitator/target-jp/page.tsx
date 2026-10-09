import { getRekapTargetJp } from '@/app/actions/rekap'
import { TargetJpClient } from './client-page'

export const dynamic = 'force-dynamic'

export default async function TargetJpPage() {
  const d = new Date()
  const currentMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  const initialData = await getRekapTargetJp(currentMonth)

  return <TargetJpClient initialData={initialData} defaultMonth={currentMonth} />
}
