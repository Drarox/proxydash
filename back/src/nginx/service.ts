import { readdir, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { parseNginxConfigFiles } from './parser'
import type { ParsedProxyConfig, RawNginxConfigFile } from './types'

const DEFAULT_SITES_AVAILABLE_DIR = '/etc/nginx/sites-available'

export function getNginxSitesAvailableDir() {
  return Bun.env.NGINX_SITES_AVAILABLE_DIR || DEFAULT_SITES_AVAILABLE_DIR
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
  return parseNginxConfigFiles(await listNginxConfigFiles(sitesAvailableDir))
}

async function isReadableFile(path: string) {
  try {
    const fileStat = await stat(path)
    return fileStat.isFile()
  } catch {
    return false
  }
}
