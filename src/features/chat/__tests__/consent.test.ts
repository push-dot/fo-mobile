import { ApiError } from '@push/api-client'
import { describe, expect, it } from 'vitest'
import { isConsentRequired } from '../utils/consent'

describe('reference-data consent gate', () => {
  it('opens only on 403 CONSENT_REQUIRED', () => {
    expect(isConsentRequired(new ApiError('reference data consent is required', 'CONSENT_REQUIRED', 403))).toBe(true)
    expect(isConsentRequired(new ApiError('reference data consent is required', 'CONSENT_REQUIRED', 400))).toBe(false)
    expect(isConsentRequired(new ApiError('used up', 'FEATURE_DISABLED', 403))).toBe(false)
    expect(isConsentRequired(new Error('CONSENT_REQUIRED'))).toBe(false)
  })
})
