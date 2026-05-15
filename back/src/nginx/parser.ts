import type { CertificateStatus, ParsedProxyConfig, RawNginxConfigFile } from './types'

type UpstreamRegistry = Record<string, string>
type CertificateChecker = (domain: string) => Promise<CertificateInfo>

interface Block {
  name: string
  args: string
  body: string
}

interface CertificateInfo {
  status: CertificateStatus
  expiresAt: string | null
}

export async function parseNginxConfigFiles(
  files: RawNginxConfigFile[],
  checkCertificate: CertificateChecker,
): Promise<ParsedProxyConfig[]> {
  const upstreams = collectUpstreams(files)
  const sites = await Promise.all(
    files.flatMap((file) => parseConfigFile(file, upstreams, checkCertificate)),
  )

  return sites.filter((site): site is ParsedProxyConfig => site !== null)
}

export function parseConfigFile(
  file: RawNginxConfigFile,
  upstreams: UpstreamRegistry = {},
  checkCertificate: CertificateChecker,
): Array<Promise<ParsedProxyConfig | null>> {
  const cleanedContent = stripComments(file.content)
  const serverBlocks = findBlocks(cleanedContent, 'server')

  if (serverBlocks.length === 0) {
    return [parseServerBlock(file, cleanedContent, upstreams, checkCertificate)]
  }

  return serverBlocks.map((block) => parseServerBlock(file, block.body, upstreams, checkCertificate))
}

function collectUpstreams(files: RawNginxConfigFile[]): UpstreamRegistry {
  return files.reduce<UpstreamRegistry>((registry, file) => {
    const content = stripComments(file.content)

    for (const block of findBlocks(content, 'upstream')) {
      const firstServer = getDirectiveValues(block.body, 'server')[0]

      if (block.args && firstServer) {
        registry[block.args.trim()] = firstServer
      }
    }

    return registry
  }, {})
}

async function parseServerBlock(
  file: RawNginxConfigFile,
  serverBody: string,
  upstreams: UpstreamRegistry,
  checkCertificate: CertificateChecker,
): Promise<ParsedProxyConfig | null> {
  const serverNames = getDirectiveValues(serverBody, 'server_name').filter((name) => name !== '_')
  const proxyPass = getDirectiveValue(serverBody, 'proxy_pass')
  const upstreamTarget = resolveUpstreamTarget(proxyPass, upstreams)

  if (!proxyPass) {
    return null
  }

  const certificatePath = getDirectiveValue(serverBody, 'ssl_certificate')
  const fallbackDomain = file.filename.replace(/\.conf$/i, '')
  const domain = serverNames[0] ?? fallbackDomain
  const certificate = await checkCertificate(domain)

  return {
    id: file.path,
    domain,
    aliases: serverNames.slice(1),
    upstream: upstreamTarget.address,
    upstreamName: upstreamTarget.name,
    proxyPass,
    configPath: file.path,
    filename: file.filename,
    certificatePath,
    certificateStatus: certificate.status,
    certificateExpiresAt: certificate.expiresAt,
    options: {
      gzip: getOnOffDirective(serverBody, 'gzip'),
      basicAuth: getBasicAuthOption(serverBody),
      websocket: getWebsocketOption(serverBody),
      proxyBuffering: getOnOffDirective(serverBody, 'proxy_buffering'),
      maxClientBodySize: getDirectiveValue(serverBody, 'client_max_body_size'),
    },
    config: file.content,
  }
}

function stripComments(content: string) {
  return content
    .split('\n')
    .map((line) => stripCommentFromLine(line))
    .join('\n')
}

function stripCommentFromLine(line: string) {
  let quote: string | null = null

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]
    const previous = line[index - 1]

    if ((char === '"' || char === "'") && previous !== '\\') {
      quote = quote === char ? null : quote ?? char
    }

    if (char === '#' && quote === null) {
      return line.slice(0, index)
    }
  }

  return line
}

function findBlocks(content: string, blockName: string): Block[] {
  const blocks: Block[] = []
  const pattern = new RegExp(`(^|\\s)${escapeRegExp(blockName)}\\s+([^{};]*)\\{`, 'gm')
  let match: RegExpExecArray | null

  while ((match = pattern.exec(content)) !== null) {
    const bodyStart = pattern.lastIndex
    const bodyEnd = findMatchingBrace(content, bodyStart - 1)

    if (bodyEnd === -1) {
      continue
    }

    blocks.push({
      name: blockName,
      args: (match[2] ?? '').trim(),
      body: content.slice(bodyStart, bodyEnd),
    })
    pattern.lastIndex = bodyEnd + 1
  }

  return blocks
}

function findMatchingBrace(content: string, openBraceIndex: number) {
  let depth = 0
  let quote: string | null = null

  for (let index = openBraceIndex; index < content.length; index += 1) {
    const char = content[index]
    const previous = content[index - 1]

    if ((char === '"' || char === "'") && previous !== '\\') {
      quote = quote === char ? null : quote ?? char
    }

    if (quote !== null) {
      continue
    }

    if (char === '{') {
      depth += 1
    }

    if (char === '}') {
      depth -= 1

      if (depth === 0) {
        return index
      }
    }
  }

  return -1
}

function getDirectiveValue(content: string, directive: string) {
  return getDirectiveValues(content, directive)[0] ?? null
}

function getDirectiveValues(content: string, directive: string) {
  const pattern = new RegExp(`(^|\\s)${escapeRegExp(directive)}\\s+([^;]+);`, 'gm')
  const values: string[] = []
  let match: RegExpExecArray | null

  while ((match = pattern.exec(content)) !== null) {
    values.push(...splitDirectiveValues(match[2] ?? ''))
  }

  return values
}

function splitDirectiveValues(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .map((part) => part.replace(/^["']|["']$/g, ''))
    .filter(Boolean)
}

function getOnOffDirective(content: string, directive: string) {
  const value = getDirectiveValue(content, directive)

  if (!value) {
    return null
  }

  return value.toLowerCase() === 'on'
}

function getBasicAuthOption(content: string) {
  const value = getDirectiveValue(content, 'auth_basic')

  if (!value) {
    return null
  }

  return value.toLowerCase() !== 'off'
}

function getWebsocketOption(content: string) {
  const includesWebsocketConfig = getDirectiveValues(content, 'include').some((path) =>
    /(^|\/)websocket\.conf$/i.test(path),
  )
  const hasUpgradeHeader = /proxy_set_header\s+Upgrade\s+\$http_upgrade\s*;/i.test(content)
  const hasConnectionUpgradeHeader = /proxy_set_header\s+Connection\s+["']?\$?upgrade["']?\s*;/i.test(content)

  if (includesWebsocketConfig) {
    return true
  }

  if (!hasUpgradeHeader && !hasConnectionUpgradeHeader) {
    return null
  }

  return hasUpgradeHeader && hasConnectionUpgradeHeader
}

function resolveUpstreamTarget(proxyPass: string | null, upstreams: UpstreamRegistry) {
  if (!proxyPass) {
    return { address: 'Not configured', name: null }
  }

  const normalizedProxyPass = normalizeProxyPass(proxyPass)
  const targetHost = normalizedProxyPass.split('/')[0]?.split(':')[0] ?? normalizedProxyPass

  if (upstreams[targetHost]) {
    return { address: upstreams[targetHost], name: targetHost }
  }

  return { address: normalizedProxyPass, name: null }
}

function normalizeProxyPass(proxyPass: string) {
  return proxyPass.replace(/^https?:\/\//i, '').replace(/\/$/, '')
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
