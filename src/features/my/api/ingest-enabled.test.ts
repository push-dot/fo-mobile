import { describe, expect, it } from 'vitest'
import { ingestEnabled } from './ingest-enabled'

describe('ingestEnabled', () => {
  it('is false when job id is missing', () => {
    expect(ingestEnabled(undefined, true)).toBe(false)
    expect(ingestEnabled(undefined, false)).toBe(false)
    expect(ingestEnabled('', true)).toBe(false)
  })

  it('follows live when job id is present', () => {
    expect(ingestEnabled('job-1', false)).toBe(false)
    expect(ingestEnabled('job-1', true)).toBe(true)
  })
})
