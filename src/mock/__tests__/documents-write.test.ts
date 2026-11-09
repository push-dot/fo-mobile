import { expect, it } from 'vitest'

const call = async (method: string, path: string, body?: unknown) => {
  await import('../index')
  const { mockFetch } = await import('../server')
  const res = await mockFetch(`http://x/api/v1/${path}`, { method, body: body === undefined ? undefined : JSON.stringify(body), headers: { 'content-type': 'application/json' } })
  return { status: res.status, json: (await res.json()) as { data?: { title: string; revision: number; status: string }; error?: { code: string; details?: unknown }; page?: { total?: number } } }
}

it('renames a document and bumps its revision, 409 on a stale revision', async () => {
  const ok = await call('PATCH', 'documents/d2', { expectedRevision: 1, title: '새 이름' })
  expect(ok.json.data).toMatchObject({ title: '새 이름', revision: 2 })
  const stale = await call('PATCH', 'documents/d2', { expectedRevision: 1, title: '또' })
  expect(stale.status).toBe(409)
  expect(stale.json.error).toMatchObject({ code: 'REVISION_CONFLICT', details: { currentRevision: 2 } })
})

it('rejects a bad body and an empty title', async () => {
  expect((await call('PATCH', 'documents/d3', { title: 'x' })).json.error?.code).toBe('VALIDATION_ERROR')
  expect((await call('PATCH', 'documents/d3', { expectedRevision: 1, title: '' })).status).toBe(400)
  expect((await call('PATCH', 'documents/nope', { expectedRevision: 1 })).status).toBe(404)
})

it('archives a document, keeps it in the list, and then takes no writes', async () => {
  expect((await call('POST', 'documents/d4/archive', { expectedRevision: 9 })).status).toBe(409)
  expect((await call('POST', 'documents/d4/archive', { expectedRevision: 1 })).json.data).toMatchObject({ status: 'ARCHIVED', revision: 2 })
  const list = await call('GET', 'documents')
  expect((list.json.data as unknown as { id: string; status: string }[]).find((d) => d.id === 'd4')?.status).toBe('ARCHIVED')
  const write = await call('PATCH', 'documents/d4', { expectedRevision: 2, title: 'x' })
  expect(write.json.error?.code).toBe('INVALID_TRANSITION')
})

it('reports the total of my posts like push-be', async () => {
  expect((await call('GET', 'me/posts?limit=3')).json.page?.total).toBe(8)
})
