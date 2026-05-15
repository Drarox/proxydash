import { readdir, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { parseNginxConfigFiles } from './parser'
import { getCachedCert } from '../cache/certCache'
import type { ParsedProxyConfig, RawNginxConfigFile } from './types'

const DEFAULT_SITES_AVAILABLE_DIR = '/etc/nginx/sites-available'
const DEFAULT_NGINX_CONFIG_PATH = '/etc/nginx/nginx.conf'

export function getNginxSitesAvailableDir() {
  return Bun.env.NGINX_SITES_AVAILABLE_DIR || DEFAULT_SITES_AVAILABLE_DIR
}

export function getNginxConfigPath() {
  return Bun.env.NGINX_CONFIG_PATH || DEFAULT_NGINX_CONFIG_PATH
}

export async function getNginxConfigFile(configPath = getNginxConfigPath()): Promise<RawNginxConfigFile> {
  if (!(await isReadableFile(configPath))) {
    throw new Error(`Config file is not readable: ${configPath}`)
  }

  return {
    path: configPath,
    filename: configPath.split('/').at(-1) ?? 'nginx.conf',
    content: await Bun.file(configPath).text(),
  }
}

export async function listNginxConfigFiles(
  sitesAvailableDir = getNginxSitesAvailableDir(),
): Promise<RawNginxConfigFile[]> {
  const entries = await readdir(sitesAvailableDir, { withFileTypes: true })
  const files = await Promise.all(
    entries
      .filter((entry) => entry.isFile() || entry.isSymbolicLink())
      .map(async (entry) => {
        const path = join(sitesAvailableDir, entry.name)

        if (!(await isReadableFile(path))) {
          return null
        }

        return {
          path,
          filename: entry.name,
          content: await Bun.file(path).text(),
        }
      }),
  )

  return files
    .filter((file): file is RawNginxConfigFile => file !== null)
    .sort((left, right) => left.filename.localeCompare(right.filename))
}

export async function listNginxProxySites(
  sitesAvailableDir = getNginxSitesAvailableDir(),
): Promise<ParsedProxyConfig[]> {
  const files = await listNginxConfigFiles(sitesAvailableDir)
  return parseNginxConfigFiles(files, certCheckerFromCache)
}

// Returns all unique domains found across all proxy site configs.
export async function listProxyDomains(
  sitesAvailableDir = getNginxSitesAvailableDir(),
): Promise<string[]> {
  const sites = await listNginxProxySites(sitesAvailableDir)
  const domains = sites.map((s) => s.domain).filter(Boolean)
  return Array.from(new Set(domains))
}

// Certificate checker that reads from the in-memory cache. Falls back to 'unknown' if the domain hasn't been cached yet.
async function certCheckerFromCache(domain: string) {
  const cached = getCachedCert(domain)
  if (cached) {
    return { status: cached.status, expiresAt: cached.expiresAt }
  }
  // Cache miss: return unknown
  return { status: 'unknown' as const, expiresAt: null }
}

async function isReadableFile(path: string) {
  try {
    const fileStat = await stat(path)
    return fileStat.isFile()
  } catch {
    return false
  }
}
