// In-memory mock of the push-be API for UI work while v2 endpoints don't exist (api-spec §4 is a draft).
// shortcut: fixtures only, no persistence across reloads; remove once push-be v2 ships (EXPO_PUBLIC_API_MOCK=0).

type Req = { method: string; path: string; query: URLSearchParams; body: unknown; params: Record<string, string> }
type Handler = (req: Req) => unknown | Promise<unknown>
type Route = { method: string; re: RegExp; keys: string[]; handler: Handler }

const routes: Route[] = []

/** Registers `GET postings/:id` style routes. Return `{ status, body }` to control the response. */
export const mock = (method: string, pattern: string, handler: Handler) => {
  const keys: string[] = []
  const re = new RegExp(
    '^' + pattern.replace(/^\/+/, '').replace(/:([a-zA-Z]+)/g, (_, k: string) => (keys.push(k), '([^/]+)')) + '$',
  )
  routes.push({ method, re, keys, handler })
}

/** Cursor page like push-be. Only GET postings reports `total`, so other lists leave it out too. */
export const page = <T>(items: T[], query: URLSearchParams, withTotal = false) => {
  const limit = Number(query.get('limit') ?? 20)
  const start = Number(query.get('cursor') ?? 0)
  const slice = items.slice(start, start + limit)
  const next = start + limit < items.length ? String(start + limit) : null
  return { data: slice, page: { nextCursor: next, hasMore: next !== null, ...(withTotal ? { total: items.length } : {}) } }
}

const json = (status: number, body: unknown) =>
  new Response(status === 204 ? null : JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

export const mockFetch: typeof fetch = async (input, init) => {
  // ky passes a Request; plain callers pass (url, init).
  const req = input instanceof Request ? input : new Request(input, init)
  const url = new URL(req.url)
  const path = url.pathname.replace(/^.*\/api\/v1\//, '')
  const method = req.method.toUpperCase()
  // RN's fetch polyfill keeps the original FormData on the Request; uploads need its parts, not text.
  const form = (req as unknown as { _bodyFormData?: FormData })._bodyFormData
  const text = form || method === 'GET' || method === 'HEAD' ? '' : await req.clone().text().catch(() => '')
  const parse = (t: string) => {
    try {
      return JSON.parse(t) as unknown
    } catch {
      return t
    }
  }
  const body: unknown = form ?? (text ? parse(text) : undefined)
  await delay(250)
  for (const r of routes) {
    if (r.method !== method) continue
    const m = path.match(r.re)
    if (!m) continue
    const params = Object.fromEntries(r.keys.map((k, i) => [k, decodeURIComponent(m[i + 1]!)]))
    const out = await r.handler({ method, path, query: url.searchParams, body, params })
    if (out && typeof out === 'object' && 'status' in out && 'body' in out) {
      const o = out as { status: number; body: unknown }
      return json(o.status, o.body)
    }
    if (out instanceof Response) return out
    return out === undefined ? json(204, null) : json(200, out)
  }
  return json(404, { error: { code: 'NOT_FOUND', message: `mock: ${method} ${path}` } })
}
