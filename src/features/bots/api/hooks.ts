import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { ApiError } from '@push/api-client'
import type { Bot, BotAddress, BotColor, BotId, BotLimit, BotProfile, CompanyBot } from '../types'
import { pollIntervalOf } from '../utils/live-state'
import { createBot, deleteBot, fetchBotProfile, fetchBots, markBotRead, searchBots, updateBot } from './fetchers'

type BotList = { bots: Bot[]; limit: BotLimit | undefined }

const BOTS = ['bots'] as const
const LIST = [...BOTS, 'list'] as const
const detailKey = (address: BotAddress) => [...BOTS, 'detail', address] as const

/**
 * Push Bot first, then company bots in server order. The app never re-sorts.
 * `live` is the bot home's focus: it refetches when the home comes into focus and polls while a run is under way.
 */
export const useBots = ({ live = false }: { live?: boolean } = {}) => {
  const q = useQuery({ queryKey: LIST, queryFn: fetchBots, refetchInterval: (query) => pollIntervalOf(query.state.data?.bots, live) })
  const { refetch } = q
  const wasLive = useRef(live)
  useEffect(() => {
    if (live && !wasLive.current) void refetch()
    wasLive.current = live
  }, [live, refetch])
  return { data: q.data?.bots, limit: q.data?.limit, isLoading: q.isLoading, isError: q.isError, refetch: () => void refetch() }
}

const listed = (list: BotList | undefined, address: BotAddress) =>
  list?.bots.find((b) => (address === 'push' ? b.kind === 'push' : b.id === address))

export const useBotProfile = (address: BotAddress) => {
  const q = useQuery({ queryKey: detailKey(address), queryFn: () => fetchBotProfile(address) })
  return { data: q.data, isLoading: q.isLoading, isError: q.isError, refetch: () => void q.refetch() }
}

/** One bot by address. The list cache answers first, so `'push'` draws while the list is loading or failed. */
export const useBot = (address: BotAddress) => {
  const list = useQuery({ queryKey: LIST, queryFn: fetchBots })
  const cached = listed(list.data, address)
  const one = useQuery({ queryKey: detailKey(address), queryFn: () => fetchBotProfile(address), enabled: !cached })
  const data = cached ?? one.data?.bot
  return { data, isLoading: !data && one.isLoading, isError: !data && one.isError, refetch: () => void one.refetch() }
}

export const useBotSearch = (q: string) => {
  const query = q.trim()
  const r = useQuery({ queryKey: [...BOTS, 'search', query], queryFn: () => searchBots(query), enabled: query !== '' })
  return { data: r.data, isLoading: r.isLoading }
}

export const useCreateBot = () => {
  const qc = useQueryClient()
  const m = useMutation({ mutationFn: createBot, onSettled: () => qc.invalidateQueries({ queryKey: LIST }) })
  return { create: m.mutateAsync, isPending: m.isPending }
}

type Snapshot = { list: BotList | undefined; details: [readonly unknown[], BotProfile | undefined][] }

const snapshot = (qc: QueryClient): Snapshot => ({
  list: qc.getQueryData<BotList>(LIST),
  details: qc.getQueriesData<BotProfile>({ queryKey: [...BOTS, 'detail'] }),
})

const restore = (qc: QueryClient, s: Snapshot) => {
  qc.setQueryData(LIST, s.list)
  for (const [key, data] of s.details) qc.setQueryData(key, data)
}

/** Applies `update` to one bot in the list and in every profile that shows it. Null drops it from the list. */
const writeBot = (qc: QueryClient, id: BotId, update: (bot: Bot) => Bot | null) => {
  qc.setQueryData<BotList>(LIST, (prev) => prev && { ...prev, bots: prev.bots.flatMap((b) => (b.id === id ? (update(b) ?? []) : [b])) })
  qc.setQueriesData<BotProfile>({ queryKey: [...BOTS, 'detail'] }, (prev) => {
    const next = prev?.bot.id === id ? update(prev.bot) : null
    return prev && next ? { ...prev, bot: next } : prev
  })
}

/** Optimistic. A failure restores what was drawn, and a revision conflict also reloads the bots. */
const usePatchBot = () => {
  const qc = useQueryClient()
  const m = useMutation({
    mutationFn: ({ bot, patch }: { bot: Bot; patch: { notificationsMuted?: boolean; color?: BotColor } }) =>
      updateBot(bot.id, { expectedRevision: bot.revision, ...patch }),
    onMutate: async ({ bot, patch }) => {
      await qc.cancelQueries({ queryKey: BOTS })
      const before = snapshot(qc)
      writeBot(qc, bot.id, (b) => {
        const muted = patch.notificationsMuted ?? b.muted
        return b.kind === 'push' ? { ...b, muted } : { ...b, muted, color: patch.color ?? b.color }
      })
      return before
    },
    onError: (error, _vars, before) => {
      if (before) restore(qc, before)
      if (error instanceof ApiError && error.code === 'REVISION_CONFLICT') void qc.invalidateQueries({ queryKey: BOTS })
    },
    onSuccess: (server) => writeBot(qc, server.id, () => server),
  })
  return m.mutateAsync
}

export const useSetBotColor = () => {
  const patch = usePatchBot()
  return async (bot: CompanyBot, color: BotColor) => void (await patch({ bot, patch: { color } }))
}

export const useSetBotMuted = () => {
  const patch = usePatchBot()
  return async (bot: Bot, muted: boolean) => void (await patch({ bot, patch: { notificationsMuted: muted } }))
}

/** Erases the bot, its chat, and its work history on the server. The Push Bot cannot be deleted, so it is not accepted. */
export const useDeleteBot = () => {
  const qc = useQueryClient()
  const m = useMutation({
    mutationFn: (bot: CompanyBot) => deleteBot(bot.id),
    onMutate: async (bot) => {
      await qc.cancelQueries({ queryKey: BOTS })
      const before = snapshot(qc)
      writeBot(qc, bot.id, () => null)
      return before
    },
    onError: (_error, _bot, before) => before && restore(qc, before),
    onSuccess: (_v, bot) => qc.removeQueries({ queryKey: detailKey(bot.id) }),
  })
  return async (bot: CompanyBot) => void (await m.mutateAsync(bot))
}

/** Idempotent. The row loses its unread state at once and gets it back if the server refuses. */
export const useMarkBotRead = () => {
  const qc = useQueryClient()
  const m = useMutation({
    mutationFn: (bot: Bot) => markBotRead(bot.id),
    onMutate: async (bot) => {
      await qc.cancelQueries({ queryKey: LIST })
      const before = snapshot(qc)
      writeBot(qc, bot.id, (b) => ({ ...b, unread: false }))
      return before
    },
    onError: (_error, _bot, before) => before && restore(qc, before),
  })
  return async (bot: Bot) => void (await m.mutateAsync(bot))
}
