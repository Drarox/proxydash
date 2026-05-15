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
    const socket = tls.connect({
      host: hostname,
      port,
      servername: hostname,
      rejectUnauthorized: false,
    })

    socket.setTimeout(10000, () => {
      socket.destroy(new Error('Certificate check timed out'))
    })

    socket.on('secureConnect', () => {
      try {
        const peerCert = socket.getPeerCertificate(true)
        socket.end()

        if (!peerCert || !peerCert.valid_from || !peerCert.valid_to) {
          reject(new Error('No peer cert'))
          return
        }

        const validFrom = new Date(peerCert.valid_from)
        const validTo = new Date(peerCert.valid_to)
        const daysLeft = Math.floor((validTo.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

        resolve({
          validFrom,
          validTo,
          daysLeft,
          issuer: toStringValue(peerCert.issuer?.CN),
        })
      } catch (err) {
        reject(err)
      }
    })

    socket.on('error', reject)
  })
}
