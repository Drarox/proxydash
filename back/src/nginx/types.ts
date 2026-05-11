export type CertificateStatus = 'valid' | 'warning' | 'expired' | 'missing' | 'unknown'

export interface RawNginxConfigFile {
  path: string
  filename: string
  content: string
}

export interface ProxyOptions {
  gzip: boolean | null
  basicAuth: boolean | null
  websocket: boolean | null
  proxyBuffering: boolean | null
  maxClientBodySize: string | null
}

export interface ParsedProxyConfig {
  id: string
  domain: string
  aliases: string[]
  upstream: string
  upstreamName: string | null
  proxyPass: string | null
  configPath: string
  filename: string
  certificatePath: string | null
  certificateStatus: CertificateStatus
  certificateExpiresAt: string | null
  options: ProxyOptions
  config: string
}
