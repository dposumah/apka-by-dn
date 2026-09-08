import { getTransportConfig } from '@/app/actions/transport-config'
import { TransportConfigClient } from './client-config'

export default async function TransportConfigPage() {
  const config = await getTransportConfig()
  
  return <TransportConfigClient config={config} />
}
