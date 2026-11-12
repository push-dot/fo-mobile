import { describe, expect, it } from 'vitest'
import { needsTerms, type Consent } from '@push/api-client'
import '../chat'
import '../home'
import { mockFetch } from '../server'

const call = async (method: string, path: string, body?: unknown) => {
  const res = await mockFetch(new Request(`http://x/api/v1/${path}`, { method, body: body === undefined ? undefined : JSON.stringify(body), headers: { 'Content-Type': 'application/json' } }))
  return (await res.json()) as { data: Consent }
}

describe('terms mock', () => {
  it('lets the default signed-in user skip the re-consent screen, and sends a new phone sign-in to the terms', async () => {
    expect(needsTerms((await call('GET', 'me/consents')).data)).toBe(false)
    await call('POST', 'auth/phone/verify', { code: '482915' })
    expect(needsTerms((await call('GET', 'me/consents')).data)).toBe(true)
  })
})
