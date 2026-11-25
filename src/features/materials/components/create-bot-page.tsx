import { router } from 'expo-router'
import { botChatPath, botHomePath, type Bot } from '@/features/bots'
import { CREATE_PICK_HINT } from '../constants'
import BotPickSheet from './bot-pick-sheet'

const MaterialCreateBotPage = () => (
  <BotPickSheet
    title={CREATE_PICK_HINT}
    onPick={(bot: Bot) => {
      router.dismissTo(botHomePath)
      router.push(botChatPath(bot.kind === 'push' ? 'push' : bot.id))
    }}
  />
)

export default MaterialCreateBotPage
