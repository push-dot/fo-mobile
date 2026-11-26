import { queryOptions, useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { ApiError } from '@push/api-client'
import type { Bot, BotAddress, BotColor, BotId, BotLimit, BotProfile, BotSchedule, CompanyBot, NewSchedule } from '../types'
import { pollIntervalOf } from '../utils/live-state'
import { createBot, createSchedule, deleteBot, deleteSchedule, fetchBotProfile, fetchBots, fetchSchedules, markBotRead, revokeAllowedSite, searchBots, setScheduleEnabled, updateBot } from './fetchers'

type BotList = { bots: Bot[]; limit: BotLimit | undefined }

const BOTS = ['bots'] as const
const LIST = [...BOTS, 'list'] as const
const detailKey = (address: BotAddress) => [...BOTS, 'detail', address] as const

export const botListQuery = queryOptions({ queryKey: LIST, queryFn: fetchBots })

export const useBots = ({ live = false }: { live?: boolean } = {}) => {
  const q = useQuery({ ...botListQuery, refetchInterval: (query) => pollIntervalOf(query.state.data?.bots, live) })
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
  return { data: q.data, isLoading: q.isLoading, isFetching: q.isFetching, isError: q.isError, refetch: () => void q.refetch() }
}

export const useBot = (address: BotAddress) => {
  const list = useQuery(botListQuery)
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

const writeBot = (qc: QueryClient, id: BotId, update: (bot: Bot) => Bot | null) => {
  qc.setQueryData<BotList>(LIST, (prev) => prev && { ...prev, bots: prev.bots.flatMap((b) => (b.id === id ? (update(b) ?? []) : [b])) })
  qc.setQueriesData<BotProfile>({ queryKey: [...BOTS, 'detail'] }, (prev) => {
    const next = prev?.bot.id === id ? update(prev.bot) : null
    return prev && next ? { ...prev, bot: next } : prev
  })
}

type Patch = { bot: Bot; patch: { notificationsMuted?: boolean; color?: BotColor } }

export const patchBotMutation = (qc: QueryClient) => ({
  mutationFn: ({ bot, patch }: Patch) => updateBot(bot.id, { expectedRevision: bot.revision, ...patch }),
  onMutate: async ({ bot, patch }: Patch) => {
    await qc.cancelQueries({ queryKey: BOTS })
    const before = snapshot(qc)
    writeBot(qc, bot.id, (b) => {
      const muted = patch.notificationsMuted ?? b.muted
      return b.kind === 'push' ? { ...b, muted } : { ...b, muted, color: patch.color ?? b.color }
    })
    return before
  },
  onError: (error: unknown, _vars: Patch, before: Snapshot | undefined) => {
    if (before) restore(qc, before)
    if (error instanceof ApiError && error.code === 'REVISION_CONFLICT') void qc.invalidateQueries({ queryKey: BOTS })
  },
  onSuccess: (server: Bot) => writeBot(qc, server.id, () => server),
})

const usePatchBot = () => useMutation(patchBotMutation(useQueryClient())).mutateAsync

export const useSetBotColor = () => {
  const patch = usePatchBot()
  return async (bot: CompanyBot, color: BotColor) => void (await patch({ bot, patch: { color } }))
}

export const useSetBotMuted = () => {
  const patch = usePatchBot()
  return async (bot: Bot, muted: boolean) => void (await patch({ bot, patch: { notificationsMuted: muted } }))
}

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

export const useRevokeAllowedSite = () => {
  const qc = useQueryClient()
  const m = useMutation({
    mutationFn: ({ bot, host }: { bot: Bot; host: string }) => revokeAllowedSite(bot.id, host),
    onMutate: async ({ bot, host }) => {
      await qc.cancelQueries({ queryKey: BOTS })
      const before = snapshot(qc)
      qc.setQueriesData<BotProfile>({ queryKey: [...BOTS, 'detail'] }, (prev) =>
        prev?.bot.id === bot.id && prev.allowedSites ? { ...prev, allowedSites: prev.allowedSites.filter((s) => s.host !== host) } : prev,
      )
      return before
    },
    onError: (_error, _vars, before) => before && restore(qc, before),
  })
  return async (bot: Bot, host: string) => void (await m.mutateAsync({ bot, host }))
}

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

const schedulesKey = (id: BotId) => [...BOTS, 'schedules', id] as const

export const useBotSchedules = (id: BotId | undefined) => {
  const q = useQuery({ queryKey: schedulesKey(id ?? ('' as BotId)), queryFn: () => fetchSchedules(id!), enabled: id !== undefined })
  return { data: q.data, isLoading: q.isLoading, isFetching: q.isFetching, isError: q.isError, refetch: () => void q.refetch() }
}

export const useCreateSchedule = (id: BotId) => {
  const qc = useQueryClient()
  const m = useMutation({
    mutationFn: (body: NewSchedule) => createSchedule(id, body),
    onSuccess: (made) => qc.setQueryData<BotSchedule[]>(schedulesKey(id), (prev) => [...(prev ?? []), made]),
  })
  return { create: m.mutateAsync, isPending: m.isPending }
}

const useScheduleEdit = <V extends { scheduleId: string }>(
  id: BotId,
  send: (vars: V) => Promise<unknown>,
  edit: (list: BotSchedule[], vars: V) => BotSchedule[],
) => {
  const qc = useQueryClient()
  const key = schedulesKey(id)
  return useMutation({
    mutationFn: send,
    onMutate: async (vars: V) => {
      await qc.cancelQueries({ queryKey: key })
      const before = qc.getQueryData<BotSchedule[]>(key)
      qc.setQueryData<BotSchedule[]>(key, (prev) => prev && edit(prev, vars))
      return before
    },
    onError: (_error, _vars, before) => qc.setQueryData(key, before),
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  }).mutateAsync
}

export const useToggleSchedule = (id: BotId) => {
  const toggle = useScheduleEdit(
    id,
    ({ scheduleId, enabled }: { scheduleId: string; enabled: boolean }) => setScheduleEnabled(id, scheduleId, enabled),
    (list, { scheduleId, enabled }) => list.map((s) => (s.id === scheduleId ? { ...s, enabled } : s)),
  )
  return async (scheduleId: string, enabled: boolean) => void (await toggle({ scheduleId, enabled }))
}

export const useDeleteSchedule = (id: BotId) => {
  const remove = useScheduleEdit(
    id,
    ({ scheduleId }: { scheduleId: string }) => deleteSchedule(id, scheduleId),
    (list, { scheduleId }) => list.filter((s) => s.id !== scheduleId),
  )
  return async (scheduleId: string) => void (await remove({ scheduleId }))
}
