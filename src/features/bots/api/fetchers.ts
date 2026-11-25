import { botApi } from '@/shared/infrastructure'
import type { BotAddress, BotColor, BotId, CreateBotResult, NewBot, NewSchedule } from '../types'
import { toBotProfile, toBotSchedule, toBotSearch, toBots, toCompanyBot, toLinkCheck, toOneBot } from './schemas'

export const fetchBots = async () => {
  const res = await botApi.bots.list()
  return { bots: toBots(res.data), limit: res.limit }
}

export const fetchBotProfile = async (address: BotAddress) => toBotProfile(await botApi.bots.get(address))

export const searchBots = async (q: string) => toBotSearch((await botApi.bots.search(q)).data)

export const findBotForPosting = async (postingId: string) => toBots((await botApi.bots.list({ postingId })).data)[0] ?? null

export const checkLink = async (url: string) => toLinkCheck(await botApi.bots.linkPreview(url))

export const createBot = async (input: NewBot): Promise<CreateBotResult> => {
  const { bot, created } = await botApi.bots.create({ postingId: input.postingId, color: input.color, displayName: input.name?.trim() || undefined })
  return { bot: toCompanyBot(bot), existing: !created }
}

export const updateBot = async (id: BotId, body: { expectedRevision: number; notificationsMuted?: boolean; color?: BotColor }) =>
  toOneBot(await botApi.bots.update(id, body))

export const deleteBot = (id: BotId) => botApi.bots.remove(id)

export const revokeAllowedSite = (id: BotId, host: string) => botApi.bots.revokeSite(id, host)

export const markBotRead = (address: BotAddress) => botApi.bots.markRead(address)

export const fetchSchedules = async (id: BotId) => (await botApi.bots.schedules(id)).map(toBotSchedule)

export const createSchedule = async (id: BotId, body: NewSchedule) => toBotSchedule(await botApi.bots.createSchedule(id, body))

export const setScheduleEnabled = async (id: BotId, scheduleId: string, enabled: boolean) => toBotSchedule(await botApi.bots.updateSchedule(id, scheduleId, { enabled }))

export const deleteSchedule = (id: BotId, scheduleId: string) => botApi.bots.removeSchedule(id, scheduleId)
