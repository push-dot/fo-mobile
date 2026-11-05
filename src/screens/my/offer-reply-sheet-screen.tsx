import { router, useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import { counterpart, useOffer, useOfferDecision } from '@/features/my'
import { Sheet, TextField } from '@/shared/components'

const OfferReplySheetScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [reply, setReply] = useState('')
  const { data: o } = useOffer(id)
  const { accept } = useOfferDecision(id, reply, () => router.back())
  if (!o) return null
  const who = counterpart(o, 'received')
  return (
    <Sheet
      title="어떻게 답장할까요?"
      description="수락하면 내 연락처가 상대에게 보이고, 답장이 첫 메시지가 돼요."
      action={{
        label: accept.isPending ? '보내는 중' : '수락하고 보내기',
        onPress: () => accept.mutate(),
        disabled: !reply.trim() || accept.isPending,
      }}
    >
      <TextField
        accessibilityLabel="답장"
        multiline
        max={500}
        value={reply}
        onChangeText={setReply}
        editable={!accept.isPending}
        placeholder={`${who.displayName} 님에게 답장을 써 주세요.`}
      />
    </Sheet>
  )
}

export default OfferReplySheetScreen
