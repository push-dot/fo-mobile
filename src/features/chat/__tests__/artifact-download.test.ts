import { ApiError, createClient } from '@push/api-client'
import { describe, expect, it, vi } from 'vitest'
import { cacheName, downloadArtifact } from '../api/artifact-download'

const clientWith = (reply: () => Response) => {
  const requests: Request[] = []
  const fetch = vi.fn(async (input: RequestInfo | URL) => (requests.push(input as Request), reply()))
  const client = createClient({ baseUrl: 'https://api.test/api/v1', getToken: () => 'tok', fetch })
  return { requests, get: (path: string) => client.raw('GET', path) }
}

describe('downloadArtifact', () => {
  it('downloads with the session token and saves the bytes to a cache file', async () => {
    const { requests, get } = clientWith(() => new Response(new Uint8Array([37, 80, 68, 70]), { status: 200 }))
    const save = vi.fn(async (name: string) => `file:///cache/${name}`)
    const uri = await downloadArtifact({ get, save }, '/conversations/c1/artifacts/05_final_resume.pdf', '05_final_resume.pdf')
    expect(uri).toBe('file:///cache/05_final_resume.pdf')
    expect(requests[0]!.url).toBe('https://api.test/api/v1/conversations/c1/artifacts/05_final_resume.pdf')
    expect(requests[0]!.headers.get('Authorization')).toBe('Bearer tok')
    expect(save).toHaveBeenCalledWith('05_final_resume.pdf', new Uint8Array([37, 80, 68, 70]))
  })

  it('rejects without saving when the server refuses the file', async () => {
    const { get } = clientWith(() =>
      new Response(JSON.stringify({ error: { code: 'NOT_FOUND', message: 'resource not found' } }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    const save = vi.fn(async () => 'file:///cache/x')
    const error = await downloadArtifact({ get, save }, '/conversations/c1/artifacts/x.pdf', 'x.pdf').catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ code: 'NOT_FOUND', status: 404 })
    expect(save).not.toHaveBeenCalled()
  })

  it('keeps cache file names inside the cache directory', () => {
    expect(cacheName('../05_최종 이력서.pdf')).toBe('.._05_최종_이력서.pdf')
    expect(cacheName('')).toBe('artifact')
  })
})
