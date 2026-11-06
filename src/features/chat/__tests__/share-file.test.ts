import { describe, expect, it, vi } from 'vitest'

const auth = vi.hoisted(() => [] as (string | null)[])
vi.mock('@/shared/infrastructure', async () => {
  const { createApi, createClient } = await import('@push/api-client')
  const { mockFetch } = await import('@/mock')
  const fetch = (req: Request) => (auth.push(req.headers.get('Authorization')), mockFetch(req))
  const http = createClient({ baseUrl: 'http://x/api/v1', getToken: () => 'token', fetch: fetch as typeof globalThis.fetch, uuid: () => 'k' })
  return { api: createApi(http), http, API_MOCK: true }
})
vi.mock('@/features/my', () => ({ myApi: {} }))

const { fetchDocumentPdf, fetchSourceBytes } = await import('../api/fetchers')
const { exclusive, pdfName, shareErrorText } = await import('../utils/share')
const { FILE_SHARE_FAILED, FILE_SHARE_NOT_FINALIZED } = await import('../constants')
const head = (bytes: Uint8Array) => String.fromCharCode(...bytes.slice(0, 5))

describe('result file share', () => {
  it('downloads the document export PDF with the session token', async () => {
    auth.length = 0
    const pdf = await fetchDocumentPdf('src-upload')
    expect(pdf.title).toBe('김서준_모아페이_백엔드')
    expect(head(pdf.bytes)).toBe('%PDF-')
    expect(auth).toEqual(['Bearer token', 'Bearer token'])
  })

  it('downloads an upload as its stored bytes', async () => {
    expect(head(await fetchSourceBytes('s1'))).toBe('%PDF-')
  })

  it('says a document that is not finalized cannot be shared, from the server 422', async () => {
    const error = await fetchDocumentPdf('d-draft').catch((e: unknown) => e)
    expect(error).toMatchObject({ status: 422, code: 'DOCUMENT_NOT_FINALIZED' })
    expect(shareErrorText(error)).toBe(FILE_SHARE_NOT_FINALIZED)
  })

  it('fails with the retry message when the card has no document', async () => {
    for (const id of ['', 'missing']) expect(shareErrorText(await fetchDocumentPdf(id).catch((e: unknown) => e))).toBe(FILE_SHARE_FAILED)
  })

  it('names an export as the PDF it is', () => {
    expect(pdfName('김서준_모아페이_백엔드')).toBe('김서준_모아페이_백엔드.pdf')
    expect(pdfName('이력서.pdf')).toBe('이력서.pdf')
    expect(pdfName('경력기술서.DOCX')).toBe('경력기술서.pdf')
    expect(pdfName('v1.2_이력서')).toBe('v1.2_이력서.pdf')
  })
})

describe('double tap on 공유', () => {
  it('runs the share once while one is in flight, and again after it settles', async () => {
    const once = exclusive()
    let finish = () => {}
    const job = vi.fn(() => new Promise<void>((r) => (finish = r)))
    const first = once(job)
    await once(job)
    expect(job).toHaveBeenCalledTimes(1)
    finish()
    await first
    const again = once(job)
    expect(job).toHaveBeenCalledTimes(2)
    finish()
    await again
  })

  it('frees the lock after a failed share', async () => {
    const once = exclusive()
    await expect(once(() => Promise.reject(new Error('x')))).rejects.toThrow('x')
    const job = vi.fn(async () => {})
    await once(job)
    expect(job).toHaveBeenCalledTimes(1)
  })
})
