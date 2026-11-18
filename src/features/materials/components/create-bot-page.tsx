import { router } from 'expo-router'
import { botChatPath, botHomePath, type Bot } from '@/features/bots'
import { CREATE_PICK_HINT } from '../constants'
import { BotPickSheet } from './send-bot-page'

/** 서류 가져오기 > Bot 채팅에서 새로 만들기: a sheet over the 자료 modal that asks which Bot, then opens that Bot's chat. */
export const MaterialCreateBotPage = () => (
  <BotPickSheet
    title={CREATE_PICK_HINT}
    onPick={(bot: Bot) => {
      router.dismissTo(botHomePath)
      router.push(botChatPath(bot.kind === 'push' ? 'push' : bot.id))
    }}
  />
)
