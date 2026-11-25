
type Req = { method: string; path: string; query: URLSearchParams; body: unknown; params: Record<string, string> }
type Handler = (req: Req) => unknown | Promise<unknown>
type Route = { method: string; re: RegExp; keys: string[]; handler: Handler }

const routes: Route[] = []

export const MOCK_USER_ID = 'dev'

export const mock = (method: string, pattern: string, handler: Handler) => {
  const keys: string[] = []
  const re = new RegExp(
    '^' + pattern.replace(/^\/+/, '').replace(/:([a-zA-Z]+)/g, (_, k: string) => (keys.push(k), '([^/]+)')) + '$',
  )
  routes.push({ method, re, keys, handler })
}

const PDF = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]>>endobj
trailer<</Root 1 0 R>>
%%EOF
`
export const pdfResponse = () =>
  new Response(Uint8Array.from(PDF, (ch) => ch.charCodeAt(0)), { headers: { 'Content-Type': 'application/pdf' } })

export const sortPosts = <T extends { viewCount: number; commentCount: number }>(items: T[], query: URLSearchParams) => {
  const sort = query.get('sort') ?? 'latest'
  if (!['latest', 'views', 'comments'].includes(sort)) {
    return { fail: { status: 422, body: { error: { code: 'VALIDATION_ERROR', message: 'unsupported sort', details: { field: 'sort' } } } } }
  }
  const by = sort === 'views' ? 'viewCount' : sort === 'comments' ? 'commentCount' : null
  return { rows: by ? [...items].sort((a, b) => b[by] - a[by]) : items }
}

export const page = <T>(items: T[], query: URLSearchParams, withTotal = false) => {
  const limit = Number(query.get('limit') ?? 20)
  const start = Number(query.get('cursor') ?? 0)
  const slice = items.slice(start, start + limit)
  const next = start + limit < items.length ? String(start + limit) : null
  return { data: slice, page: { nextCursor: next, hasMore: next !== null, ...(withTotal ? { total: items.length } : {}) } }
}

export type Rule = { kind: 'hang' | 'fail' | 'empty'; method: string; re: RegExp }
let rules: Rule[] = []
export const setRules = (next: Rule[]) => {
  rules = next
}
const HANG_MS = 10 * 60_000

const json = (status: number, body: unknown) =>
  new Response(status === 204 ? null : JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

export const mockFetch: typeof fetch = async (input, init) => {
  const req = input instanceof Request ? input : new Request(input, init)
  const url = new URL(req.url)
  const path = url.pathname.replace(/^.*\/api\/v1\//, '')
  const method = req.method.toUpperCase()
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
  const rule = rules.find((x) => x.method === method && (x.re.test(path) || x.re.test(path + url.search)))
  if (rule?.kind === 'hang') await delay(HANG_MS)
  if (rule?.kind === 'fail') return json(500, { error: { code: 'INTERNAL', message: 'mock: injected failure' } })
  for (const r of routes) {
    if (r.method !== method) continue
    const m = path.match(r.re)
    if (!m) continue
    const params = Object.fromEntries(r.keys.map((k, i) => [k, decodeURIComponent(m[i + 1]!)]))
    const out = await r.handler({ method, path, query: url.searchParams, body, params })
    if (rule?.kind === 'empty' && out && typeof out === 'object' && 'data' in out && Array.isArray(out.data)) {
      const pg = (out as { page?: Record<string, unknown> }).page
      return json(200, { ...out, data: [], page: pg && { ...pg, nextCursor: null, hasMore: false, ...('total' in pg ? { total: 0 } : {}) } })
    }
    if (out instanceof Response) return out
    if (out && typeof out === 'object' && 'status' in out && 'body' in out) {
      const o = out as { status: number; body: unknown }
      return json(o.status, o.body)
    }
    return out === undefined ? json(204, null) : json(200, out)
  }
  return json(404, { error: { code: 'NOT_FOUND', message: `mock: ${method} ${path}` } })
}
