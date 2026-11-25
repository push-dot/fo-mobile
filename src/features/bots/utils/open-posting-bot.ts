import { router } from 'expo-router'
import { findBotForPosting } from '../api/fetchers'
import { openBotNew } from './open-bot-new'
import { botChatPath } from './paths'

export const openPostingBot = (postingId: string) =>
  void findBotForPosting(postingId).then(
    (bot) => (bot ? router.push(botChatPath(bot.id)) : void openBotNew(postingId)),
    () => void openBotNew(postingId),
  )
