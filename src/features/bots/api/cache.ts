import type { Bot, UpdateBotInput } from '@push/api-client'

const defined = <T extends Record<string, unknown>>(patch: T): Partial<T> =>
  Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined)) as Partial<T>

const companyOrder = (a: Bot, b: Bot) => {
  const byTime = b.updatedAt.localeCompare(a.updatedAt)
  return byTime !== 0 ? byTime : b.id.localeCompare(a.id)
}

export const applyBotPatch = (bot: Bot, patch: Omit<UpdateBotInput, 'expectedRevision'>): Bot =>
  ({ ...bot, ...defined(patch) })

export const mergeServerBot = (previous: Bot | undefined, server: Bot): Bot => ({
  ...server,
  lastMessagePreview: previous?.lastMessagePreview ?? server.lastMessagePreview,
  unread: previous?.unread ?? server.unread,
  status: previous?.status ?? server.status,
  revision: server.revision,
})

export const insertCreatedBot = (bots: Bot[], created: Bot): Bot[] => {
  const rest = bots.filter((b) => b.id !== created.id)
  const pushBots = rest.filter((b) => b.kind === 'push')
  const companyBots = rest.filter((b) => b.kind === 'company')
  const sortedCompany = [...companyBots, ...(created.kind === 'company' ? [created] : [])].sort(companyOrder)
  if (created.kind === 'push') return [created, ...sortedCompany]
  return [...pushBots, ...sortedCompany]
}

export const withoutBot = (bots: Bot[], id: string): Bot[] => bots.filter((b) => b.id !== id)

export const markBotReadInList = (bots: Bot[], id: string): Bot[] =>
  bots.map((b) => (b.id === id ? { ...b, unread: false } : b))

export const unreadBotCount = (bots: Bot[] | undefined): number => (bots ?? []).filter((b) => b.unread).length
