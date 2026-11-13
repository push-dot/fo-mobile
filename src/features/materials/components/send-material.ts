import { router } from 'expo-router'
import { attach } from '@/features/chat'
import { botChatPath, botHomePath, botPickPath, type Attachment, type Bot } from '@/features/bots'
import type { Material, SendContext } from '../types'
import { toAttachment } from '../utils/material-row'

/** 보내기: from the bot home it asks for a bot (BotPick); opened from a bot it attaches to that bot's composer and closes. */
export const sendMaterial = (context: SendContext, m: Material) => {
  if (context.from === 'home') return router.push(botPickPath(m))
  attach(context.botId, toAttachment(m))
  router.dismissTo(botChatPath(context.botId))
}

/** The material lands in the picked bot's composer only; the bot home stays mounted under the chat that opens. */
export const sendToBot = (bot: Bot, attachment: Attachment) => {
  attach(bot.id, attachment)
  router.dismissTo(botHomePath)
  router.push(botChatPath(bot.kind === 'push' ? 'push' : bot.id))
}
