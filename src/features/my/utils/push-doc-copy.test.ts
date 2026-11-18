import { describe, expect, it } from 'vitest'
import { copyBody, copyTitle, copyVersionBody } from './push-doc-copy'

describe('push doc copy', () => {
  it('adds 사본 to the title and keeps it inside push-be 300 characters', () => {
    expect(copyTitle('서버 개발자 이력서')).toBe('서버 개발자 이력서 사본')
    const long = copyTitle('가'.repeat(400))
    expect(Array.from(long)).toHaveLength(300)
    expect(long.endsWith(' 사본')).toBe(true)
  })

  it('copies posting, kind, template and language, with defaults push-be accepts', () => {
    expect(copyBody({ applicationId: 'a1', title: 'x', kind: 'HUB_PROFILE', template: 'MODERN', language: 'en' })).toEqual({
      applicationId: 'a1',
      title: 'x 사본',
      kind: 'HUB_PROFILE',
      template: 'MODERN',
      language: 'en',
    })
    expect(copyBody({ applicationId: 'a1', title: 'x', kind: 'RESUME' })).toMatchObject({ template: 'SIMPLE', language: 'ko' })
  })

  it('sends the version with only the block fields push-be accepts', () => {
    const body = copyVersionBody(3, { content: { type: 'doc' }, blocks: [{ id: 'b1', text: 't', claimStatus: 'OK' } as never, { id: 'b2', text: 'u', evidenceRefs: [] }] })
    expect(body).toEqual({ expectedRevision: 3, content: { type: 'doc' }, blocks: [{ id: 'b1', text: 't' }, { id: 'b2', text: 'u', evidenceRefs: [] }] })
  })
})
