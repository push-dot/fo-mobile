import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiError, type Bot, type UpdateBotInput } from '@push/api-client'
import {
  applyBotPatch,
  insertCreatedBot,
  markBotReadInList,
  mergeServerBot,
  unreadBotCount,
  withoutBot,
} from './cache'
import {
  createBot,
  createBotConversation,
  deleteBot,
  fetchBot,
  fetchBotConversations,
  fetchBotLibrary,
  fetchBots,
  fetchLinkPreview,
  markBotRead,
  searchBotCompanies,
  updateBot,
} from './fetchers'

type BotSection = 'conversations' | 'files' | 'links'

const sectionCursorKey = (section: BotSection) =>
  section === 'conversations' ? 'conversationCursor' : section === 'files' ? 'fileCursor' : 'linkCursor'

export const useBots = () => useQuery({ queryKey: ['bots'], queryFn: fetchBots })

export const useBot = (id: string) => {
  const qc = useQueryClient()
  const listed = () => qc.getQueryData<Bot[]>(['bots'])?.find((b) => b.id === id)
  return useQuery({ queryKey: ['bots', id], queryFn: () => fetchBot(id), initialData: listed })
}

export const useBotUnreadCount = () => unreadBotCount(useBots().data)

export const useCreateBot = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createBot,
    onSuccess: (created) => {
      qc.setQueryData<Bot[]>(['bots'], (prev) => insertCreatedBot(prev ?? [], created))
    },
  })
}

export const useUpdateBot = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ bot, patch }: { bot: Bot; patch: Omit<UpdateBotInput, 'expectedRevision'> }) =>
      updateBot(bot.id, { expectedRevision: bot.revision, ...patch }),
    onMutate: async ({ bot, patch }) => {
      await qc.cancelQueries({ queryKey: ['bots'] })
      const listPrev = qc.getQueryData<Bot[]>(['bots'])
      const detailPrev = qc.getQueryData<Bot>(['bots', bot.id])
      const next = applyBotPatch(bot, patch)
      if (listPrev) qc.setQueryData(['bots'], listPrev.map((b) => (b.id === bot.id ? next : b)))
      qc.setQueryData(['bots', bot.id], next)
      return { listPrev, detailPrev }
    },
    onError: (err, { bot }, ctx) => {
      if (ctx?.listPrev) qc.setQueryData(['bots'], ctx.listPrev)
      if (ctx?.detailPrev !== undefined) qc.setQueryData(['bots', bot.id], ctx.detailPrev)
      if (err instanceof ApiError && err.code === 'REVISION_CONFLICT') void qc.invalidateQueries({ queryKey: ['bots'] })
    },
    onSuccess: (server, { bot }) => {
      const merged = mergeServerBot(bot, server)
      qc.setQueryData<Bot[]>(['bots'], (prev) => (prev ?? []).map((b) => (b.id === bot.id ? merged : b)))
      qc.setQueryData(['bots', bot.id], merged)
    },
  })
}

export const useSetBotMuted = () => {
  const base = useUpdateBot()
  return {
    ...base,
    mutate: (args: { bot: Bot; muted: boolean }) => base.mutate({ bot: args.bot, patch: { notificationsMuted: args.muted } }),
    mutateAsync: (args: { bot: Bot; muted: boolean }) => base.mutateAsync({ bot: args.bot, patch: { notificationsMuted: args.muted } }),
  }
}

export const useDeleteBot = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (bot: Bot) => {
      if (bot.kind === 'push') throw new ApiError('default bot cannot be deleted', 'DEFAULT_BOT_PROTECTED', 403)
      return deleteBot(bot.id)
    },
    onMutate: async (bot) => {
      await qc.cancelQueries({ queryKey: ['bots'] })
      const listPrev = qc.getQueryData<Bot[]>(['bots'])
      const detailPrev = qc.getQueryData<Bot>(['bots', bot.id])
      qc.setQueryData<Bot[]>(['bots'], (prev) => withoutBot(prev ?? [], bot.id))
      qc.removeQueries({ queryKey: ['bots', bot.id] })
      return { listPrev, detailPrev, id: bot.id }
    },
    onError: (err, _bot, ctx) => {
      if (ctx?.listPrev) qc.setQueryData(['bots'], ctx.listPrev)
      if (ctx?.detailPrev !== undefined) qc.setQueryData(['bots', ctx.id], ctx.detailPrev)
      if (err instanceof ApiError && err.code === 'DEFAULT_BOT_PROTECTED' && ctx?.listPrev) {
        qc.setQueryData(['bots'], ctx.listPrev)
      }
    },
    onSuccess: (_v, bot) => {
      qc.removeQueries({ queryKey: ['bots', bot.id] })
    },
  })
}

export const useBotConversations = (id: string) =>
  useInfiniteQuery({
    queryKey: ['bots', id, 'conversations'],
    queryFn: ({ pageParam }) => fetchBotConversations(id, 50, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.page.nextCursor ?? undefined,
  })

export const useCreateBotConversation = (id: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { title: string; applicationId?: string }) => createBotConversation(id, body.title, body.applicationId),
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ['bots', id, 'conversations'] })
      void qc.invalidateQueries({ queryKey: ['bots', id, 'library'] })
    },
  })
}

export const useMarkBotRead = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (botId: string) => markBotRead(botId),
    onMutate: async (botId) => {
      await qc.cancelQueries({ queryKey: ['bots'] })
      const listPrev = qc.getQueryData<Bot[]>(['bots'])
      qc.setQueryData<Bot[]>(['bots'], (prev) => markBotReadInList(prev ?? [], botId))
      return { listPrev }
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.listPrev) qc.setQueryData(['bots'], ctx.listPrev)
    },
  })
}

export const useLinkPreview = () =>
  useMutation({
    mutationFn: (url: string) => fetchLinkPreview(url),
  })

export const useCompanySearch = (q: string) =>
  useInfiniteQuery({
    queryKey: ['bots', 'companies', q],
    queryFn: ({ pageParam }) => searchBotCompanies(q, 20, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.page.nextCursor ?? undefined,
    enabled: q !== '',
  })

export const useBotLibrary = (id: string) =>
  useQuery({
    queryKey: ['bots', id, 'library'],
    queryFn: () => fetchBotLibrary(id, { limit: 50 }),
  })

export const useBotLibrarySection = (id: string, section: BotSection) =>
  useInfiniteQuery({
    queryKey: ['bots', id, 'library', section],
    queryFn: ({ pageParam }) =>
      fetchBotLibrary(id, {
        limit: 50,
        section,
        [sectionCursorKey(section)]: pageParam,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last[section].nextCursor ?? undefined,
    select: (data) => {
      const flatItems =
        section === 'conversations'
          ? data.pages.flatMap((page) => page.conversations.items)
          : section === 'files'
            ? data.pages.flatMap((page) => page.files.items)
            : data.pages.flatMap((page) => page.links.items)
      return { ...data, flatItems }
    },
  })
