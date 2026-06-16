import { getMaintenanceStatus } from './actions/maintenance'
import LoginClient from './LoginClient'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const isMaintenance = await getMaintenanceStatus()
  return <LoginClient isMaintenance={isMaintenance} />
}
