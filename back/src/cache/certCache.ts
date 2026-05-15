import { checkCertExpiry } from '../utils/cert-check'
import type { CertificateStatus } from '../nginx/types'

export interface CertCacheEntry {
    status: CertificateStatus
    expiresAt: string | null
    checkedAt: Date
}

const cache = new Map<string, CertCacheEntry>()

export function getCachedCert(domain: string): CertCacheEntry | null {
    return cache.get(domain) ?? null
}

export function getCacheSnapshot(): Record<string, CertCacheEntry> {
    return Object.fromEntries(cache)
}

export async function refreshCerts(domains: string[]): Promise<void> {
    console.log(`[certCache] Refreshing certificates for ${domains.length} domain(s)…`)

    const results = await Promise.allSettled(domains.map(checkAndStore))

    const failed = results.filter((r) => r.status === 'rejected').length
    console.log(`[certCache] Done — ${domains.length - failed} ok, ${failed} failed`)

    // TODO: add notification logic here in the future
}

async function checkAndStore(domain: string): Promise<void> {
    cache.set(domain, await resolveCertEntry(domain))
}

async function resolveCertEntry(domain: string): Promise<CertCacheEntry> {
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
    } catch {
        return { status: 'unknown', expiresAt: null, checkedAt: new Date() }
    }
}