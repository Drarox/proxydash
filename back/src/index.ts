import { Hono } from 'hono'
import { cors } from 'hono/cors'
import {
  getNginxConfigFile,
  getNginxConfigPath,
  getNginxSitesAvailableDir,
  listNginxConfigFiles,
  listNginxProxySites,
  listProxyDomains,
} from './nginx/service'
import { startCertRefreshCron } from './crons/certRefresh'
import { refreshCerts, getCacheSnapshot } from './cache/certCache'
import { serveStatic } from 'hono/bun'

export const app = new Hono()

app.use(
  '/api/*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'OPTIONS'],
  }),
)

app.use('/*', serveStatic({ root: './static/' }))

app.get('/api', (c) => {
  return c.json({
    app: 'ProxyDash',
    status: 'ok',
    endpoints: {
      health: '/api/health',
      nginxConfig: '/api/nginx/config',
      nginxSites: '/api/nginx/sites',
      nginxConfigFiles: '/api/nginx/config-files',
      certCacheRefresh: 'POST /api/nginx/cert-cache/refresh',
    },
  })
})

app.get('/api/health', (c) => {
  return c.json({
    status: 'ok',
    nginxConfigPath: getNginxConfigPath(),
    nginxSitesAvailableDir: getNginxSitesAvailableDir(),
  })
})

app.get('/api/nginx/config', async (c) => {
  try {
    return c.json(await getNginxConfigFile())
  } catch (error) {
    return c.json(
      {
        error: 'Could not read nginx config',
        path: getNginxConfigPath(),
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      503,
    )
  }
})

app.get('/api/nginx/config-files', async (c) => {
  try {
    return c.json(await listNginxConfigFiles())
  } catch (error) {
    return c.json(
      {
        error: 'Could not read nginx config files',
        directory: getNginxSitesAvailableDir(),
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      503,
    )
  }
})

app.get('/api/nginx/sites', async (c) => {
  try {
    return c.json(await listNginxProxySites())
  } catch (error) {
    return c.json(
      {
        error: 'Could not parse nginx proxy sites',
        directory: getNginxSitesAvailableDir(),
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      503,
    )
  }
})

// Manually trigger a cert cache refresh.
app.post('/api/nginx/cert-cache/refresh', async (c) => {
  try {
    const domains = await listProxyDomains()
    await refreshCerts(domains)
    return c.json({ refreshed: true, domains })
  } catch (error) {
    return c.json(
      {
        error: 'Cert cache refresh failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      503,
    )
  }
})

// Error handler
app.onError((err, c) => {
  console.error('Unhandled error:', err)
  return c.json({ error: 'Internal Server Error' }, 500)
})

process.on('uncaughtException', (err, origin) => {
  console.error('[uncaughtException]', err);
  console.error('origin:', origin);
});

process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason);
});

if (import.meta.main) {
  const server = Bun.serve({
    port: Number(Bun.env.PORT ?? 3000),
    fetch: app.fetch,
  })

  console.log(`ProxyDash API listening on ${server.url}`)

  startCertRefreshCron().catch((err) =>
    console.error('[certRefresh] Failed to start cert refresh cron:', err),
  )
}
