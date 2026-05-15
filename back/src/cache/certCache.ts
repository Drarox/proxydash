import { checkCertExpiry } from '../utils/cert-check'
import type { CertificateStatus } from '../nginx/types'

export interface CertCacheEntry {
    status: CertificateStatus
    expiresAt: string | null
    checkedAt: Date
}

// Max simultaneous TLS socket connections during a refresh.
const CONCURRENCY_LIMIT = 5

const cache = new Map<string, CertCacheEntry>()

export function getCachedCert(domain: string): CertCacheEntry | null {
    return cache.get(domain) ?? null
}

export function getCacheSnapshot(): Record<string, CertCacheEntry> {
    return Object.fromEntries(cache)
}

export async function refreshCerts(domains: string[]): Promise<void> {
    console.log(`[certCache] Refreshing ${domains.length} domain(s) (concurrency: ${CONCURRENCY_LIMIT})…`)

    const results = await withConcurrencyLimit(domains, checkAndStore, CONCURRENCY_LIMIT)

    const failed = results.filter((r) => r.status === 'rejected').length
    console.log(`[certCache] Done — ${domains.length - failed} ok, ${failed} failed`)

    // TODO: add notification logic here in the future
}

async function checkAndStore(domain: string): Promise<void> {
    cache.set(domain, await resolveCertEntry(domain))
}

async function resolveCertEntry(domain: string, attempts = 3, delayMs = 2000): Promise<CertCacheEntry> {
    for (let attempt = 1; attempt <= attempts; attempt++) {
        try {
            const result = await checkCertExpiry(domain)
            const expiresAt = result.validTo

            if (Number.isNaN(expiresAt.getTime())) {
                return { status: 'unknown', expiresAt: null, checkedAt: new Date() }
            }

            if (result.daysLeft <= 0) {
                return { status: 'expired', expiresAt: expiresAt.toISOString(), checkedAt: new Date() }
            }

            const status: CertificateStatus = result.daysLeft <= 30 ? 'warning' : 'valid'
            return { status, expiresAt: expiresAt.toISOString(), checkedAt: new Date() }
        } catch (err) {
            if (attempt < attempts) {
                console.warn(`[certCache] Attempt ${attempt}/${attempts} failed for ${domain}, retrying in ${delayMs}ms… (${err instanceof Error ? err.message : err})`)
                await sleep(delayMs)
            } else {
                console.warn(`[certCache] All ${attempts} attempts failed for ${domain}, storing as unknown`)
            }
        }
    }

    return { status: 'unknown', expiresAt: null, checkedAt: new Date() }
}

// Runs `task` for each item in `items`, keeping at most `limit` tasks running at the same time. Returns the same shape as Promise.allSettled.
async function withConcurrencyLimit<T>(
    items: T[],
    task: (item: T) => Promise<void>,
    limit: number,
): Promise<PromiseSettledResult<void>[]> {
    const results: PromiseSettledResult<void>[] = []
    const queue = [...items]
    let index = 0

    async function worker(): Promise<void> {
        while (queue.length > 0) {
            const item = queue.shift()!
            const i = index++
            try {
                await task(item)
                results[i] = { status: 'fulfilled', value: undefined }
            } catch (reason) {
                results[i] = { status: 'rejected', reason }
            }
        }
    }

    await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))
    return results
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))
