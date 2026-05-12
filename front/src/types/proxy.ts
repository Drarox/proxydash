export type CertificateStatus = 'valid' | 'warning' | 'expired' | 'missing' | 'unknown'
export type FilterKey = 'all' | CertificateStatus

export interface ProxyOptions {
  gzip: boolean | null
  basicAuth: boolean | null
  websocket: boolean | null
  proxyBuffering: boolean | null
  maxClientBodySize: string | null
}

export interface ProxySite {
  id: string
  domain: string
  aliases: string[]
  upstream: string
  upstreamName: string | null
  proxyPass: string
  configPath: string
  filename: string
  certificatePath: string | null
  certificateStatus: CertificateStatus
  certificateExpiresAt: string | null
  options: ProxyOptions
  config: string
}

export interface DashboardStat {
  label: string
  value: string
  detail: string
  tone: 'blue' | 'green' | 'amber' | 'violet'
  action?: () => void
}

export interface NginxConfig {
  path: string
  filename: string
  content: string
}
