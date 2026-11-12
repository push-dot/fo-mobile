import { botApi } from '@/shared/infrastructure'
import type { BotAddress, BotColor, BotId, CreateBotResult, NewBot } from '../types'
import { toBotProfile, toBotSearch, toBots, toCompanyBot, toLinkCheck, toOneBot } from './schemas'

export const fetchBots = async () => {
  const res = await botApi.bots.list()
  return { bots: toBots(res.data), limit: res.limit }
}

export const fetchBotProfile = async (address: BotAddress) => toBotProfile(await botApi.bots.get(address))

export const searchBots = async (q: string) => toBotSearch((await botApi.bots.search(q)).data)

/** The caller's bot for the company of a posting, or null. The server decides what "same company" means. */
export const findBotForPosting = async (postingId: string) => toBots((await botApi.bots.list({ postingId })).data)[0] ?? null

export const checkLink = async (url: string) => toLinkCheck(await botApi.bots.linkPreview(url))

export const createBot = async (input: NewBot): Promise<CreateBotResult> => {
  const { bot, created } = await botApi.bots.create({ postingId: input.postingId, color: input.color, displayName: input.name?.trim() || undefined })
  return { bot: toCompanyBot(bot), existing: !created }
}

export const updateBot = async (id: BotId, body: { expectedRevision: number; notificationsMuted?: boolean; color?: BotColor }) =>
  toOneBot(await botApi.bots.update(id, body))

export const deleteBot = (id: BotId) => botApi.bots.remove(id)

export const markBotRead = (address: BotAddress) => botApi.bots.markRead(address)
