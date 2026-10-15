// oxjob #1689: the record middleware (server/middleware/02.records.ts). Non-canonical
// record URLs (short form /W123, lowercase id, trailing slash) 301 to the long form
// without an API call; the long form does the merged-id 301 and the 404.
import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest'
import { createServer, type Server } from 'node:http'
import { createApp, toNodeListener } from 'h3'

const apiGet = vi.fn()
vi.mock('../lib/ssrApi', () => ({
  apiGet: (...args: any[]) => apiGet(...args),
  RECORD_TIMEOUT_MS: 1500,
  LIST_TIMEOUT_MS: 1500,
}))

const { default: records } = await import('../middleware/02.records')

let server: Server
let base = ''
beforeAll(async () => {
  const app = createApp()
  app.use(records)
  app.use(() => 'rendered')
  server = createServer(toNodeListener(app))
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()))
  base = `http://127.0.0.1:${(server.address() as any).port}`
})
afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())))
beforeEach(() => apiGet.mockReset())

const get = (path: string) => fetch(base + path, { redirect: 'manual' })

describe('record middleware redirects', () => {
  it.each([
    ['/W7171967220', '/works/W7171967220'],
    ['/w7171967220', '/works/W7171967220'],
    ['/A5029290445?tab=x', '/authors/A5029290445?tab=x'],
    ['/works/w7171967220', '/works/W7171967220'],
    ['/works/W7171967220/', '/works/W7171967220'],
    ['/keywords/Machine-Learning', '/keywords/machine-learning'],
  ])('%s -> 301 %s without calling the API', async (from, to) => {
    const res = await get(from)
    expect(res.status).toBe(301)
    expect(res.headers.get('location')).toBe(to)
    expect(apiGet).not.toHaveBeenCalled()
  })

  it('a merged id on the long form 301s to the record it was merged into', async () => {
    apiGet.mockResolvedValue({ status: 'ok', data: { id: 'https://openalex.org/W2' } })
    const res = await get('/works/W1')
    expect(res.status).toBe(301)
    expect(res.headers.get('location')).toBe('/works/W2')
    expect(apiGet).toHaveBeenCalledWith('works/W1', 1500)
  })

  it('an unknown id 404s at the long form', async () => {
    apiGet.mockResolvedValue({ status: 'notfound' })
    const res = await get('/works/W999')
    expect(res.status).toBe(404)
  })

  it('the canonical URL renders with the record', async () => {
    apiGet.mockResolvedValue({ status: 'ok', data: { id: 'https://openalex.org/W7171967220', display_name: 'x' } })
    const res = await get('/works/W7171967220')
    expect(res.status).toBe(200)
    expect(res.headers.get('x-openalex-render')).toBe('ssr')
  })
})
