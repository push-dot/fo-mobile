import { router, useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import { ProposalSheet, proposalSubtitle, useOfferPostings, useProfile, useSendOffer } from '@/features/hub'
import { Sheet, useSheetScrollMax } from '@/shared/components'

const param = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value)

const ProposalSheetScreen = () => {
  const userId = param(useLocalSearchParams<{ userId?: string }>().userId)
  const profile = useProfile(userId ?? '')
  const ownPostings = useOfferPostings(!!userId)
  const [message, setMessage] = useState('')
  const [postingId, setPostingId] = useState<string>()
  const [error, setError] = useState<string | null>(null)
  const send = useSendOffer(userId ?? '', message, postingId, () => router.back(), setError)
  const p = profile.data
  const bound = useSheetScrollMax()

  useEffect(() => {
    if (!userId) router.back()
  }, [userId])

  if (!userId) return null

  return (
    <Sheet onLayout={bound.onSheetLayout} action={{ label: '제안 보내기', onPress: () => send.mutate(), disabled: !message.trim() || send.isPending }}>
        <ProposalSheet
          name={p?.displayName ?? ''}
          subtitle={p ? proposalSubtitle(p) : ''}
          message={message}
          postingId={postingId}
          postings={ownPostings.data ?? []}
          maxHeight={bound.maxHeight}
          onScrollLayout={bound.onScrollLayout}
          error={error}
          onMessage={setMessage}
          onPosting={setPostingId}
          onError={setError}
        />
    </Sheet>
  )
}

export default ProposalSheetScreen
