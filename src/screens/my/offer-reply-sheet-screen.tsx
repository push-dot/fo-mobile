import { router, useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import { counterpart, ListSkeleton, RETRY_LABEL, useOffer, useOfferDecision } from '@/features/my'
import { Sheet, TextField } from '@/shared/components'

const TITLE = '어떻게 답장할까요?'

const OfferReplySheetScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [reply, setReply] = useState('')
  const offer = useOffer(id)
  const { accept } = useOfferDecision(id, reply, () => router.back())
  const o = offer.data
  if (!o)
    return (
      <Sheet
        title={TITLE}
        onClose={() => router.back()}
        action={offer.isPending ? undefined : { label: RETRY_LABEL, onPress: () => void offer.refetch() }}
      >
        {offer.isPending ? <ListSkeleton count={2} /> : null}
      </Sheet>
    )
  const who = counterpart(o, 'received')
  return (
    <Sheet
      title={TITLE}
      description="수락하면 내 연락처가 상대에게 보이고, 답장이 첫 메시지가 돼요."
      action={{
        label: accept.isPending ? '보내는 중' : '수락하고 보내기',
        onPress: () => accept.mutate(),
        disabled: accept.isPending,
      }}
    >
      <TextField
        accessibilityLabel="답장"
        multiline
        maxLength={500}
        value={reply}
        onChangeText={setReply}
        editable={!accept.isPending}
        style={{ minHeight: 72 }}
        placeholder={`${who.displayName} 님에게 답장을 써 주세요.`}
      />
    </Sheet>
  )
}

export default OfferReplySheetScreen
