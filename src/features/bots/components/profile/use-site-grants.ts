import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { BotAddress } from '../../types'
import { fetchSiteGrants, revokeSiteGrant, type SiteGrant } from './site-grants'

const grantsKey = (address: BotAddress) => ['bots', 'site-grants', address] as const

export const useSiteGrants = (address: BotAddress) => {
  const q = useQuery({ queryKey: grantsKey(address), queryFn: () => fetchSiteGrants(address) })
  return { grants: q.data ?? [], count: q.isSuccess ? (q.data?.length ?? 0) : 0 }
}

export const useRevokeSiteGrant = (address: BotAddress) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (host: string) => revokeSiteGrant(address, host),
    onSuccess: (_void, host) => {
      qc.setQueryData<SiteGrant[]>(grantsKey(address), (prev) => prev?.filter((grant) => grant.host !== host) ?? [])
    },
  })
}
