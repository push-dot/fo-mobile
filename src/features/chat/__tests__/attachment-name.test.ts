import { describe, expect, it } from 'vitest'
import { isChatAttachment } from '../constants'

describe('isChatAttachment', () => {
  it('accepts the four file kinds a chat takes, in any case', () => {
    expect(['cv.pdf', 'cv.DOCX', 'notes.txt', 'notes.md'].map(isChatAttachment)).toEqual([true, true, true, true])
  })

  it('refuses what the Android picker lets through as any text or untyped file', () => {
    expect(['data.csv', 'page.html', 'archive.zip', 'pdf', 'notes.md.exe'].map(isChatAttachment)).toEqual([false, false, false, false, false])
  })
})
