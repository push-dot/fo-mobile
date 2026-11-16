import { expect, it } from 'vitest'

const call = async (method: string, path: string) => {
  await import('../index')
  const { mockFetch } = await import('../server')
  const res = await mockFetch(`http://x/api/v1/${path}`, { method })
  return { status: res.status, res, json: res.status === 204 || res.headers.get('Content-Type')?.includes('pdf') ? null : ((await res.json()) as { data: { id: string; title: string; viewCount: number; commentCount: number }[]; page: { total?: number } }) }
}

const ids = async (path: string) => (await call('GET', path)).json!.data.map((p) => p.id)

it('sorts my posts, my commented posts and my saved posts by views or comments, newest first on ties', async () => {
  const views = (await call('GET', 'me/posts?sort=views')).json!.data.map((p) => p.viewCount)
  expect(views).toEqual([...views].sort((a, b) => b - a))
  const comments = (await call('GET', 'me/posts?sort=comments')).json!.data.map((p) => p.commentCount)
  expect(comments).toEqual([...comments].sort((a, b) => b - a))
  expect((await ids('me/posts?sort=latest'))[0]).toBe('mp1')
  expect(await ids('me/commented-posts?sort=views')).toEqual(['cp1', 'cp2'])
  expect(await ids('me/saved-posts?sort=views')).toEqual(['post-3', 'post-5'])
  expect(await ids('me/saved-posts?sort=comments')).toEqual(['post-3', 'post-5'])
})

it('rejects an unknown sort with 422 like push-be', async () => {
  for (const path of ['me/posts', 'me/commented-posts', 'me/saved-posts']) expect((await call('GET', `${path}?sort=popular`)).status).toBe(422)
})

it('saves and unsaves a post, newest save first, idempotent, 404 for a post that does not exist', async () => {
  expect((await call('POST', 'posts/post-1/save')).status).toBe(204)
  expect((await call('POST', 'posts/post-1/save')).status).toBe(204)
  expect(await ids('me/saved-posts')).toEqual(['post-1', 'post-3', 'post-5'])
  expect((await call('DELETE', 'posts/post-1/save')).status).toBe(204)
  expect((await call('DELETE', 'posts/post-1/save')).status).toBe(204)
  expect(await ids('me/saved-posts')).toEqual(['post-3', 'post-5'])
  expect((await call('POST', 'posts/nope/save')).status).toBe(404)
})

it('serves the profile PDF', async () => {
  const { status, res } = await call('GET', 'me/profile/pdf')
  expect(status).toBe(200)
  expect(res.headers.get('Content-Type')).toBe('application/pdf')
})
