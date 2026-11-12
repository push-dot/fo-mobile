import { http } from '@/shared/infrastructure'
import type { BotAddress } from '../../types'

export type SiteGrant = { host: string; kind: 'posting' | 'company' | 'other'; grantedAt: string }

export const fetchSiteGrants = async (address: BotAddress) => {
  const body = await http.get<{ data: SiteGrant[] }>(`bots/${address}/site-grants`)
  return body.data
}

export const revokeSiteGrant = (address: BotAddress, host: string) =>
  http.delete<void>(`bots/${address}/site-grants/${encodeURIComponent(host)}`)
