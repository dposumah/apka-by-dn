import { getAllModul } from '@/app/actions/ekstra'
import { ModulClientPage } from './client-page'

export const dynamic = 'force-dynamic'

export default async function ModulPage() {
  const modul = await getAllModul()
  return <ModulClientPage initialModul={modul} />
}
