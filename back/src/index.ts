import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { getNginxSitesAvailableDir, listNginxConfigFiles, listNginxProxySites } from './nginx/service'

export const app = new Hono()

app.use(
  '/api/*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'OPTIONS'],
  }),
)

app.get('/', (c) => {
  return c.json({
    app: 'ProxyDash',
    status: 'ok',
    endpoints: {
      health: '/api/health',
      nginxSites: '/api/nginx/sites',
      nginxConfigFiles: '/api/nginx/config-files',
    },
  })
})

app.get('/api/health', (c) => {
  return c.json({
    status: 'ok',
    nginxSitesAvailableDir: getNginxSitesAvailableDir(),
  })
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

if (import.meta.main) {
  const server = Bun.serve({
    port: Number(Bun.env.PORT ?? 3000),
    fetch: app.fetch,
  })

  console.log(`ProxyDash API listening on ${server.url}`)
}
