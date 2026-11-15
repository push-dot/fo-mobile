import { router } from 'expo-router'
import { findBotForPosting } from '../api/fetchers'
import { botChatPath, botNewPath } from './paths'

/** Sends a posting to its Bot: the room that already reads it, else the new-Bot sheet with the posting picked. */
export const openPostingBot = (postingId: string) =>
  void findBotForPosting(postingId).then(
    (bot) => router.push(bot ? botChatPath(bot.id) : botNewPath(postingId)),
    () => router.push(botNewPath(postingId)),
  )
