import { describe, expect, it } from 'vitest'
import { applyDoc } from './apply-doc'

const item = { id: 's1', fileName: '이력서.pdf', mimeType: 'application/pdf', size: 1, pageCount: null }

describe('applyDoc', () => {
  it('labels AI documents and uploads from the sources list', () => {
    const createdAt = new Date(2026, 9, 12).toISOString()
    expect(applyDoc({ ...item, origin: 'AI', createdAt })).toEqual({ id: 's1', name: '이력서.pdf', ai: true, note: 'AI로 맞춘 서류 · 10월 12일' })
    expect(applyDoc({ ...item, origin: 'UPLOAD', createdAt: null })).toEqual({ id: 's1', name: '이력서.pdf', ai: false, note: '원본' })
  })
})
