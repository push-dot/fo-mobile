import { api } from '../../../shared/infrastructure'
import { TERMS_VERSION } from '../constants'

export const sendPhoneCode = (phone: string) => api.auth.phoneSend(phone)

export const verifyPhoneCode = (body: { phone: string; code: string; pendingToken?: string }) => api.auth.phoneVerify(body)

export const readConsents = (accessToken: string) => api.me.consents(accessToken)

export const saveTerms = (accessToken: string, marketing: boolean) =>
  api.me.updateTerms(
    { age14: true, serviceTerms: true, privacy: true, marketing, termsVersion: TERMS_VERSION },
    accessToken,
  )
