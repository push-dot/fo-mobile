import { describe, expect, it } from 'vitest'
import { applyBody, applyDoc, splitApplyDocs } from './apply-doc'

const item = { id: 's1', fileName: '이력서.pdf', mimeType: 'application/pdf', size: 1, pageCount: null }

describe('applyDoc', () => {
  it('shows the date only, never how the document was made', () => {
    const createdAt = new Date(2026, 9, 12).toISOString()
    expect(applyDoc({ ...item, origin: 'AI', createdAt })).toEqual({ id: 's1', name: '이력서.pdf', ai: true, note: '10월 12일', kind: null, date: createdAt })
    expect(applyDoc({ ...item, origin: 'UPLOAD', createdAt: null })).toEqual({ id: 's1', name: '이력서.pdf', ai: false, note: '', kind: null, date: null })
  })

  it('splitApplyDocs puts portfolios into extras', () => {
    const resume = applyDoc({ ...item, origin: 'UPLOAD', createdAt: null, kind: 'RESUME' })
    const portfolio = applyDoc({ ...item, id: 's2', origin: 'UPLOAD', createdAt: null, kind: 'PORTFOLIO' })
    expect(splitApplyDocs([resume, portfolio])).toEqual({ main: [resume], extras: [portfolio] })
  })

  it('applyBody sends AI docs as documentIds and uploads as sourceIds', () => {
    const ai = applyDoc({ ...item, origin: 'AI', createdAt: null })
    const upload = applyDoc({ ...item, id: 's2', origin: 'UPLOAD', createdAt: null, kind: 'PORTFOLIO' })
    expect(applyBody(ai, [upload])).toEqual({ documentIds: ['s1'], sourceIds: ['s2'] })
  })
})
