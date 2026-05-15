import { Cron } from 'croner'
import { refreshCerts } from '../cache/certCache'
import { listProxyDomains } from '../nginx/service'

const REFRESH_PATTERN = Bun.env.CERT_REFRESH_CRON ?? '0 * * * *' // every hour by default

export async function startCertRefreshCron(): Promise<void> {
  // Performs an initial cert fetch then schedules periodic refreshes.
  const domains = await listProxyDomains()
  await refreshCerts(domains)

  new Cron(REFRESH_PATTERN, async () => {
    const updatedDomains = await listProxyDomains()
    await refreshCerts(updatedDomains)
  })

  console.log(`[certRefresh] Cron scheduled with pattern "${REFRESH_PATTERN}"`)
}
