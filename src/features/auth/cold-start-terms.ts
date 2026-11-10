import type { Consent, Session } from '@push/api-client'
import { needsTerms } from '@push/api-client'

export type ColdStartTermsOutcome = 'current' | 'routed' | 'silent'

type TermsActions = {
  route: () => void
}

export const evaluateColdStartTerms = (consent: Consent, actions: TermsActions): ColdStartTermsOutcome => {
  if (!needsTerms(consent)) return 'current'
  actions.route()
  return 'routed'
}

export const runColdStartTermsCheck = async (
  session: Session,
  readConsents: (accessToken: string) => Promise<Consent>,
  actions: TermsActions,
): Promise<ColdStartTermsOutcome> => {
  try {
    const consent = await readConsents(session.accessToken)
    return evaluateColdStartTerms(consent, actions)
  } catch {
    return 'silent'
  }
}

export const shouldRunColdStartTermsForUser = (ranForUserId: string | null, userId: string) => ranForUserId !== userId
