import { describe, expect, it } from 'vitest'
import { usePhoneAuth } from './stores'

describe('usePhoneAuth', () => {
  it('keeps the social provider for the email pill until cleared', () => {
    usePhoneAuth.getState().beginSocial('pending', 'seojun.kim@gmail.com', 'google')
    expect(usePhoneAuth.getState()).toMatchObject({ mode: 'social', email: 'seojun.kim@gmail.com', provider: 'google' })
    usePhoneAuth.getState().beginPhone()
    expect(usePhoneAuth.getState().provider).toBeNull()
  })
})
