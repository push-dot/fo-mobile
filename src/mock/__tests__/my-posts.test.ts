import { expect, it } from 'vitest'

const get = async (path: string) => {
  await import('../index')
  const { mockFetch } = await import('../server')
  return (await mockFetch(`http://x/api/v1/${path}`)).json() as Promise<{ data: { id: string; body?: string; parentId?: string }[] | { id: string } }>
}

it('resolves my post detail and comments next to the social posts', async () => {
  expect(await get('posts/mp1')).toMatchObject({ data: { id: 'mp1' } })
  expect((await get('posts/mp1/comments')).data).toHaveLength(2)
  expect(await get('posts/post-1')).toMatchObject({ data: { id: 'post-1' } })
})
