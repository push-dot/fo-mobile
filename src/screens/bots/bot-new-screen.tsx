import { router, useLocalSearchParams } from 'expo-router'
import { accountPath, botChatPath, BotNewSheet } from '@/features/bots'
import { askConsentThen } from '@/features/chat'
import { firstParam } from '@/shared/utility'

const BotNewScreen = () => {
  const postingId = firstParam(useLocalSearchParams<{ posting?: string }>().posting)
  return (
    <BotNewSheet
      postingId={postingId}
      onClose={() => router.back()}
      onOpenBot={(id) => router.replace(botChatPath(id))}
      onUpgrade={() => router.push(accountPath('plan'))}
      onConsentRequired={askConsentThen}
    />
  )
}

export default BotNewScreen
