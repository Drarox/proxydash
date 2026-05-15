import * as tls from 'node:tls'

const toStringValue = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value.join(', ') : (value ?? 'Unknown')

export const checkCertExpiry = async (hostname: string, port = 443): Promise<{
  validFrom: Date
  validTo: Date
  daysLeft: number
  issuer: string
}> => {
  return await new Promise((resolve, reject) => {
    let settled = false
    let timer: ReturnType<typeof setTimeout> | null = null

    const settle = (fn: () => void) => {
      if (settled) return
      settled = true
      if (timer) clearTimeout(timer)
      // Give the socket a tick to flush before destroying
      setImmediate(() => {
        try { socket.destroy() } catch { /* ignore */ }
      })
      fn()
    }

    const socket = tls.connect({
      host: hostname,
      port,
      servername: hostname,
      rejectUnauthorized: false,
    })

    timer = setTimeout(() => {
      settle(() => reject(new Error(`Certificate check timed out for ${hostname}`)))
    }, 10_000)

    socket.on('secureConnect', () => {
      try {
        const peerCert = socket.getPeerCertificate(true)
        socket.end()

        if (!peerCert || !peerCert.valid_from || !peerCert.valid_to) {
          settle(() => reject(new Error('No peer cert')))
          return
        }

        const validFrom = new Date(peerCert.valid_from)
        const validTo = new Date(peerCert.valid_to)
        const daysLeft = Math.floor((validTo.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

        settle(() => resolve({
          validFrom,
          validTo,
          daysLeft,
          issuer: toStringValue(peerCert.issuer?.CN),
        }))
      } catch (err) {
        settle(() => reject(err))
      }
    })

    socket.on('error', (err) => settle(() => reject(err)))
  })
}