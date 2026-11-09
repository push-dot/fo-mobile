import { router, useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import { ScrollView } from 'react-native'
import { ProposalSheet, proposalSubtitle, useOfferBookmarks, useProfile, useSendOffer } from '@/features/hub'
import { Sheet } from '@/shared/components'

const param = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value)

const ProposalSheetScreen = () => {
  const userId = param(useLocalSearchParams<{ userId?: string }>().userId)
  const profile = useProfile(userId ?? '')
  const bookmarks = useOfferBookmarks(!!userId)
  const [message, setMessage] = useState('')
  const [postingId, setPostingId] = useState<string>()
  const [error, setError] = useState<string | null>(null)
  const send = useSendOffer(userId ?? '', message, postingId, () => router.back(), setError)
  const p = profile.data

  useEffect(() => {
    if (!userId) router.back()
  }, [userId])

  if (!userId) return null

  return (
    // The sheet is taller than the space above the keyboard, so it scrolls to reach 제안 보내기 and a drag hides the keyboard.
    <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive" automaticallyAdjustKeyboardInsets>
      <Sheet
        action={{ label: '제안 보내기', onPress: () => send.mutate(), disabled: !message.trim() || send.isPending }}
      >
        <ProposalSheet
          name={p?.displayName ?? ''}
          subtitle={p ? proposalSubtitle(p) : ''}
          message={message}
          postingId={postingId}
          postings={bookmarks.data?.data ?? []}
          error={error}
          onMessage={setMessage}
          onPosting={setPostingId}
          onError={setError}
          onClose={() => router.back()}
        />
      </Sheet>
    </ScrollView>
  )
}

export default ProposalSheetScreen
